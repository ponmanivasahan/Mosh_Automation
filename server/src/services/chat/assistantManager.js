/**
 * Conversation & Web Search Assistant Manager.
 * Orchestrates multi-turn dialogue memory, intelligent search decisions,
 * grounded evidence synthesis with citations, Gemini cloud inference, and local model fallback.
 */

const { SearchClassifier } = require('./searchClassifier');
const { SearchService } = require('./searchService');
const { LanguageModelClient } = require('./modelClient');
const { retrieveRelevantQa, isDetailedRequest, decodeHtmlEntities } = require('./moshQaDataset');

class AssistantManager {
  constructor(options = {}) {
    this.searchService = options.searchService || new SearchService(options.searchConfig || {});
    this.searchClassifier = options.searchClassifier || new SearchClassifier();
    this.modelClient = options.modelClient || new LanguageModelClient(options.modelConfig || {});
    this.geminiConfig = options.geminiConfig || {
      apiKey: (process.env.GEMINI_API_KEY || '').trim(),
      model: (process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite').trim()
    };
    this.maxHistoryTurns = options.maxHistoryTurns || 6;
  }

  async processMessage({ message, history = [], enableSearch = true, provider = 'gemini' }) {
    const userMessage = (message || '').trim();
    if (!userMessage) {
      throw new Error('Message cannot be empty.');
    }

    const startTime = Date.now();

    // 1. Check for clarification on under-specified inputs
    const clarification = this._checkClarificationIntent(userMessage, history);
    if (clarification) {
      return {
        reply: clarification,
        searched: false,
        sources: [],
        model: 'own-dialogue-engine',
        tokens: clarification.split(/\s+/).length,
        latencyMs: Date.now() - startTime
      };
    }

    // 2. Intelligent Search Decision
    const searchDecision = this.searchClassifier.classify(userMessage, { enableSearch });

    if (searchDecision.shouldSearch && this.searchService.isConfigured()) {
      return await this._handleWebSearchFlow(userMessage, searchDecision.query, history, startTime);
    }

    // 3. Routing based on selected provider
    if (provider === 'gemini') {
      return await this._handleGeminiFlow(userMessage, history, startTime);
    }

    // 4. Conversational Dialogue Flow via Local Model
    return await this._handleConversationalFlow(userMessage, history, startTime);
  }

  async _handleGeminiFlow(userMessage, history, startTime) {
    const apiKey = (this.geminiConfig?.apiKey || process.env.GEMINI_API_KEY || '').trim();
    const primaryModel = (this.geminiConfig?.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();

    if (!apiKey) {
      return {
        reply: 'Intelligence Engine key is not configured. Please add GEMINI_API_KEY to server/.env to enable AI responses.',
        searched: false,
        sources: [],
        model: 'gemini-unconfigured',
        tokens: 0,
        latencyMs: Date.now() - startTime
      };
    }

    const candidateModels = [
      primaryModel,
      'gemini-3.8-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash'
    ];

    const contents = [
      ...history.slice(-8).map((h) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.text }]
      })),
      {
        role: 'user',
        parts: [{ text: userMessage }]
      }
    ];

    const relevantQa = await retrieveRelevantQa(userMessage, 5);
    const wantsDetail = isDetailedRequest(userMessage);
    const qaContextBlock = relevantQa.length > 0
      ? `\n\nVerified MOSH Automation Reference Q&A (Intent-Grouped):\n${relevantQa
          .map(
            (q, i) =>
              `[${i + 1}] Intent: ${q.intent}${q.relatedProductId ? ` | Product ID: ${q.relatedProductId}` : ''}\nQ: ${q.originalQuestion}\nShort: ${q.verifiedAnswer}\nTechnical: ${q.detailedAnswer}`
          )
          .join('\n\n')}`
      : '';

    const systemPromptText =
      'You are a helpful, natural customer support representative for MOSH Automation (Coimbatore, Tamil Nadu). ' +
      'Help customers with automatic water level controllers, dry-run protection, motor control, installation, compatibility, troubleshooting, pricing, warranty, ordering, and support. ' +
      'Reply in the same language and tone as the customer (natural English, Tamil, or natural Thanglish), handling spelling mistakes and informal phrasing gracefully. ' +
      (wantsDetail
        ? 'The customer asked for technical or detailed information, so explain clearly with verified specifications. '
        : 'Answer the exact question asked in a short, direct, natural way (2-4 sentences). Avoid unnecessary bullet points and excessive bold formatting. ') +
      'Never output HTML entities like &amp; or &lt;. Do not repeat information unnecessarily. ' +
      'If the customer requirement is unclear (for example, motor HP, single vs 3-phase, or sump/overhead setup is missing), ask a brief clarifying question. ' +
      'Strictly use ONLY verified MOSH Automation facts and prices from the reference Q&A below; if something is not in the verified data, say so honestly and direct them to +91 95147 14441 or admin@moshautomation.com.' +
      qaContextBlock;

    let lastError = null;

    for (const model of candidateModels) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPromptText }]
            },
            contents,
            generationConfig: {
              maxOutputTokens: wantsDetail ? 500 : 300,
              temperature: 0.4
            }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const msg = errorData.error?.message || `HTTP ${res.status}`;
          const err = new Error(msg);
          err.status = res.status;
          throw err;
        }

        const data = await res.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        const rawReply = parts
          .filter((p) => typeof p.text === 'string')
          .map((p) => p.text)
          .join('')
          .trim() || 'I could not generate a reply.';
        const reply = decodeHtmlEntities(rawReply);
        const tokens = data.usageMetadata?.totalTokenCount || 0;

        return {
          reply,
          searched: false,
          sources: [],
          model: model.startsWith('gemini') ? model : `gemini-${model}`,
          tokens,
          latencyMs: Date.now() - startTime
        };
      } catch (err) {
        lastError = err;
        console.warn(`[Chat] Gemini (${model}) error:`, err.message);
        const isTransient =
          err.name === 'AbortError' ||
          err.status === 503 ||
          err.status === 429 ||
          err.status === 404 ||
          /high demand|overloaded|unavailable|quota/i.test(err.message || '');
        if (!isTransient) {
          break;
        }
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    // Optional local PyTorch fallback only if explicitly running
    try {
      const localFallback = await this._handleConversationalFlow(userMessage, history, startTime);
      if (localFallback && localFallback.model !== 'offline') {
        return {
          ...localFallback,
          reply: localFallback.reply,
          model: 'custom-transformer-lm (local)'
        };
      }
    } catch {
      // Ignore if local model is not running
    }

    const kbReply = await this._moshKnowledgeFallback(userMessage);
    return {
      reply: kbReply,
      searched: false,
      sources: [],
      model: 'mosh-knowledge-engine',
      tokens: kbReply.split(/\s+/).length,
      latencyMs: Date.now() - startTime
    };
  }

  async _moshKnowledgeFallback(userMessage) {
    const matches = await retrieveRelevantQa(userMessage, 2);
    if (matches.length > 0) {
      const wantsDetail = isDetailedRequest(userMessage);
      return decodeHtmlEntities(wantsDetail ? matches[0].detailedAnswer : matches[0].verifiedAnswer);
    }

    const q = (userMessage || '').toLowerCase();

    if (/dry[\s-]*run|burn|empty|sump|borewell/i.test(q)) {
      return [
        '**MOSH Dry-Run Protection:**',
        '- Automatically monitors water flow/level in the underground sump or borewell.',
        '- If water runs dry, the controller trips the pump within seconds to protect motor windings and impellers from overheating.',
        '- Once water level recovers, it resumes normal automatic operation.'
      ].join('\n');
    }

    if (/price|cost|rate|quote|rs|₹|buy|order/i.test(q)) {
      return [
        '**MOSH Automation Controller Pricing Overview:**',
        '- **Timer-Based Water Level Controllers:** Starting around ₹2,900.',
        '- **Auto Change Dual-Tank Controllers (Sump + Overhead):** Starting around ₹3,200.',
        '- **Single-Phase with Dry-Run Protection:** Starting around ₹3,600.',
        '- All controllers include a **1-Year Replacement Warranty**. You can check exact models in the **Products** page or request a custom quote in **My Queries**.'
      ].join('\n');
    }

    if (/sensor|wire|wiring|install|float|magnetic|probe/i.test(q)) {
      return [
        '**MOSH Sensors & Installation:**',
        '- Uses **non-electrolytic magnetic reed / SS304 stainless steel sensors** operating on low-voltage AC to prevent rust and scaling.',
        '- Compatible with single-phase (up to 3HP) and three-phase (up to 15HP) monoblock, jet, openwell, and submersible pumps.',
        '- For site-specific wiring diagrams, visit **Help Center** or submit your motor details in **My Queries**.'
      ].join('\n');
    }

    if (/hello|hi|hey|good morning|good afternoon|good evening/i.test(q)) {
      return 'Hello! Welcome to **MOSH Automation**. Ask me about automatic water level controllers, dry-run protection, pricing, sensors, or installation guidance.';
    }

    return [
      'Here is how **MOSH Automation** can help you:',
      '- **Products:** Automatic Water Level Controllers for single-phase & 3-phase pumps (Sump + Overhead, Borewell, Wireless/GSM).',
      '- **Protection:** Built-in overflow cut-off and dry-run motor protection with 1-Year Replacement Warranty.',
      '- **Support:** Visit **Products** for specs/pricing or **My Queries** to get a custom quotation from our engineering team.'
    ].join('\n');
  }

  _checkClarificationIntent(message, history) {
    const lower = message.toLowerCase().trim().replace(/[?!.,]/g, '');

    if (lower === 'can i book' || lower === 'i want to book' || lower === 'book') {
      return 'Certainly! What date and time would you prefer to schedule?';
    }
    if (lower === 'tell me more' || lower === 'more details') {
      const lastTurn = history.length > 0 ? history[history.length - 1].text : '';
      if (lastTurn) {
        return 'Could you please specify which aspect of our previous message you would like more details about?';
      }
      return 'Could you please clarify which product or topic you would like more details about?';
    }
    if (lower === 'i have an issue' || lower === 'i have a problem') {
      return 'I am sorry to hear that. Could you please describe the specific issue so I can help resolve it?';
    }
    return null;
  }

  async _handleWebSearchFlow(userMessage, query, history, startTime) {
    try {
      const searchResult = await this.searchService.search(query);
      const results = searchResult.results || [];

      if (results.length === 0) {
        return {
          reply: `I searched the web for "${query}", but no reliable matching sources were found. Could you rephrase your question or specify additional keywords?`,
          searched: true,
          searchQuery: query,
          searchProvider: searchResult.provider,
          sources: [],
          model: 'evidence-synthesizer',
          tokens: 28,
          latencyMs: Date.now() - startTime
        };
      }

      const answer = this._synthesizeGroundedAnswer(userMessage, query, results, searchResult.directAnswer);

      return {
        reply: answer,
        searched: true,
        searchQuery: query,
        searchProvider: searchResult.provider,
        sources: results,
        model: 'evidence-grounded-assistant',
        tokens: answer.split(/\s+/).length,
        latencyMs: Date.now() - startTime
      };
    } catch (err) {
      console.warn('[Chat] Search execution warning:', err.message);
      return await this._handleGeminiFlow(userMessage, history, startTime);
    }
  }

  _synthesizeGroundedAnswer(userMessage, query, sources, directAnswer) {
    let synthesis = '';

    if (directAnswer && typeof directAnswer === 'string' && directAnswer.length > 15) {
      synthesis = `${directAnswer.trim()} [1]\n\n`;
    }

    const highlights = [];
    sources.slice(0, 3).forEach((src, idx) => {
      const citeNum = idx + 1;
      const snippet = src.snippet ? src.snippet.replace(/\n+/g, ' ') : '';
      if (snippet) {
        highlights.push(`- **${src.title}** (${src.domain}): ${snippet} [${citeNum}]`);
      }
    });

    if (highlights.length > 0) {
      if (!synthesis) {
        synthesis = `Based on live web search results for "${query}":\n\n`;
      }
      synthesis += highlights.join('\n\n');
    } else {
      synthesis = `Search results for "${query}" were retrieved from ${sources.length} sources [1]. Please refer to the sources below for complete details.`;
    }

    return synthesis;
  }

  async _handleConversationalFlow(userMessage, history, startTime) {
    const prompt = this._buildPromptWithHistory(userMessage, history);

    let modelResult;
    try {
      modelResult = await this.modelClient.generate({
        prompt,
        maxNewTokens: 60,
        temperature: 0.7,
        topK: 5
      });
    } catch (err) {
      console.warn('[Chat] Model client error:', err.message);
      return {
        reply: `Unable to communicate with the local custom AI model at ${this.modelClient.apiUrl}. Please verify the model service is running.`,
        searched: false,
        sources: [],
        model: 'offline',
        tokens: 0,
        latencyMs: Date.now() - startTime
      };
    }

    let reply = modelResult.text;

    if (reply.includes('AI:')) reply = reply.split('AI:')[1].trim();
    if (reply.includes('User:')) reply = reply.split('User:')[0].trim();
    reply = reply.trim();

    const hasPriorAssistantGreeting = history.some(
      (h) => h.role === 'assistant' && /^(?:good morning|hello|hi|good afternoon)/i.test(h.text)
    );

    if (hasPriorAssistantGreeting && /^(?:good morning!|hello!|hi!)/i.test(reply)) {
      reply = reply.replace(/^(?:good morning!|hello!|hi!|good afternoon!)\s*(?:how (?:are you|can I help)[^.?!]*[.?!])?\s*/i, '').trim();
      if (!reply) {
        reply = 'How can I assist you further?';
      }
    }

    return {
      reply: reply || 'How can I help you today?',
      searched: false,
      sources: [],
      model: this.modelClient.modelName,
      tokens: modelResult.tokenCount,
      latencyMs: Date.now() - startTime
    };
  }

  _buildPromptWithHistory(currentMessage, history) {
    const recent = history.slice(-this.maxHistoryTurns);

    if (recent.length === 0) {
      return `User: ${currentMessage.trim()}\nAI:`;
    }

    let formatted = '';
    for (const msg of recent) {
      if (msg.role === 'user') {
        formatted += `User: ${msg.text.trim()}\n`;
      } else {
        formatted += `AI: ${msg.text.trim()}\n`;
      }
    }

    formatted += `User: ${currentMessage.trim()}\nAI:`;
    return formatted;
  }
}

module.exports = { AssistantManager };
