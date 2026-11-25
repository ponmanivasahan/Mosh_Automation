import { useState, useEffect } from 'react';
import { History, Bot } from 'lucide-react';
import AppShell from '../../../components/AppShell';
import ChatWindow from '../../../components/chat/ChatWindow';
import ChatInput from '../../../components/chat/ChatInput';
import HistorySidebar from '../../../components/chat/HistorySidebar';
import { useAuth } from '../../../utils/AuthContext';
import { customerLinks } from '../../../utils/customerLinks';
import {
  sendChatMessage,
  fetchChatHistory,
  clearChatHistory
} from '../../../services/chatApi';
import './CustomerChatPage.css';

const CustomerChatPage = () => {
  const { session } = useAuth();
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
      // Ignore silent history load failure
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

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
    <AppShell title="AI Assistant" links={customerLinks}>
      <div className="customer-chat-page">
        <div className="chat-page-header">
          <div className="chat-page-title-block">
            <div className="chat-page-icon-badge">
              <Bot size={20} />
            </div>
            <div>
              <h1>MOSH AI Assistant</h1>
              <p>Instant technical support, controller guidance, and live web-verified answers.</p>
            </div>
          </div>

          <button
            type="button"
            className="chat-history-trigger-btn"
            onClick={() => setShowHistoryDrawer((v) => !v)}
          >
            <History size={16} />
            <span>History</span>
            {dbHistory.length > 0 && <span className="chat-history-count">{dbHistory.length}</span>}
          </button>
        </div>

        <div className="chat-panel-card">
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

        <HistorySidebar
          isOpen={showHistoryDrawer}
          onClose={() => setShowHistoryDrawer(false)}
          history={dbHistory}
          onSelectQuestion={handleSelectHistoryItem}
          onClearHistory={handleClearDbHistory}
          userLabel={session?.name || session?.phone || 'Customer'}
        />
      </div>
    </AppShell>
  );
};

export default CustomerChatPage;
