/**
 * Modular Language Model Client.
 * Connects to the local PyTorch Transformer language model inference API when available.
 */

class LanguageModelClient {
  constructor(options = {}) {
    this.apiUrl = (options.apiUrl || process.env.AI_MODEL_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs || 10000;
    this.modelName = 'custom-transformer-lm';
  }

  async generate({ prompt, maxNewTokens = 60, temperature = 0.7, topK = 5 }) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const startTime = Date.now();
      const res = await fetch(`${this.apiUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          prompt,
          max_new_tokens: maxNewTokens,
          temperature,
          top_k: topK
        }),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const err = new Error(
          errorData.detail || `Model inference failed with HTTP status ${res.status}`
        );
        err.status = res.status;
        err.code = 'MODEL_INFERENCE_ERROR';
        throw err;
      }

      const data = await res.json();
      const latencyMs = Date.now() - startTime;

      return {
        text: (data.generated_text || '').trim(),
        fullText: data.full_text || '',
        tokenCount: data.generated_token_count || 0,
        modelStatus: data.model_status || 'ready',
        latencyMs
      };
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        const timeoutErr = new Error(`AI Model generation timed out after ${this.timeoutMs}ms.`);
        timeoutErr.code = 'MODEL_TIMEOUT';
        timeoutErr.status = 504;
        throw timeoutErr;
      }
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        const offlineErr = new Error(
          `Local AI Model service is unreachable at ${this.apiUrl}.`
        );
        offlineErr.code = 'MODEL_OFFLINE';
        offlineErr.status = 503;
        throw offlineErr;
      }
      throw err;
    }
  }

  async getModelInfo() {
    try {
      const res = await fetch(`${this.apiUrl}/model-info`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }
}

module.exports = { LanguageModelClient };
