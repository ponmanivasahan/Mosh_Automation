/**
 * Modular Web Search Service supporting Brave Search API and Tavily Search API.
 */

class SearchService {
  constructor(options = {}) {
    this.braveApiKey = (options.braveApiKey || process.env.BRAVE_SEARCH_API_KEY || '').trim();
    this.tavilyApiKey = (options.tavilyApiKey || process.env.TAVILY_API_KEY || '').trim();
    this.maxResults = options.maxResults || 5;
    this.timeoutMs = options.timeoutMs || 8000;
  }

  isConfigured() {
    return Boolean(this.tavilyApiKey || this.braveApiKey);
  }

  getProviderName() {
    if (this.tavilyApiKey) return 'tavily';
    if (this.braveApiKey) return 'brave';
    return 'none';
  }

  /**
   * Sanitizes untrusted snippet text to neutralize prompt injection attempts.
   */
  sanitizeText(raw) {
    if (!raw || typeof raw !== 'string') return '';

    let text = raw
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/(?:ignore|disregard|forget)\s+(?:all\s+)?(?:previous|prior|above)\s+instructions/gi, '[untrusted instruction removed]')
      .replace(/you\s+are\s+now\s+(?:a|an)\s+[^\.\n]+/gi, '[role override removed]')
      .replace(/(?:system|instruction|developer)\s*:/gi, '[tag removed]:')
      .replace(/\s+/g, ' ')
      .trim();

    if (text.length > 400) {
      text = text.substring(0, 397) + '...';
    }
    return text;
  }

  extractDomain(urlStr) {
    try {
      const parsed = new URL(urlStr);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return 'web';
    }
  }

  async search(query) {
    const cleanQuery = (query || '').trim();
    if (!cleanQuery) {
      throw new Error('Search query cannot be empty.');
    }

    if (process.env.NODE_ENV === 'test' && !this.isConfigured()) {
      return this._mockSearch(cleanQuery);
    }

    if (!this.isConfigured()) {
      const err = new Error(
        'Web search is not configured. Please set BRAVE_SEARCH_API_KEY or TAVILY_API_KEY in server/.env to enable live internet searches.'
      );
      err.code = 'SEARCH_API_KEY_MISSING';
      err.status = 503;
      throw err;
    }

    if (this.tavilyApiKey) {
      return await this._searchTavily(cleanQuery);
    }

    return await this._searchBrave(cleanQuery);
  }

  async _searchTavily(query) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          api_key: this.tavilyApiKey,
          query,
          search_depth: 'basic',
          max_results: this.maxResults,
          include_answer: true
        }),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const err = new Error(
          `Tavily Search API Error [${res.status}]: ${errorData.message || res.statusText || 'Search failed'}`
        );
        err.code = 'SEARCH_PROVIDER_ERROR';
        err.status = res.status;
        throw err;
      }

      const data = await res.json();
      const rawResults = Array.isArray(data.results) ? data.results : [];

      const formattedResults = rawResults.slice(0, this.maxResults).map((item, idx) => ({
        id: idx + 1,
        title: (item.title || 'Untitled Source').trim(),
        url: item.url,
        domain: this.extractDomain(item.url),
        snippet: this.sanitizeText(item.content || ''),
        publishedDate: item.published_date || null,
        score: typeof item.score === 'number' ? item.score : null
      }));

      return {
        query,
        provider: 'tavily',
        directAnswer: data.answer || null,
        results: formattedResults
      };
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        const timeoutErr = new Error(`Search request timed out after ${this.timeoutMs}ms.`);
        timeoutErr.code = 'SEARCH_TIMEOUT';
        timeoutErr.status = 504;
        throw timeoutErr;
      }
      throw err;
    }
  }

  async _searchBrave(query) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const endpoint = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${this.maxResults}`;

      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Subscription-Token': this.braveApiKey
        },
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const err = new Error(
          `Brave Search API Error [${res.status}]: ${errorData.message || res.statusText || 'Search failed'}`
        );
        err.code = 'SEARCH_PROVIDER_ERROR';
        err.status = res.status;
        throw err;
      }

      const data = await res.json();
      const rawResults = data.web && Array.isArray(data.web.results) ? data.web.results : [];

      const formattedResults = rawResults.slice(0, this.maxResults).map((item, idx) => ({
        id: idx + 1,
        title: (item.title || 'Untitled Source').trim(),
        url: item.url,
        domain: this.extractDomain(item.url),
        snippet: this.sanitizeText(item.description || ''),
        publishedDate: item.page_age || null,
        score: null
      }));

      return {
        query,
        provider: 'brave',
        directAnswer: null,
        results: formattedResults
      };
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        const timeoutErr = new Error(`Search request timed out after ${this.timeoutMs}ms.`);
        timeoutErr.code = 'SEARCH_TIMEOUT';
        timeoutErr.status = 504;
        throw timeoutErr;
      }
      throw err;
    }
  }

  _mockSearch(query) {
    return {
      query,
      provider: 'mock',
      directAnswer: 'Sample verified search answer.',
      results: []
    };
  }
}

module.exports = { SearchService };
