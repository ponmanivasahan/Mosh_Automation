import { History, X, MessageSquare, Trash2 } from 'lucide-react';

export default function HistorySidebar({
  isOpen,
  onClose,
  history = [],
  onSelectQuestion,
  onClearHistory,
  userLabel
}) {
  if (!isOpen) return null;

  return (
    <div className="chat-drawer-backdrop" onClick={onClose}>
      <aside className="chat-history-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="chat-drawer-header">
          <div className="chat-drawer-title-group">
            <h3>
              <History size={17} />
              <span>Saved Conversations</span>
            </h3>
            <p className="chat-drawer-subtitle">
              History for <strong>{userLabel}</strong>
            </p>
          </div>
          <button type="button" className="chat-drawer-close" onClick={onClose} aria-label="Close history">
            <X size={18} />
          </button>
        </div>

        <div className="chat-drawer-body">
          {history.length === 0 ? (
            <div className="chat-empty-history">
              <MessageSquare size={28} className="chat-empty-history-icon" />
              <p>No conversations saved yet.</p>
              <span>
                Ask a question in the chat and it will automatically be saved to your account.
              </span>
            </div>
          ) : (
            <div className="chat-history-list">
              {history.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className="chat-history-card"
                  onClick={() => {
                    onSelectQuestion(item);
                    onClose();
                  }}
                >
                  <div className="chat-history-top">
                    <span className="chat-history-time">
                      {new Date(item.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span className="chat-history-id">#{item.id}</span>
                  </div>
                  <div className="chat-history-question">{item.question}</div>
                  <div className="chat-history-reply">{item.reply}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="chat-drawer-footer">
            <button
              type="button"
              className="chat-clear-history-btn"
              onClick={onClearHistory}
            >
              <Trash2 size={14} />
              <span>Clear Saved History</span>
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
