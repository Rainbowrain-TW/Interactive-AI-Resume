import { useEffect, useMemo, useRef, useState } from 'react';
import type { ResumeData } from '../types/resume';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  token?: TokenUsage;
}

interface ChatPanelProps {
  resume?: ResumeData;
  onOpenIntro?: () => void;
}

interface TokenUsage {
  input: number;
  cached: number;
  output: number;
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
  'https://script.google.com/macros/s/AKfycbxjjXPXXJLo_-hJL_ljB-Qo_CdnCbG71mZFb-bgmAdGq7TISzCnqgfdbkRqYRFRumFX/exec'

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

const quotaExceededMessage =
  '很抱歉、目前伺服器的服務資源用量已達本日上限。請您明天再試。\n\n或連絡：rainbowrain0930@gmail.com';
const contactEmail = 'rainbowrain0930@gmail.com';

const renderMessageContent = (content: string) => {
  if (!content.includes(contactEmail)) {
    return content;
  }

  const parts = content.split(contactEmail);
  return (
    <>
      {parts.map((part, index) => (
        <span key={`${part}-${index}`}>
          {part}
          {index < parts.length - 1 ? (
            <a
              className="chat-link"
              href={`mailto:${contactEmail}`}
              target="_blank"
              rel="noreferrer"
            >
              {contactEmail}
            </a>
          ) : null}
        </span>
      ))}
    </>
  );
};

const formatTokenTooltip = (token?: TokenUsage) => {
  if (!token) {
    return '無 token 資訊';
  }
  return `Input: ${token.input}, Cached: ${token.cached}, Output: ${token.output}`;
};

const ChatPanel = ({ resume, onOpenIntro }: ChatPanelProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cid] = useState(() => getOrCreateLocalId(CID_KEY));
  const [sid] = useState(() => getOrCreateSessionId(SID_KEY));
  const [previousResponseId, setPreviousResponseId] = useState(() =>
    getSessionValue(PREVIOUS_RESPONSE_KEY, 'none')
  );
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const actionWidgetRef = useRef<HTMLDivElement | null>(null);
  const hideMenuTimerRef = useRef<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [chatSize, setChatSize] = useState<'default' | 'collapsed' | 'expanded'>('default');
  const [isQuickQuestionsOpen, setIsQuickQuestionsOpen] = useState(false);
  const [activeTokenMessageId, setActiveTokenMessageId] = useState<string | null>(null);
  const [isTokenStatsOpen, setIsTokenStatsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia('(max-width: 768px)').matches;
  });
  const longPressTimerRef = useRef<number | null>(null);
  const tokenStatsLongPressTimerRef = useRef<number | null>(null);

  const tokenStats = useMemo(() => {
    return messages.reduce(
      (acc, message) => {
        if (message.role !== 'assistant' || !message.token) {
          return acc;
        }
        acc.totalInput += message.token.input;
        acc.totalCached += message.token.cached;
        acc.totalOutput += message.token.output;
        acc.totalRequest += 1;
        return acc;
      },
      { totalInput: 0, totalCached: 0, totalOutput: 0, totalRequest: 0 }
    );
  }, [messages]);

  const tokenStatsTooltip = isMobile
    ? `Total Input: ${tokenStats.totalInput}\nTotal Cached Input: ${tokenStats.totalCached}\nTotal Output: ${tokenStats.totalOutput}\nTotal Request: ${tokenStats.totalRequest}`
    : `{Total Input: ${tokenStats.totalInput}, ` +
    `Total Cached Input: ${tokenStats.totalCached}, ` +
    `Total Output: ${tokenStats.totalOutput}, ` +
    `Total Request: ${tokenStats.totalRequest}}`;

  const handleTokenEnter = (messageId: string) => {
    if (isMobile) {
      return;
    }
    setActiveTokenMessageId(messageId);
  };

  const handleTokenLeave = (event?: React.PointerEvent) => {
    if (event?.pointerType === 'touch' || isMobile) {
      return;
    }
    setActiveTokenMessageId(null);
  };

  const handleTokenClick = (messageId: string) => {
    setActiveTokenMessageId((current) => (current === messageId ? null : messageId));
  };

  const handleTokenStatsEnter = () => {
    if (isMobile) {
      return;
    }
    setIsTokenStatsOpen(true);
    setIsMenuOpen(true);
    clearHideMenuTimer();
  };

  const handleTokenStatsLeave = (event?: React.PointerEvent) => {
    if (event?.pointerType === 'touch' || isMobile) {
      return;
    }
    setIsTokenStatsOpen(false);
  };

  const handleTokenStatsClick = () => {
    setIsTokenStatsOpen((current) => !current);
    setIsMenuOpen(true);
    clearHideMenuTimer();
  };

  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(media.matches);
    update();
    if ('addEventListener' in media) {
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }
    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      return;
    }

    const handleGlobalPointerDown = (event?: Event) => {
      const target = event?.target as Node | null;
      if (isTokenStatsOpen) {
        setIsTokenStatsOpen(false);
        return;
      }
      if (target && actionWidgetRef.current?.contains(target)) {
        return;
      }
      setActiveTokenMessageId(null);
      setIsMenuOpen(false);
    };

    const handleGlobalScroll = () => {
      if (isTokenStatsOpen) {
        setIsTokenStatsOpen(false);
        return;
      }
      setActiveTokenMessageId(null);
      setIsMenuOpen(false);
    };

    document.addEventListener('pointerdown', handleGlobalPointerDown, true);
    window.addEventListener('scroll', handleGlobalScroll, true);
    return () => {
      document.removeEventListener('pointerdown', handleGlobalPointerDown, true);
      window.removeEventListener('scroll', handleGlobalScroll, true);
    };
  }, [isMobile, isTokenStatsOpen]);

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const clearTokenStatsLongPressTimer = () => {
    if (tokenStatsLongPressTimerRef.current) {
      window.clearTimeout(tokenStatsLongPressTimerRef.current);
      tokenStatsLongPressTimerRef.current = null;
    }
  };

  const handleTokenPointerDown = (messageId: string) => {
    if (!isMobile) {
      return;
    }
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      setActiveTokenMessageId(messageId);
    }, 350);
  };

  const handleTokenPointerUp = (messageId: string) => {
    if (!isMobile) {
      return;
    }
    clearLongPressTimer();
    setActiveTokenMessageId((current) => (current === messageId ? null : messageId));
  };

  const handleTokenStatsPointerDown = () => {
    if (!isMobile) {
      return;
    }
    clearTokenStatsLongPressTimer();
    tokenStatsLongPressTimerRef.current = window.setTimeout(() => {
      setIsTokenStatsOpen(true);
      setIsMenuOpen(true);
    }, 350);
  };

  const handleTokenStatsPointerUp = () => {
    if (!isMobile) {
      return;
    }
    clearTokenStatsLongPressTimer();
    setIsTokenStatsOpen((current) => !current);
    setIsMenuOpen(true);
  };

  const updatePreviousResponseId = (nextId: string) => {
    setPreviousResponseId(nextId);
    sessionStorage.setItem(PREVIOUS_RESPONSE_KEY, nextId);
  };

  const clearHideMenuTimer = () => {
    if (hideMenuTimerRef.current) {
      window.clearTimeout(hideMenuTimerRef.current);
      hideMenuTimerRef.current = null;
    }
  };

  const scheduleHideMenu = () => {
    clearHideMenuTimer();
    hideMenuTimerRef.current = window.setTimeout(() => {
      setIsMenuOpen(false);
    }, 300);
  };

  const handleMenuButtonEnter = (event?: React.PointerEvent) => {
    if (event?.pointerType === 'touch') {
      return;
    }
    clearHideMenuTimer();
    setIsMenuOpen(true);
  };

  const handleMenuButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!isMobile) {
      return;
    }
    event.stopPropagation();
    clearHideMenuTimer();
    setIsMenuOpen((current) => !current);
  };

  const handleMenuButtonLeave = (event?: React.PointerEvent) => {
    if (isMobile || event?.pointerType === 'touch') {
      return;
    }
    scheduleHideMenu();
  };

  const handleMenuEnter = (event?: React.PointerEvent) => {
    if (event?.pointerType === 'touch') {
      return;
    }
    clearHideMenuTimer();
    setIsMenuOpen(true);
  };

  const handleMenuLeave = (event?: React.PointerEvent) => {
    if (isMobile || event?.pointerType === 'touch') {
      return;
    }
    if (isTokenStatsOpen) {
      return;
    }
    scheduleHideMenu();
  };

  const getNextChatSize = (current: 'default' | 'collapsed' | 'expanded') => {
    if (current === 'default') {
      return 'expanded';
    }
    if (current === 'expanded') {
      return 'collapsed';
    }
    return 'default';
  };

  const nextChatSize = getNextChatSize(chatSize);

  const handleToggleChatSize = () => {
    setChatSize(nextChatSize);
  };

  const chatSizeIcon =
    nextChatSize === 'expanded'
      ? 'keyboard_double_arrow_down'
      : nextChatSize === 'collapsed'
        ? 'minimize'
        : 'keyboard_arrow_down';

  const chatSizeLabel =
    nextChatSize === 'expanded'
      ? '切換為放大'
      : nextChatSize === 'collapsed'
        ? '切換為收合'
        : '切換為預設';

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

      const data = (await response.json()) as {
        id?: string;
        text?: string;
        error?: string;
        token?: TokenUsage;
      };
      if (data.error === 'Daily quota exceeded.') {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: quotaExceededMessage
        };
        setMessages((prev) => [...prev, assistantMessage]);
        return;
      }
      const assistantMessage: ChatMessage = {
        id: data.id ?? `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.text ?? '目前沒有回覆內容。',
        token: data.token
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
    setIsQuickQuestionsOpen(false);
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
    <section
      className={`panel chat-panel ${chatSize === 'collapsed' ? 'is-collapsed' : chatSize === 'expanded' ? 'is-expanded' : ''
        }`}
    >
      <header className="panel-header">
        <div className="chat-header">
          <div>
            <h2>Chat</h2>
            <p>AI 回覆</p>
          </div>
          <button
            type="button"
            className="chat-toggle"
            onClick={handleToggleChatSize}
            aria-label={chatSizeLabel}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              {chatSizeIcon}
            </span>
          </button>
        </div>
      </header>
      <div className="chat-messages" aria-live="polite">
        {messages.map((message) => (
          <div key={message.id} className={`chat-message ${message.role}`}>
            <span className="chat-role">{message.role === 'user' ? '你' : 'AI'}</span>
            <p>{renderMessageContent(message.content)}</p>
            {message.role === 'assistant' && (
              <span className="chat-token-wrapper">
                <button
                  type="button"
                  className="chat-token"
                  onPointerEnter={() => handleTokenEnter(message.id)}
                  onPointerLeave={handleTokenLeave}
                  onPointerDown={() => handleTokenPointerDown(message.id)}
                  onPointerUp={() => handleTokenPointerUp(message.id)}
                  onClick={(event) => {
                    if (isMobile) {
                      event.stopPropagation();
                    } else {
                      handleTokenClick(message.id);
                    }
                  }}
                  aria-label={`Token 用量 ${formatTokenTooltip(message.token)}`}
                >
                  i
                </button>
                <span
                  className={`chat-tooltip ${activeTokenMessageId === message.id ? 'is-visible' : ''
                    }`}
                  role="tooltip"
                >
                  {formatTokenTooltip(message.token)}
                </span>
              </span>
            )}
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
      <div
        className={`quick-questions ${isQuickQuestionsOpen ? 'is-open' : 'is-collapsed'}`}
        aria-label="快速提問"
      >
        <div className="quick-questions-header">
          <p className="quick-questions-title">快速提問</p>
          <button
            type="button"
            className="quick-questions-toggle"
            onClick={() => setIsQuickQuestionsOpen((prev) => !prev)}
            aria-expanded={isQuickQuestionsOpen}
            aria-label={isQuickQuestionsOpen ? '收合快速提問' : '展開快速提問'}
          >
            {isQuickQuestionsOpen ? '－' : '＋'}
          </button>
        </div>
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
      <div className="action-widget" aria-label="工具" ref={actionWidgetRef}>
        <button
          type="button"
          className="action-widget-button"
          aria-label="開啟工具"
          onPointerEnter={handleMenuButtonEnter}
          onPointerLeave={handleMenuButtonLeave}
          onFocus={handleMenuButtonEnter}
          onBlur={handleMenuButtonLeave}
          onClick={handleMenuButtonClick}
        >
          ☰
        </button>
        <div
          className={`action-widget-menu ${isMenuOpen ? 'is-open' : ''}`}
          role="menu"
          onPointerEnter={handleMenuEnter}
          onPointerLeave={handleMenuLeave}
          onClick={(event) => {
            if (isMobile) {
              event.stopPropagation();
            }
          }}
        >
          <a
            className="action-widget-link"
            href={resumePdfUrl}
            download
            onClick={() => {
              if (isMobile) {
                setIsMenuOpen(false);
              }
            }}
          >
            下載履歷PDF
          </a>
          <button
            type="button"
            className="action-widget-link"
            onClick={() => {
              handleDownloadChat();
              if (isMobile) {
                setIsMenuOpen(false);
              }
            }}
          >
            下載對話記錄
          </button>
          <button
            type="button"
            className="action-widget-link"
            onClick={() => {
              onOpenIntro?.();
              if (isMobile) {
                setIsMenuOpen(false);
              }
            }}
          >
            查看說明
          </button>
          <span className="token-stats-wrapper">
            <button
              type="button"
              className="action-widget-link"
              onPointerEnter={handleTokenStatsEnter}
              onPointerLeave={handleTokenStatsLeave}
              onPointerDown={handleTokenStatsPointerDown}
              onPointerUp={handleTokenStatsPointerUp}
              onClick={(event) => {
                if (isMobile) {
                  event.stopPropagation();
                } else {
                  handleTokenStatsClick();
                }
              }}
              aria-label={`TOKEN 統計 ${tokenStatsTooltip}`}
            >
              TOKEN統計
            </button>
            <span
              className={`chat-tooltip token-stats-tooltip ${isTokenStatsOpen ? 'is-visible' : ''
                }`}
              role="tooltip"
            >
              {tokenStatsTooltip}
            </span>
          </span>
        </div>
      </div>
    </section>
  );
};

export default ChatPanel;
