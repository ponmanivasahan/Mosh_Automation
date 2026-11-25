import { useState, useEffect } from 'react';
import { Bot, X, History, Maximize2, Minimize2 } from 'lucide-react';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';
import HistorySidebar from './HistorySidebar';
import { useAuth } from '../../utils/AuthContext';
import {
  sendChatMessage,
  fetchChatHistory,
  clearChatHistory
} from '../../services/chatApi';
import '../../pages/customer/chat/CustomerChatPage.css';
import './FloatingChatWidget.css';

export default function FloatingChatWidget() {
  const { session } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [dbHistory, setDbHistory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [promptInput, setPromptInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [enableSearch, setEnableSearch] = useState(true);
  const [error, setError] = useState(null);

  const loadHistory = async () => {
    try {
      const data = await fetchChatHistory(50);
      setDbHistory(data.history || []);
    } catch {
      // Ignore silent history fetch error
    }
  };

  useEffect(() => {
    if (isOpen && session) {
      loadHistory();
    }
  }, [isOpen, session]);

  const handleSendMessage = async () => {
    const trimmed = promptInput.trim();
    if (!trimmed || isLoading) return;

    const userMessageId = `msg-${Date.now()}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newUserMsg = {
      id: userMessageId,
      role: 'user',
      text: trimmed,
      timestamp: nowTime
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setPromptInput('');
    setIsLoading(true);
    setError(null);

    const likelySearch = enableSearch && /search|latest|recent|current|who|what|where|news|release/i.test(trimmed);
    if (likelySearch) {
      setIsSearching(true);
    }

    try {
      const historyPayload = messages.slice(-8).map((m) => ({
        role: m.role,
        text: m.text
      }));

      const response = await sendChatMessage({
        message: trimmed,
        history: historyPayload,
        enableSearch
      });

      const botMessageId = `bot-${Date.now()}`;
      const newBotMsg = {
        id: botMessageId,
        role: 'assistant',
        text: response.reply || '(Empty response)',
        sources: response.sources || [],
        searched: response.searched || false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        meta: {
          latency_ms: response.latencyMs,
          model: response.model,
          tokens: response.tokens
        }
      };

      setMessages((prev) => [...prev, newBotMsg]);
      loadHistory();
    } catch (err) {
      setError(err.message || 'An error occurred during response generation.');
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const handleClearCurrentChat = () => {
    setMessages([]);
    setError(null);
  };

  const handleClearDbHistory = async () => {
    if (window.confirm('Are you sure you want to delete all saved chat history for your account?')) {
      try {
        await clearChatHistory();
        setDbHistory([]);
        setMessages([]);
      } catch (err) {
        setError('Failed to clear saved history: ' + err.message);
      }
    }
  };

  const handleSelectHistoryItem = (item) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `hist-q-${item.id}-${Date.now()}`,
        role: 'user',
        text: item.question,
        timestamp: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      {
        id: `hist-a-${item.id}-${Date.now()}`,
        role: 'assistant',
        text: item.reply,
        sources: item.sources || [],
        timestamp: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        meta: {
          latency_ms: item.latency_ms,
          model: item.model_used || 'Own Neural Core v2 (High-Speed)',
          tokens: item.tokens
        }
      }
    ]);
  };

  return (
    <>
      {isOpen && (
        <div
          className={`floating-chat-popup ${isMaximized ? 'is-maximized' : ''}`}
          role="dialog"
          aria-label="MOSH AI Assistant"
        >
          <div className="floating-chat-header">
            <div className="floating-chat-title">
              <div className="floating-chat-title-icon">
                <Bot size={18} />
              </div>
              <div>
                <h3>MOSH AI Assistant</h3>
                <span>Ask about controllers, pricing & support</span>
              </div>
            </div>

            <div className="floating-chat-actions">
              <button
                type="button"
                className="floating-chat-icon-btn"
                onClick={() => setShowHistoryDrawer((v) => !v)}
                title="Saved History"
                aria-label="Saved History"
              >
                <History size={16} />
              </button>
              <button
                type="button"
                className="floating-chat-icon-btn"
                onClick={() => setIsMaximized((v) => !v)}
                title={isMaximized ? 'Exit Full Screen' : 'Full Screen'}
                aria-label={isMaximized ? 'Exit Full Screen' : 'Full Screen'}
              >
                {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                type="button"
                className="floating-chat-icon-btn"
                onClick={() => {
                  setIsOpen(false);
                  setIsMaximized(false);
                }}
                title="Close Chat"
                aria-label="Close Chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="floating-chat-body">
            <ChatWindow
              messages={messages}
              isLoading={isLoading}
              isSearching={isSearching}
              error={error}
              onDismissError={() => setError(null)}
              onSelectPrompt={(p) => setPromptInput(p)}
            />

            <ChatInput
              value={promptInput}
              onChange={setPromptInput}
              onSend={handleSendMessage}
              onClear={handleClearCurrentChat}
              isLoading={isLoading}
              isDisabled={false}
              hasMessages={messages.length > 0}
              enableSearch={enableSearch}
              onToggleSearch={setEnableSearch}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        className={`floating-chat-fab ${isOpen ? 'is-open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close AI Chat' : 'Open AI Chat'}
        title={isOpen ? 'Close AI Chat' : 'MOSH AI Assistant'}
      >
        {!isOpen && <span className="floating-chat-pulse" aria-hidden="true" />}
        <span className="floating-chat-fab-icon">
          {isOpen ? <X size={22} /> : <Bot size={24} />}
        </span>
      </button>

      <HistorySidebar
        isOpen={showHistoryDrawer}
        onClose={() => setShowHistoryDrawer(false)}
        history={dbHistory}
        onSelectQuestion={handleSelectHistoryItem}
        onClearHistory={handleClearDbHistory}
        userLabel={session?.name || session?.phone || 'Customer'}
      />
    </>
  );
}
