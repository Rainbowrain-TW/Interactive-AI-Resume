import { useEffect, useMemo, useRef, useState } from 'react';
import type { ResumeData } from '../types/resume';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatPanelProps {
  resume?: ResumeData;
}

const initialMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content: '嗨！我是你的履歷助手，歡迎問我關於工作經驗、技能或專案的問題。'
  }
];

const API_URL =
  'https://script.google.com/macros/s/AKfycbxBeg1kmR8ODmcNIn2t3FxcDku0cfb_gXyzBMVqw9J0EyKuE3LJr9BxBOLkQBVBQS2i/exec';

const CID_KEY = 'interactive-ai-resume-cid';
const SID_KEY = 'interactive-ai-resume-sid';
const PREVIOUS_RESPONSE_KEY = 'interactive-ai-resume-previous-response-id';

const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getOrCreateLocalId = (key: string) => {
  const existing = localStorage.getItem(key);
  if (existing) {
    return existing;
  }
  const next = generateId();
  localStorage.setItem(key, next);
  return next;
};

const getOrCreateSessionId = (key: string) => {
  const existing = sessionStorage.getItem(key);
  if (existing) {
    return existing;
  }
  const next = generateId();
  sessionStorage.setItem(key, next);
  return next;
};

const getSessionValue = (key: string, fallback: string) => {
  const existing = sessionStorage.getItem(key);
  if (existing) {
    return existing;
  }
  sessionStorage.setItem(key, fallback);
  return fallback;
};

const ChatPanel = ({ resume }: ChatPanelProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cid] = useState(() => getOrCreateLocalId(CID_KEY));
  const [sid] = useState(() => getOrCreateSessionId(SID_KEY));
  const [previousResponseId, setPreviousResponseId] = useState(() =>
    getSessionValue(PREVIOUS_RESPONSE_KEY, 'none')
  );
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  const updatePreviousResponseId = (nextId: string) => {
    setPreviousResponseId(nextId);
    sessionStorage.setItem(PREVIOUS_RESPONSE_KEY, nextId);
  };

  const sendMessage = async () => {
    if (!canSend) {
      return;
    }

    const messageContent = input.trim();
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        redirect: "follow", // GAS 常會 redirect，這個很重要
        headers: {
          // 用 text/plain 避免觸發 preflight（不要用 application/json）
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          cid,
          sid,
          actionType: 'text',
          actionTarget: 'none',
          actionMessage: messageContent,
          previous_response_id: previousResponseId
        })
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = (await response.json()) as { id?: string; text?: string };
      const assistantMessage: ChatMessage = {
        id: data.id ?? `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.text ?? '目前沒有回覆內容。'
      };
      setMessages((prev) => [...prev, assistantMessage]);
      if (data.id) {
        updatePreviousResponseId(data.id);
      }
    } catch (error) {
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '抱歉，暫時無法取得回覆，請稍後再試。'
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  return (
    <section className="panel chat-panel">
      <header className="panel-header">
        <h2>Chat</h2>
        <p>AI 回覆</p>
      </header>
      <div className="chat-messages" aria-live="polite">
        {messages.map((message) => (
          <div key={message.id} className={`chat-message ${message.role}`}>
            <span className="chat-role">{message.role === 'user' ? '你' : 'AI'}</span>
            <p>{message.content}</p>
          </div>
        ))}
        {isLoading && (
          <div className="chat-message assistant">
            <span className="chat-role">AI</span>
            <div className="chat-loading" aria-label="AI 回覆中">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form className="chat-input" onSubmit={handleSubmit}>
        <textarea
          placeholder="輸入問題..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="聊天輸入"
          rows={2}
        />
        <button type="submit" disabled={!canSend}>
          {isLoading ? '回覆中' : '送出'}
        </button>
      </form>
    </section>
  );
};

export default ChatPanel;
