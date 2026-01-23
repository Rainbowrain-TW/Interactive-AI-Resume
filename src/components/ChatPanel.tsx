import { useState } from "react";
import type { ChatMessage } from "../lib/llmClient";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  isLoading: boolean;
}

const ChatPanel = ({ messages, onSend, isLoading }: ChatPanelProps) => {
  const [input, setInput] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput("");
  };

  return (
    <section className="panel chat-panel">
      <header className="panel-header">
        <h2>Chat Panel</h2>
        <p>用對話探索履歷內容（PoC mock AI）。</p>
      </header>
      <div className="chat-messages" aria-live="polite">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`chat-message ${message.role}`}
          >
            <span className="chat-role">{message.role === "user" ? "你" : "AI"}</span>
            <p>{message.content}</p>
          </div>
        ))}
        {isLoading ? (
          <div className="chat-message assistant loading">
            <span className="chat-role">AI</span>
            <p>思考中…</p>
          </div>
        ) : null}
      </div>
      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="例如：請介紹最近的專案" 
          value={input}
          onChange={(event) => setInput(event.target.value)}
          aria-label="輸入訊息"
        />
        <button type="submit">送出</button>
      </form>
    </section>
  );
};

export default ChatPanel;
