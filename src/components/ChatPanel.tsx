import { useMemo, useState } from 'react';
import type { ResumeData } from '../types/resume';
import { llmClient } from '../lib/llmClient';

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

const ChatPanel = ({ resume }: ChatPanelProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSend) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await llmClient.getResponse(userMessage.content, resume);
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="panel chat-panel">
      <header className="panel-header">
        <h2>Chat</h2>
        <p>Mock AI 回覆</p>
      </header>
      <div className="chat-messages" aria-live="polite">
        {messages.map((message) => (
          <div key={message.id} className={`chat-message ${message.role}`}>
            <span className="chat-role">{message.role === 'user' ? '你' : 'AI'}</span>
            <p>{message.content}</p>
          </div>
        ))}
      </div>
      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="輸入問題..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          aria-label="聊天輸入"
        />
        <button type="submit" disabled={!canSend}>
          {isLoading ? '回覆中' : '送出'}
        </button>
      </form>
    </section>
  );
};

export default ChatPanel;
