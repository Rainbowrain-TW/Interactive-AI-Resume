import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { createMockClient, type ChatMessage } from "./lib/llmClient";

interface ResumeData {
  data?: {
    basics?: {
      name?: string;
      headline?: string;
      email?: string;
      phone?: string;
      location?: string;
      website?: { url?: string; label?: string };
    };
    summary?: {
      title?: string;
      hidden?: boolean;
      content?: string;
    };
    sections?: Record<string, ResumeSection>;
    customSections?: CustomSection[];
  };
}

interface ResumeSection {
  title?: string;
  hidden?: boolean;
  items?: ResumeItem[];
}

interface ResumeItem {
  id?: string;
  hidden?: boolean;
  [key: string]: any;
}

interface CustomSection {
  id?: string;
  title?: string;
  hidden?: boolean;
  content?: string;
}

const sanitizeHtml = (html?: string) => {
  if (!html) return "";
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
};

const stripHtml = (html?: string) => {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent?.replace(/\s+/g, " ").trim() ?? "";
};

const App = () => {
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "嗨！我是你的 AI 履歷助理，歡迎詢問專案、經歷或技能。",
    },
  ]);
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "resume">("chat");

  useEffect(() => {
    const loadResume = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}resume.json`);
        if (!response.ok) {
          throw new Error("Failed to load resume");
        }
        const data = (await response.json()) as ResumeData;
        setResume(data);
      } catch (error) {
        console.error(error);
      }
    };
    void loadResume();
  }, []);

  const knowledge = useMemo(() => {
    const summary = stripHtml(resume?.data?.summary?.content);
    const experience =
      resume?.data?.sections?.experience?.items
        ?.filter((item) => !item.hidden)
        .map((item) => stripHtml(item.description as string))
        .filter(Boolean) ?? [];
    const custom =
      resume?.data?.customSections
        ?.filter((section) => !section.hidden)
        .map((section) => stripHtml(section.content))
        .filter(Boolean) ?? [];
    return { summary, experience, custom };
  }, [resume]);

  const llmClient = useMemo(() => createMockClient(knowledge), [knowledge]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    const reply = await llmClient.sendMessage(userMessage.content);
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "assistant", content: reply },
    ]);
  };

  const basics = resume?.data?.basics;
  const sections = resume?.data?.sections ?? {};

  const renderSectionHeader = (title?: string) =>
    title ? <h2 className="section-title">{title}</h2> : null;

  const renderProfiles = () => {
    const profiles = sections.profiles;
    if (!profiles || profiles.hidden) return null;
    const items = profiles.items?.filter((item) => !item.hidden) ?? [];
    if (!items.length) return null;
    return (
      <section className="section">
        {renderSectionHeader(profiles.title ?? "Profiles")}
        <ul className="profile-list">
          {items.map((item) => (
            <li key={item.id ?? item.network}>
              <span className="profile-network">{item.network}</span>
              <a
                href={item.website?.url}
                target="_blank"
                rel="noreferrer"
              >
                {item.username ?? item.website?.url}
              </a>
            </li>
          ))}
        </ul>
      </section>
    );
  };

  const renderSummary = () => {
    const summary = resume?.data?.summary;
    if (!summary || summary.hidden) return null;
    return (
      <section className="section">
        {renderSectionHeader(summary.title ?? "Summary")}
        <div
          className="rich-text"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(summary.content) }}
        />
      </section>
    );
  };

  const renderExperience = () => {
    const experience = sections.experience;
    if (!experience || experience.hidden) return null;
    const items = experience.items?.filter((item) => !item.hidden) ?? [];
    if (!items.length) return null;
    return (
      <section className="section">
        {renderSectionHeader(experience.title ?? "Experience")}
        <div className="stack">
          {items.map((item) => (
            <article key={item.id ?? item.company} className="card">
              <div className="card-header">
                <div>
                  <h3>{item.position}</h3>
                  <p className="muted">{item.company}</p>
                </div>
                <div className="muted">{item.period}</div>
              </div>
              {item.location ? (
                <p className="muted">{item.location}</p>
              ) : null}
              {item.description ? (
                <div
                  className="rich-text"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(item.description as string),
                  }}
                />
              ) : null}
            </article>
          ))}
        </div>
      </section>
    );
  };

  const renderEducation = () => {
    const education = sections.education;
    if (!education || education.hidden) return null;
    const items = education.items?.filter((item) => !item.hidden) ?? [];
    if (!items.length) return null;
    return (
      <section className="section">
        {renderSectionHeader(education.title ?? "Education")}
        <div className="stack">
          {items.map((item) => (
            <article key={item.id ?? item.institution} className="card">
              <div className="card-header">
                <div>
                  <h3>{item.studyType}</h3>
                  <p className="muted">{item.institution}</p>
                </div>
                <div className="muted">{item.period}</div>
              </div>
              {item.area ? <p>{item.area}</p> : null}
            </article>
          ))}
        </div>
      </section>
    );
  };

  const renderSkills = () => {
    const skills = sections.skills;
    if (!skills || skills.hidden) return null;
    const items = skills.items?.filter((item) => !item.hidden) ?? [];
    if (!items.length) return null;
    return (
      <section className="section">
        {renderSectionHeader(skills.title ?? "Skills")}
        <div className="pill-grid">
          {items.map((item) => (
            <div key={item.id ?? item.name} className="pill">
              {item.name}
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderCertifications = () => {
    const certifications = sections.certifications;
    if (!certifications || certifications.hidden) return null;
    const items = certifications.items?.filter((item) => !item.hidden) ?? [];
    if (!items.length) return null;
    return (
      <section className="section">
        {renderSectionHeader(certifications.title ?? "Certifications")}
        <ul className="stack">
          {items.map((item) => (
            <li key={item.id ?? item.name}>
              <strong>{item.name}</strong>
              {item.issuer ? <span className="muted"> · {item.issuer}</span> : null}
            </li>
          ))}
        </ul>
      </section>
    );
  };

  const renderProjects = () => {
    const projects = sections.projects;
    if (!projects || projects.hidden) return null;
    const items = projects.items?.filter((item) => !item.hidden) ?? [];
    if (!items.length) return null;
    return (
      <section className="section">
        {renderSectionHeader(projects.title ?? "Projects")}
        <div className="stack">
          {items.map((item) => (
            <article key={item.id ?? item.name} className="card">
              <h3>{item.name}</h3>
              {item.description ? <p>{item.description}</p> : null}
            </article>
          ))}
        </div>
      </section>
    );
  };

  const renderCustomSections = () => {
    const customSections = resume?.data?.customSections ?? [];
    const visibleSections = customSections.filter((section) => !section.hidden);
    if (!visibleSections.length) return null;
    return (
      <section className="section">
        {visibleSections.map((section) => (
          <div key={section.id ?? section.title} className="custom-section">
            {renderSectionHeader(section.title)}
            <div
              className="rich-text"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(section.content),
              }}
            />
          </div>
        ))}
      </section>
    );
  };

  return (
    <div className="app">
      <header className="topbar">
        <h1>互動式 AI 履歷</h1>
        <p className="muted">Vite + React + TypeScript PoC</p>
      </header>
      <div className="tabs">
        <button
          type="button"
          className={activeTab === "chat" ? "active" : ""}
          onClick={() => setActiveTab("chat")}
        >
          Chat
        </button>
        <button
          type="button"
          className={activeTab === "resume" ? "active" : ""}
          onClick={() => setActiveTab("resume")}
        >
          Resume
        </button>
      </div>
      <div className="panels">
        <section
          className="panel chat-panel"
          data-active={activeTab === "chat"}
        >
          <h2>Chat Panel</h2>
          <div className="chat-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message message-${message.role}`}
              >
                <div className="message-role">
                  {message.role === "user" ? "You" : "AI"}
                </div>
                <p>{message.content}</p>
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              value={input}
              placeholder="輸入問題，例如：介紹你的專案經驗"
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleSend();
                }
              }}
            />
            <button type="button" onClick={() => void handleSend()}>
              送出
            </button>
          </div>
        </section>
        <section
          className="panel resume-panel"
          data-active={activeTab === "resume"}
        >
          <h2>Resume Panel</h2>
          <section className="section">
            <h2 className="name">{basics?.name ?? "Unknown"}</h2>
            <p className="headline">{basics?.headline}</p>
            <div className="meta">
              {basics?.location ? <span>{basics.location}</span> : null}
              {basics?.email ? <span>{basics.email}</span> : null}
              {basics?.phone ? <span>{basics.phone}</span> : null}
              {basics?.website?.url ? (
                <a href={basics.website.url} target="_blank" rel="noreferrer">
                  {basics.website.label || basics.website.url}
                </a>
              ) : null}
            </div>
          </section>
          {renderProfiles()}
          {renderSummary()}
          {renderExperience()}
          {renderEducation()}
          {renderSkills()}
          {renderCertifications()}
          {renderProjects()}
          {renderCustomSections()}
        </section>
      </div>
    </div>
  );
};

export default App;
