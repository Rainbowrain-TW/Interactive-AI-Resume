import { useEffect, useMemo, useState } from "react";
import ChatPanel from "./components/ChatPanel";
import ResumePanel from "./components/ResumePanel";
import { getMockReply, type ChatMessage } from "./lib/llmClient";
import type { ResumeData } from "./lib/resumeTypes";

const App = () => {
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [isResumeLoading, setIsResumeLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "嗨！我是履歷小助理，歡迎詢問技能、經驗或專案。",
    },
  ]);
  const [isReplying, setIsReplying] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activePanel, setActivePanel] = useState<"chat" | "resume">("chat");

  useEffect(() => {
    const controller = new AbortController();
    const fetchResume = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}resume.json`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("載入履歷失敗，請確認 resume.json 是否存在。");
        }
        const data = (await response.json()) as ResumeData;
        setResume(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setResumeError(error instanceof Error ? error.message : "載入履歷失敗。");
      } finally {
        setIsResumeLoading(false);
      }
    };

    fetchResume();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
    };

    handleChange(mediaQuery);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const panelTitle = useMemo(() => {
    if (!isMobile) return null;
    return (
      <div className="tab-bar">
        <button
          type="button"
          className={activePanel === "chat" ? "active" : ""}
          onClick={() => setActivePanel("chat")}
        >
          Chat
        </button>
        <button
          type="button"
          className={activePanel === "resume" ? "active" : ""}
          onClick={() => setActivePanel("resume")}
        >
          Resume
        </button>
      </div>
    );
  }, [activePanel, isMobile]);

  const handleSend = async (content: string) => {
    setMessages((prev) => [...prev, { role: "user", content }]);
    setIsReplying(true);
    const reply = await getMockReply(content, resume ?? undefined);
    setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    setIsReplying(false);
  };

  return (
    <div className="app">
      <header className="top-bar">
        <div>
          <h1>互動式 AI 履歷</h1>
          <p>Vite + React + TypeScript PoC</p>
        </div>
        {panelTitle}
      </header>
      <main className="main-layout">
        {!isMobile || activePanel === "chat" ? (
          <ChatPanel messages={messages} onSend={handleSend} isLoading={isReplying} />
        ) : null}
        {!isMobile || activePanel === "resume" ? (
          <ResumePanel resume={resume} isLoading={isResumeLoading} error={resumeError} />
        ) : null}
      </main>
    </div>
  );
};

export default App;
