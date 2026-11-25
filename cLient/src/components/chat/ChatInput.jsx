import { useRef, useEffect } from 'react';
import { Globe, Trash2, Send, Loader2 } from 'lucide-react';

export default function ChatInput({
  value,
  onChange,
  onSend,
  onClear,
  isLoading,
  isDisabled,
  hasMessages,
  enableSearch,
  onToggleSearch
}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 160)}px`;
    }
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && !isDisabled && value.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="chat-input-container">
      <div className="chat-input-toolbar">
        <div className="chat-toolbar-left">
          <button
            type="button"
            className={`chat-search-toggle ${enableSearch ? 'active' : ''}`}
            onClick={() => onToggleSearch(!enableSearch)}
            title={enableSearch ? 'Web search enabled for factual queries' : 'Web search disabled'}
          >
            <Globe size={14} />
            <span>Live Web Search: {enableSearch ? 'ON' : 'OFF'}</span>
          </button>

          <span className="chat-input-hint">
            <kbd>Enter</kbd> to Send · <kbd>Shift</kbd> + <kbd>Enter</kbd> for new line
          </span>
        </div>

        {hasMessages && (
          <button
            type="button"
            className="chat-clear-btn"
            onClick={onClear}
            disabled={isLoading}
            title="Clear current chat"
          >
            <Trash2 size={14} />
            <span>Clear Chat</span>
          </button>
        )}
      </div>

      <div className="chat-input-box">
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about water level controllers, wiring, dry-run protection, or any technical question..."
          disabled={isDisabled || isLoading}
        />

        <div className="chat-input-actions">
          <span className="chat-char-count">{value.length} characters</span>

          <button
            type="button"
            className="chat-send-btn"
            onClick={onSend}
            disabled={isDisabled || isLoading || !value.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 size={15} className="chat-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span>Send</span>
                <Send size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
