import { useState } from 'react';
import {
  Bot,
  User,
  Globe,
  BookOpen,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Calendar,
  Zap,
  Cpu,
  FileText,
  Copy,
  Check
} from 'lucide-react';

function renderFormattedText(text, sources = []) {
  if (!text) return null;

  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    const isBullet = /^\s*[•\-*]\s+/.test(line);
    const cleanLine = isBullet ? line.replace(/^\s*[•\-*]\s+/, '') : line;

    const parts = [];
    const regex = /(\[(\d+)\])|(\*\*([^*]+)\*\*)|(`([^`]+)`)/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(cleanLine)) !== null) {
      if (match.index > lastIndex) {
        parts.push(cleanLine.substring(lastIndex, match.index));
      }

      if (match[1]) {
        const num = match[2];
        const matchingSource = sources.find((s) => s.id === parseInt(num, 10));
        parts.push(
          <a
            key={`cite-${lineIdx}-${match.index}`}
            href={matchingSource?.url || '#'}
            target={matchingSource?.url ? '_blank' : '_self'}
            rel="noopener noreferrer"
            className="chat-citation-pill"
            title={matchingSource ? `${matchingSource.title} (${matchingSource.domain})` : `Source [${num}]`}
          >
            [{num}]
          </a>
        );
      } else if (match[3]) {
        parts.push(<strong key={`bold-${lineIdx}-${match.index}`}>{match[4]}</strong>);
      } else if (match[5]) {
        parts.push(
          <code key={`code-${lineIdx}-${match.index}`} className="chat-inline-code">
            {match[6]}
          </code>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < cleanLine.length) {
      parts.push(cleanLine.substring(lastIndex));
    }

    return (
      <div
        key={lineIdx}
        className={isBullet ? 'chat-text-line chat-text-bullet' : 'chat-text-line'}
      >
        {isBullet && <span className="chat-bullet-dot">•</span>}
        {parts.length > 0 ? parts : <span>&nbsp;</span>}
      </div>
    );
  });
}

function formatModelDisplayName(modelName) {
  if (!modelName) return 'MOSH AI Neural Engine';
  const lower = String(modelName).toLowerCase();
  if (lower.includes('gemini') || lower.includes('gpt') || lower.includes('flash') || lower.includes('cloud')) {
    return 'Neural Core v2 (High-Speed)';
  }
  if (lower.includes('custom') || lower.includes('local') || lower.includes('fallback')) {
    return 'Neural Core (Local)';
  }
  if (lower.includes('dialogue') || lower.includes('clarification')) {
    return 'Dialogue Engine';
  }
  if (lower.includes('evidence')) {
    return 'Knowledge Synthesizer';
  }
  return 'MOSH AI Neural Engine';
}

export default function ChatMessage({ message }) {
  const [copied, setCopied] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(true);
  const isUser = message.role === 'user';
  const sources = message.sources || [];
  const hasSources = !isUser && sources.length > 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`chat-message-row ${isUser ? 'chat-user-row' : 'chat-bot-row'}`}>
      <div className={`chat-avatar ${isUser ? 'chat-user-avatar' : 'chat-bot-avatar'}`}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      <div className={`chat-bubble ${isUser ? 'chat-user-bubble' : 'chat-bot-bubble'}`}>
        <div className="chat-bubble-header">
          <span className="chat-sender-name">
            {isUser ? (
              'You'
            ) : message.searched ? (
              <span className="chat-sender-verified">
                MOSH AI Assistant <Globe size={12} /> Web Verified
              </span>
            ) : (
              'MOSH AI Assistant'
            )}
          </span>
          <span className="chat-message-time">{message.timestamp}</span>
        </div>

        <div className="chat-message-content">
          {renderFormattedText(message.text, sources)}
        </div>

        {hasSources && (
          <div className="chat-sources-container">
            <button
              type="button"
              className="chat-sources-toggle"
              onClick={() => setSourcesOpen(!sourcesOpen)}
            >
              <BookOpen size={14} />
              <span>Verified Web Sources ({sources.length})</span>
              {sourcesOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {sourcesOpen && (
              <div className="chat-sources-list">
                {sources.map((src) => (
                  <div key={src.id} className="chat-source-card">
                    <div className="chat-source-top">
                      <span className="chat-source-title">
                        <span className="chat-source-idx">[{src.id}]</span>
                        <a href={src.url} target="_blank" rel="noopener noreferrer" title={src.url}>
                          {src.title}
                        </a>
                      </span>
                      <span className="chat-source-domain">{src.domain}</span>
                    </div>

                    {src.snippet && <p className="chat-source-snippet">{src.snippet}</p>}

                    <div className="chat-source-footer">
                      <span className="chat-source-date">
                        {src.publishedDate ? (
                          <>
                            <Calendar size={12} /> {src.publishedDate}
                          </>
                        ) : (
                          <>
                            <Globe size={12} /> Verified Web Source
                          </>
                        )}
                      </span>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="chat-source-link"
                      >
                        Visit Link <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!isUser && (
          <div className="chat-meta-footer">
            <div className="chat-meta-stats">
              {message.meta?.latency_ms ? (
                <span className="chat-meta-pill" title="Response Latency">
                  <Zap size={11} /> {message.meta.latency_ms} ms
                </span>
              ) : null}
              {message.meta?.model ? (
                <span className="chat-meta-pill" title="Active Model Engine">
                  <Cpu size={11} /> {formatModelDisplayName(message.meta.model)}
                </span>
              ) : null}
              {message.meta?.tokens ? (
                <span className="chat-meta-pill" title="Token Output Count">
                  <FileText size={11} /> {message.meta.tokens} tokens
                </span>
              ) : null}
            </div>

            <button
              type="button"
              className="chat-copy-btn"
              onClick={handleCopy}
              title="Copy response text"
            >
              {copied ? (
                <>
                  <Check size={12} /> Copied
                </>
              ) : (
                <>
                  <Copy size={12} /> Copy
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
