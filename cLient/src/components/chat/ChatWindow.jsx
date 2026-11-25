import { useEffect, useRef } from 'react';
import { Sparkles, AlertTriangle, X, Globe, Bot } from 'lucide-react';
import ChatMessage from './ChatMessage';
import QuickPrompts from './QuickPrompts';

export default function ChatWindow({
  messages,
  isLoading,
  isSearching,
  error,
  onDismissError,
  onSelectPrompt
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isSearching, error]);

  return (
    <div className="chat-window">
      {error && (
        <div className="chat-alert-banner">
          <div className="chat-alert-content">
            <AlertTriangle size={16} className="chat-alert-icon" />
            <div>
              <strong>Notice</strong>
              <p>{error}</p>
            </div>
          </div>
          <button type="button" className="chat-alert-close" onClick={onDismissError} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}

      {messages.length === 0 ? (
        <div className="chat-empty-state">
          <div className="chat-empty-icon-wrap">
            <Sparkles size={26} />
          </div>
          <h2>How can I assist you today?</h2>
          <p className="chat-empty-desc">
            Ask MOSH AI Assistant about water level controllers, motor protection, installation, pricing, or any technical question.
          </p>
          <QuickPrompts onSelectPrompt={onSelectPrompt} disabled={isLoading} />
        </div>
      ) : (
        <div className="chat-messages-list">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {isSearching && (
            <div className="chat-message-row chat-bot-row">
              <div className="chat-avatar chat-bot-avatar">
                <Globe size={16} />
              </div>
              <div className="chat-bubble chat-bot-bubble chat-searching-bubble">
                <span className="chat-spinner" />
                <span>Searching the web and analyzing sources...</span>
              </div>
            </div>
          )}

          {isLoading && !isSearching && (
            <div className="chat-message-row chat-bot-row">
              <div className="chat-avatar chat-bot-avatar">
                <Bot size={16} />
              </div>
              <div className="chat-bubble chat-bot-bubble chat-loading-bubble">
                <div className="chat-typing-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="chat-loading-label">Formulating response...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
