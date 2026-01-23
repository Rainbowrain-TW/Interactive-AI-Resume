import { useEffect, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { ChatMessage, getMockReply } from './lib/llmClient';

type SectionItem = Record<string, unknown> & { hidden?: boolean };

type ResumeData = {
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
    sections?: Record<string, { title?: string; hidden?: boolean; items?: SectionItem[] }>;
    customSections?: Array<{
      title?: string;
      hidden?: boolean;
      content?: string;
    }>;
  };
};

const isVisible = (item?: { hidden?: boolean }) => item?.hidden !== true;

const htmlToText = (html?: string): string => {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.body.textContent?.trim() ?? '';
};

export default function App() {
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '你好！我可以協助解讀履歷內容，請輸入你的問題。',
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}resume.json`);
        if (!response.ok) {
          throw new Error(`載入失敗：${response.status}`);
        }
        const data: ResumeData = await response.json();
        setResume(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '載入履歷失敗');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const resumeHighlights = useMemo(() => {
    if (!resume?.data) return [];
    const summaryText = htmlToText(resume.data.summary?.content);
    const experienceItems = resume.data.sections?.experience?.items ?? [];
    const experienceText = experienceItems
      .map((item) => {
        const role = item.role as string | undefined;
        const company = item.company as string | undefined;
        const summary = item.summary as string | undefined;
        return [role, company, summary].filter(Boolean).join(' ');
      })
      .filter(Boolean);
    const customSections = resume.data.customSections ?? [];
    const customText = customSections
      .filter(isVisible)
      .map((section) => htmlToText(section.content))
      .filter(Boolean);
    return [summaryText, ...experienceText, ...customText].filter(Boolean);
  }, [resume]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSending(true);
    const reply = await getMockReply(userMessage.content, {
      resumeHighlights,
    });
    setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    setSending(false);
  };

  const basics = resume?.data?.basics;
  const summary = resume?.data?.summary;
  const sections = resume?.data?.sections ?? {};
  const customSections = resume?.data?.customSections ?? [];

  const renderHtml = (html?: string) => ({
    __html: DOMPurify.sanitize(html ?? ''),
  });

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>互動式 AI 履歷</h1>
          <p className="subtitle">左側聊天、右側履歷，即時探索履歷內容</p>
        </div>
        <span className="badge">PoC</span>
      </header>

      <main className="app-body">
        <section className="panel chat-panel">
          <div className="panel-header">
            <h2>Chat Panel</h2>
            <span className="panel-hint">Mock AI（可替換 LLM）</span>
          </div>
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`chat-bubble ${message.role}`}>
                <span>{message.content}</span>
              </div>
            ))}
            {sending && <div className="chat-bubble assistant">思考中...</div>}
          </div>
          <div className="chat-input">
            <input
              type="text"
              placeholder="詢問履歷內容..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSend();
                }
              }}
              disabled={sending}
            />
            <button onClick={handleSend} disabled={sending || !input.trim()}>
              送出
            </button>
          </div>
        </section>

        <section className="panel resume-panel">
          <div className="panel-header">
            <h2>Resume Panel</h2>
            <span className="panel-hint">資料來源：public/resume.json</span>
          </div>
          {loading && <p className="status">載入履歷中...</p>}
          {error && <p className="status error">{error}</p>}
          {!loading && !error && (
            <div className="resume-content">
              <section className="resume-section">
                <h3>Header</h3>
                <div className="resume-card">
                  <div className="resume-title">
                    <h4>{basics?.name ?? '未提供姓名'}</h4>
                    <p>{basics?.headline ?? '未提供職稱'}</p>
                  </div>
                  <ul className="meta-list">
                    {basics?.email && <li>Email：{basics.email}</li>}
                    {basics?.phone && <li>Phone：{basics.phone}</li>}
                    {basics?.location && <li>Location：{basics.location}</li>}
                    {basics?.website?.url && (
                      <li>
                        Website：
                        <a href={basics.website.url} target="_blank" rel="noreferrer">
                          {basics.website.label || basics.website.url}
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              </section>

              {isVisible(sections.profiles) && (
                <section className="resume-section">
                  <h3>Profiles</h3>
                  <div className="resume-card grid">
                    {(sections.profiles?.items ?? []).map((item, index) =>
                      isVisible(item) ? (
                        <div key={`profile-${index}`} className="mini-card">
                          <strong>{(item.network as string) ?? 'Profile'}</strong>
                          <span>{(item.username as string) ?? '未提供帳號'}</span>
                          {item.url && (
                            <a href={item.url as string} target="_blank" rel="noreferrer">
                              {(item.url as string) ?? ''}
                            </a>
                          )}
                        </div>
                      ) : null
                    )}
                  </div>
                </section>
              )}

              {isVisible(summary) && (
                <section className="resume-section">
                  <h3>Summary</h3>
                  <div className="resume-card" dangerouslySetInnerHTML={renderHtml(summary?.content)} />
                </section>
              )}

              {isVisible(sections.experience) && (
                <section className="resume-section">
                  <h3>Experience</h3>
                  <div className="resume-card">
                    {(sections.experience?.items ?? []).map((item, index) =>
                      isVisible(item) ? (
                        <div key={`exp-${index}`} className="timeline-item">
                          <div className="timeline-title">
                            <strong>{(item.role as string) ?? '職位'}</strong>
                            <span>{(item.company as string) ?? '公司'}</span>
                          </div>
                          <span className="timeline-meta">
                            {(item.location as string) ?? '地點未提供'} ·{' '}
                            {(item.date as string) ?? '期間未提供'}
                          </span>
                          {item.summary && (
                            <p>{(item.summary as string) ?? ''}</p>
                          )}
                        </div>
                      ) : null
                    )}
                  </div>
                </section>
              )}

              {isVisible(sections.education) && (
                <section className="resume-section">
                  <h3>Education</h3>
                  <div className="resume-card">
                    {(sections.education?.items ?? []).map((item, index) =>
                      isVisible(item) ? (
                        <div key={`edu-${index}`} className="timeline-item">
                          <div className="timeline-title">
                            <strong>{(item.institution as string) ?? '學校'}</strong>
                            <span>{(item.studyType as string) ?? '學位'}</span>
                          </div>
                          <span className="timeline-meta">
                            {(item.area as string) ?? '科系未提供'} ·{' '}
                            {(item.date as string) ?? '期間未提供'}
                          </span>
                        </div>
                      ) : null
                    )}
                  </div>
                </section>
              )}

              {isVisible(sections.skills) && (
                <section className="resume-section">
                  <h3>Skills</h3>
                  <div className="resume-card tags">
                    {(sections.skills?.items ?? []).map((item, index) =>
                      isVisible(item) ? (
                        <span key={`skill-${index}`} className="tag">
                          {(item.name as string) ?? '技能'}
                        </span>
                      ) : null
                    )}
                  </div>
                </section>
              )}

              {isVisible(sections.certifications) && (
                <section className="resume-section">
                  <h3>Certifications</h3>
                  <div className="resume-card">
                    {(sections.certifications?.items ?? []).map((item, index) =>
                      isVisible(item) ? (
                        <div key={`cert-${index}`} className="timeline-item">
                          <div className="timeline-title">
                            <strong>{(item.name as string) ?? '證照'}</strong>
                            <span>{(item.issuer as string) ?? '發照單位'}</span>
                          </div>
                          <span className="timeline-meta">
                            {(item.date as string) ?? '日期未提供'}
                          </span>
                          {item.description && <p>{(item.description as string) ?? ''}</p>}
                        </div>
                      ) : null
                    )}
                  </div>
                </section>
              )}

              {isVisible(sections.projects) && (
                <section className="resume-section">
                  <h3>Projects</h3>
                  <div className="resume-card">
                    {(sections.projects?.items ?? []).map((item, index) =>
                      isVisible(item) ? (
                        <div key={`proj-${index}`} className="timeline-item">
                          <div className="timeline-title">
                            <strong>{(item.name as string) ?? '專案'}</strong>
                            <span>{(item.description as string) ?? ''}</span>
                          </div>
                          {item.summary && <p>{(item.summary as string) ?? ''}</p>}
                        </div>
                      ) : null
                    )}
                  </div>
                </section>
              )}

              {customSections.length > 0 && (
                <section className="resume-section">
                  <h3>customSections</h3>
                  <div className="resume-card">
                    {customSections.map((section, index) =>
                      isVisible(section) ? (
                        <div key={`custom-${index}`} className="custom-block">
                          <h4>{section.title ?? 'Custom Section'}</h4>
                          <div
                            className="custom-content"
                            dangerouslySetInnerHTML={renderHtml(section.content)}
                          />
                        </div>
                      ) : null
                    )}
                  </div>
                </section>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
