const { pool } = require('../config/db');
const { AssistantManager } = require('../services/chat/assistantManager');
const { normalizeText, invalidateQaCache, retrieveRelevantQa } = require('../services/chat/moshQaDataset');

const assistantManager = new AssistantManager();

/**
 * POST /api/chat
 * Processes user question, calls AI engine / web search, and stores Q&A in MySQL linked to users.id.
 */
const sendMessage = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { message, history = [], enableSearch = true } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }

    const cleanMessage = message.trim();

    // Generate AI reply
    const result = await assistantManager.processMessage({
      message: cleanMessage,
      history: Array.isArray(history) ? history : [],
      enableSearch: Boolean(enableSearch),
      provider: 'gemini'
    });

    // Save Q&A in chat_messages table
    await pool.query(
      `INSERT INTO chat_messages (user_id, question, reply, sources, latency_ms, tokens, model_used)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        cleanMessage,
        result.reply,
        JSON.stringify(result.sources || []),
        result.latencyMs || 0,
        result.tokens || 0,
        result.model || 'Own Neural Core v2'
      ]
    );

    return res.status(200).json({
      success: true,
      reply: result.reply,
      sources: result.sources || [],
      searched: result.searched || false,
      model: result.model || 'Own Neural Core v2 (High-Speed)',
      tokens: result.tokens || 0,
      latencyMs: result.latencyMs || 0
    });
  } catch (err) {
    console.error('[Chat] Error processing message:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to process message: ' + err.message
    });
  }
};

/**
 * GET /api/chat/history
 * Retrieves saved chat history for the authenticated user.
 */
const getHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10) || 50, 1), 200);

    const [rows] = await pool.query(
      `SELECT id, question, reply, sources, latency_ms, tokens, model_used, created_at
       FROM chat_messages
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, limit]
    );

    const history = rows.map((row) => {
      let parsedSources = [];
      if (row.sources) {
        if (typeof row.sources === 'string') {
          try {
            parsedSources = JSON.parse(row.sources);
          } catch {
            parsedSources = [];
          }
        } else if (Array.isArray(row.sources)) {
          parsedSources = row.sources;
        }
      }
      return {
        ...row,
        sources: parsedSources
      };
    });

    return res.status(200).json({ success: true, history });
  } catch (err) {
    console.error('[Chat] Error fetching history:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve chat history.'
    });
  }
};

/**
 * DELETE /api/chat/history
 * Clears all saved chat messages for the authenticated user.
 */
const clearHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const [result] = await pool.query('DELETE FROM chat_messages WHERE user_id = ?', [userId]);

    return res.status(200).json({
      success: true,
      deletedCount: result.affectedRows || 0,
      message: `Cleared ${result.affectedRows || 0} saved chat messages.`
    });
  } catch (err) {
    console.error('[Chat] Error clearing history:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear chat history.'
    });
  }
};

/**
 * POST /api/chat/feedback
 * Records customer feedback and flags incorrect/unhelpful answers for admin review.
 * Never auto-learns unverified customer suggestions.
 */
