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
    content: '嗨！我是你的履歷助手，歡迎問我關於 Johnny 的工作經驗、技能或專案等問題。'
  }
];

const quickQuestions = [
  'Johnny 是一位怎麼樣的工程師？',
  '介紹一下這個互動式 AI 履歷？',
  '高雄有什麼好吃的？',
  'Johnny 的專長是什麼？'
];

const API_URL =
  'https://script.google.com/macros/s/AKfycbxtiajVpb8kqLr-iKmWnVa1_BJtgwiEUDbPAHrvllhKkGb8U2Obsx_lZKSvI8iB-wSI/exec';

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

const formatTimestamp = (date: Date) => {
  const pad = (value: number) => value.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}/${month}/${day} ${hours}:${minutes}`;
};

const buildChatLog = (messages: ChatMessage[]) => {
  if (messages.length === 0) {
    return '（目前沒有對話內容）';
  }
  return messages
    .reduce<string[]>((segments, message, index) => {
      const label = message.role === 'user' ? '你' : 'AI';
      segments.push(`${label}: ${message.content}`);
      if (index < messages.length - 1) {
        segments.push(message.role === 'user' ? '--' : '==');
      }
      return segments;
    }, [])
    .join('\n\n');
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

  const sendMessageWithContent = async (content: string, clearInput = false) => {
    const messageContent = content.trim();
    if (isLoading || !messageContent) {
      return;
    }
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent
    };

    setMessages((prev) => [...prev, userMessage]);
    if (clearInput) {
      setInput('');
    }
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
    void sendMessageWithContent(input, true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessageWithContent(input, true);
    }
  };

  const handleQuickQuestion = (question: string) => {
    void sendMessageWithContent(question, true);
  };

  const handleDownloadChat = () => {
    const timestamp = formatTimestamp(new Date());
    const chatLog = buildChatLog(messages);
    const body =
      `Hi, 感謝您來使用我的互動式 AI 履歷.\n\n` +
      `這裡是我的公開資訊，歡迎來信聊聊。\n\n` +
      `Johnny Zhou 互動式 AI 履歷連結：https://rainbowrain-tw.github.io/Interactive-AI-Resume/\n` +
      `如果您在尋找合作伙伴：https://johnny-ai365-vibecoding-30days.github.io/day10-no.120-Landing-Page/\n` +
      `連絡方式： rainbowrain0930@gmail.com\n\n` +
      `--\n\n` +
      `[對話記錄][${timestamp}]\n` +
      `${chatLog}`;

    const blob = new Blob([body], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'JohnnyJhou_AI-Resume-Chat.md';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const resumePdfUrl = `${import.meta.env.BASE_URL}JohnnyJhou.pdf`;

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
      <div className="quick-questions" aria-label="快速提問">
        <p className="quick-questions-title">快速提問</p>
        <div className="quick-questions-list">
          {quickQuestions.map((question) => (
            <button
              key={question}
              type="button"
              className="quick-question"
              onClick={() => handleQuickQuestion(question)}
              disabled={isLoading}
            >
              {question}
            </button>
          ))}
        </div>
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
      <div className="action-widget" aria-label="工具">
        <button type="button" className="action-widget-button" aria-label="開啟工具">
          ☰
        </button>
        <div className="action-widget-menu" role="menu">
          <a className="action-widget-link" href={resumePdfUrl} download>
            下載履歷PDF
          </a>
          <button type="button" className="action-widget-link" onClick={handleDownloadChat}>
            下載對話記錄
          </button>
          <a
            className="action-widget-link"
            href="https://johnny-ai365-vibecoding-30days.github.io/day10-no.120-Landing-Page/"
            target="_blank"
            rel="noreferrer"
          >
            LandingPage
          </a>
        </div>
      </div>
    </section>
  );
};

export default ChatPanel;
