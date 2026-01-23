import DOMPurify from "dompurify";
import type {
  ResumeCustomSection,
  ResumeData,
  ResumeEducation,
  ResumeExperience,
  ResumeProfile,
  ResumeProject,
  ResumeSection,
  ResumeSkill,
  ResumeCertification,
} from "../lib/resumeTypes";

interface ResumePanelProps {
  resume: ResumeData | null;
  isLoading: boolean;
  error: string | null;
}

const sanitizeHtml = (html?: string) => ({
  __html: DOMPurify.sanitize(html ?? ""),
});

const filterVisible = <T extends { hidden?: boolean }>(items?: T[]) =>
  (items ?? []).filter((item) => !item?.hidden);

const SectionTitle = ({ title }: { title?: string }) =>
  title ? <h3>{title}</h3> : null;

const ProfilesSection = ({ section }: { section?: ResumeSection<ResumeProfile> }) => {
  if (!section || section.hidden) return null;
  const items = filterVisible(section.items);
  if (!items.length) return null;
  return (
    <section className="resume-section">
      <SectionTitle title={section.title ?? "Profiles"} />
      <ul className="profile-list">
        {items.map((item) => (
          <li key={`${item.network}-${item.username}`}>
            <span>{item.network}</span>
            {item.website?.url ? (
              <a href={item.website.url} target="_blank" rel="noreferrer">
                {item.username ?? item.website.url}
              </a>
            ) : (
              <span>{item.username}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};

const SummarySection = ({ content, title }: { content?: string; title?: string }) => {
  if (!content) return null;
  return (
    <section className="resume-section">
      <SectionTitle title={title ?? "Summary"} />
      <div className="rich-text" dangerouslySetInnerHTML={sanitizeHtml(content)} />
    </section>
  );
};

const ExperienceSection = ({ section }: { section?: ResumeSection<ResumeExperience> }) => {
  if (!section || section.hidden) return null;
  const items = filterVisible(section.items);
  if (!items.length) return null;
  return (
    <section className="resume-section">
      <SectionTitle title={section.title ?? "Experience"} />
      <div className="card-list">
        {items.map((item) => (
          <article key={item.company ?? item.position} className="resume-card">
            <header>
              <h4>{item.position ?? ""}</h4>
              <p className="muted">{[item.company, item.location].filter(Boolean).join(" · ")}</p>
              {item.period ? <p className="muted">{item.period}</p> : null}
              {item.website?.url ? (
                <a href={item.website.url} target="_blank" rel="noreferrer">
                  {item.website.url}
                </a>
              ) : null}
            </header>
            {item.description ? (
              <div className="rich-text" dangerouslySetInnerHTML={sanitizeHtml(item.description)} />
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
};

const EducationSection = ({ section }: { section?: ResumeSection<ResumeEducation> }) => {
  if (!section || section.hidden) return null;
  const items = filterVisible(section.items);
  if (!items.length) return null;
  return (
    <section className="resume-section">
      <SectionTitle title={section.title ?? "Education"} />
      <div className="card-list">
        {items.map((item) => (
          <article key={item.school ?? item.area} className="resume-card">
            <header>
              <h4>{item.school ?? ""}</h4>
              <p className="muted">{[item.degree, item.area].filter(Boolean).join(" · ")}</p>
              {item.period ? <p className="muted">{item.period}</p> : null}
            </header>
            {item.description ? (
              <div className="rich-text" dangerouslySetInnerHTML={sanitizeHtml(item.description)} />
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
};

const SkillsSection = ({ section }: { section?: ResumeSection<ResumeSkill> }) => {
  if (!section || section.hidden) return null;
  const items = filterVisible(section.items);
  if (!items.length) return null;
  return (
    <section className="resume-section">
      <SectionTitle title={section.title ?? "Skills"} />
      <ul className="pill-list">
        {items.map((item) => (
          <li key={item.name}>
            <strong>{item.name}</strong>
            {item.proficiency ? <span>{item.proficiency}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
};

const CertificationsSection = ({ section }: { section?: ResumeSection<ResumeCertification> }) => {
  if (!section || section.hidden) return null;
  const items = filterVisible(section.items);
  if (!items.length) return null;
  return (
    <section className="resume-section">
      <SectionTitle title={section.title ?? "Certifications"} />
      <ul className="list">
        {items.map((item) => (
          <li key={item.title}>
            <strong>{item.title}</strong>
            <span className="muted">{[item.issuer, item.date].filter(Boolean).join(" · ")}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

const ProjectsSection = ({ section }: { section?: ResumeSection<ResumeProject> }) => {
  if (!section || section.hidden) return null;
  const items = filterVisible(section.items);
  if (!items.length) return null;
  return (
    <section className="resume-section">
      <SectionTitle title={section.title ?? "Projects"} />
      <div className="card-list">
        {items.map((item) => (
          <article key={item.name} className="resume-card">
            <header>
              <h4>{item.name}</h4>
              {item.period ? <p className="muted">{item.period}</p> : null}
              {item.website?.url ? (
                <a href={item.website.url} target="_blank" rel="noreferrer">
                  {item.website.url}
                </a>
              ) : null}
            </header>
            {item.description ? (
              <div className="rich-text" dangerouslySetInnerHTML={sanitizeHtml(item.description)} />
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
};

const CustomSections = ({ sections }: { sections?: ResumeCustomSection[] }) => {
  const visible = filterVisible(sections);
  if (!visible.length) return null;
  return (
    <section className="resume-section">
      {visible.map((section) => (
        <div key={section.title} className="custom-section">
          <SectionTitle title={section.title} />
          {section.content ? (
            <div className="rich-text" dangerouslySetInnerHTML={sanitizeHtml(section.content)} />
          ) : null}
        </div>
      ))}
    </section>
  );
};

const ResumePanel = ({ resume, isLoading, error }: ResumePanelProps) => {
  const basics = resume?.data?.basics;
  const summary = resume?.data?.summary;
  const sections = resume?.data?.sections;
  const customSections = resume?.data?.customSections;

  return (
    <section className="panel resume-panel">
      <header className="panel-header">
        <h2>Resume Panel</h2>
        <p>JSON 履歷資料即時渲染。</p>
      </header>
      {isLoading ? <p className="status">載入履歷中…</p> : null}
      {error ? <p className="status error">{error}</p> : null}
      {resume ? (
        <div className="resume-content">
          <section className="resume-hero">
            <h1>{basics?.name ?? ""}</h1>
            <p className="headline">{basics?.headline ?? ""}</p>
            <div className="contact-grid">
              {basics?.email ? <span>{basics.email}</span> : null}
              {basics?.phone ? <span>{basics.phone}</span> : null}
              {basics?.location ? <span>{basics.location}</span> : null}
              {basics?.website?.url ? (
                <a href={basics.website.url} target="_blank" rel="noreferrer">
                  {basics.website.url}
                </a>
              ) : null}
            </div>
          </section>
          <ProfilesSection section={sections?.profiles} />
          <SummarySection title={summary?.title} content={summary?.content} />
          <ExperienceSection section={sections?.experience} />
          <EducationSection section={sections?.education} />
          <SkillsSection section={sections?.skills} />
          <CertificationsSection section={sections?.certifications} />
          <ProjectsSection section={sections?.projects} />
          <CustomSections sections={customSections} />
        </div>
      ) : null}
    </section>
  );
};

export default ResumePanel;