const submitFeedback = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { chatMessageId = null, question, botReply, isHelpful = false, reportedIssue = '' } = req.body || {};
    if (!question || !botReply) {
      return res.status(400).json({ success: false, message: 'Question and botReply are required.' });
    }

    const status = isHelpful ? 'approved' : 'pending_review';
    const [result] = await pool.query(
      `INSERT INTO chat_feedback (chat_message_id, user_id, question, bot_reply, is_helpful, reported_issue, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [chatMessageId, userId, String(question).trim(), String(botReply).trim(), Boolean(isHelpful), String(reportedIssue || '').trim() || null, status]
    );

    return res.status(201).json({
      success: true,
      feedbackId: result.insertId,
      flaggedForReview: !isHelpful,
      message: isHelpful
        ? 'Thank you for your feedback.'
        : 'Feedback recorded and flagged for admin review.'
    });
  } catch (err) {
    console.error('[Chat] Feedback error:', err);
    return res.status(500).json({ success: false, message: 'Failed to record feedback.' });
  }
};

/**
 * GET /api/chat/admin/review-queue
 * Admin-only: returns flagged feedback, frequent questions, and unanswered/low-match queries.
 */
const getAdminReviewQueue = async (req, res) => {
  try {
    const [flaggedFeedback] = await pool.query(
      `SELECT id, chat_message_id, user_id, question, bot_reply, reported_issue, status, created_at
       FROM chat_feedback
       WHERE status = 'pending_review'
       ORDER BY created_at DESC
       LIMIT 50`
    );

    const [recentQuestions] = await pool.query(
      `SELECT id, user_id, question, reply, model_used, created_at
       FROM chat_messages
       ORDER BY created_at DESC
       LIMIT 100`
    );

    // Identify unanswered / low-confidence questions that have no strong Q&A dataset match
    const unanswered = [];
    const frequencyMap = new Map();
    for (const row of recentQuestions) {
      const norm = normalizeText(row.question);
      frequencyMap.set(norm, {
        question: row.question,
        count: (frequencyMap.get(norm)?.count || 0) + 1
      });
      const matches = await retrieveRelevantQa(row.question, 1);
      if (matches.length === 0) {
        unanswered.push({
          id: row.id,
          question: row.question,
          reply: row.reply,
          created_at: row.created_at
        });
      }
    }

    const frequentQuestions = Array.from(frequencyMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    const [approvedExamples] = await pool.query(
      'SELECT id, original_question, intent, related_product_id, verified_answer, language, category, created_at FROM approved_qa_examples ORDER BY id DESC LIMIT 50'
    );

    return res.status(200).json({
      success: true,
      flaggedFeedback,
      unansweredQuestions: unanswered.slice(0, 25),
      frequentQuestions,
      approvedExamples
    });
  } catch (err) {
    console.error('[Chat] Admin review queue error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load review queue.' });
  }
};

/**
 * POST /api/chat/admin/approve
 * Admin-only: approves a verified/corrected Q&A example and refreshes the live retrieval cache.
 */
const approveQaExample = async (req, res) => {
  try {
    const adminId = req.user?.id || null;
    const {
      feedbackId = null,
      originalQuestion,
      intent,
      relatedProductId = null,
      verifiedAnswer,
      alternativePatterns = [],
      language = 'en',
      category = 'general'
    } = req.body || {};

    if (!originalQuestion || !intent || !verifiedAnswer) {
      return res.status(400).json({
        success: false,
        message: 'originalQuestion, intent, and verifiedAnswer are required.'
      });
    }

    const normalizedQuestion = normalizeText(originalQuestion);
    const patternsJson = JSON.stringify(Array.isArray(alternativePatterns) ? alternativePatterns : []);

    const [result] = await pool.query(
      `INSERT INTO approved_qa_examples
        (original_question, normalized_question, intent, related_product_id, verified_answer, alternative_patterns, language, category, approved_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(originalQuestion).trim(),
        normalizedQuestion,
        String(intent).trim(),
        relatedProductId ? String(relatedProductId).trim() : null,
        String(verifiedAnswer).trim(),
        patternsJson,
        String(language).trim(),
        String(category).trim(),
        adminId
      ]
    );

    if (feedbackId) {
      await pool.query("UPDATE chat_feedback SET status = 'approved' WHERE id = ?", [feedbackId]);
    }

    invalidateQaCache();

    return res.status(201).json({
      success: true,
      approvedId: result.insertId,
      message: 'Verified Q&A example approved and added to live chatbot retrieval.'
    });
  } catch (err) {
    console.error('[Chat] Admin approve error:', err);
    return res.status(500).json({ success: false, message: 'Failed to approve Q&A example.' });
  }
};

module.exports = {
  sendMessage,
  getHistory,
  clearHistory,
  submitFeedback,
  getAdminReviewQueue,
  approveQaExample
};
