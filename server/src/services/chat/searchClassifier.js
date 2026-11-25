/**
 * Search Intent Classifier.
 * Determines whether a user turn requires real-time web search or direct dialogue response.
 */

const CONVERSATIONAL_GREETINGS = [
  'good morning',
  'good afternoon',
  'good evening',
  'hi',
  'hello',
  'hey',
  'how are you',
  'how are you doing',
  'who are you',
  'what is your name',
  'thank you',
  'thanks',
  'thanks for your help',
  'goodbye',
  'bye',
  'have a great day',
  'have a nice day'
];

const EXPLICIT_SEARCH_TRIGGERS = [
  'search the web for',
  'search the web',
  'search for',
  'look up',
  'find sources about',
  'find sources on',
  'find out about',
  'google',
  'browse the web for',
  'search internet for',
  'what are the latest sources for'
];

const TEMPORAL_FACTUAL_TRIGGERS = [
  'latest',
  'current',
  'recent',
  'today',
  'this week',
  'this month',
  'release date',
  'latest release',
  'new version',
  'current price',
  'stock price',
  'weather in',
  'score of',
  'who won',
  'breaking news',
  '2024',
  '2025',
  '2026'
];

class SearchClassifier {
  /**
   * Evaluates if a user message should trigger a web search.
   * @param {string} message - Raw user input
   * @param {Object} options - Configuration and manual flags
   * @returns {{ shouldSearch: boolean, query: string, reason: string }}
   */
  classify(message, options = {}) {
    const raw = (message || '').trim();
    if (!raw) {
      return { shouldSearch: false, query: '', reason: 'empty_input' };
    }

    if (options.enableSearch === false) {
      return { shouldSearch: false, query: raw, reason: 'manually_disabled' };
    }

    const lower = raw.toLowerCase();

    const isPureGreeting = CONVERSATIONAL_GREETINGS.some((g) => {
      const clean = lower.replace(/[!.,?]/g, '').trim();
      return clean === g || (clean.startsWith(g + ' ') && clean.length < g.length + 15);
    });

    if (isPureGreeting && !EXPLICIT_SEARCH_TRIGGERS.some((t) => lower.includes(t))) {
      return { shouldSearch: false, query: raw, reason: 'conversational_turn' };
    }

    for (const trigger of EXPLICIT_SEARCH_TRIGGERS) {
      if (lower.includes(trigger)) {
        const query = this.extractQuery(raw, trigger);
        return { shouldSearch: true, query: query || raw, reason: 'explicit_search_request' };
      }
    }

    const hasTemporalTrigger = TEMPORAL_FACTUAL_TRIGGERS.some((t) => lower.includes(t));
    if (hasTemporalTrigger) {
      return { shouldSearch: true, query: raw, reason: 'temporal_factual_inquiry' };
    }

    return { shouldSearch: false, query: raw, reason: 'dialogue_turn' };
  }

  /**
   * Extracts clean search keywords from command-style sentences.
   */
  extractQuery(raw, trigger) {
    const idx = raw.toLowerCase().indexOf(trigger);
    if (idx !== -1) {
      let rest = raw.substring(idx + trigger.length).trim();
      rest = rest.replace(/^(?:for|about|on|regarding|to\s+find)\s+/i, '');
      rest = rest.replace(/[?!.]+$/, '').trim();
      if (rest.length > 2) return rest;
    }
    return raw;
  }
}

module.exports = { SearchClassifier };
