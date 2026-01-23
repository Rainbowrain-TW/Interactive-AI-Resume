import DOMPurify from 'dompurify';
import type {
  CertificationItem,
  EducationItem,
  ExperienceItem,
  ProfileItem,
  ProjectItem,
  ResumeData,
  SkillItem
} from '../types/resume';
import { filterVisibleItems, hasVisibleItems, isHidden } from '../lib/resumeUtils';

interface ResumePanelProps {
  resume?: ResumeData;
}

const sanitizeHtml = (value?: string) => ({
  __html: DOMPurify.sanitize(value ?? '')
});

const SectionHeader = ({ title }: { title?: string }) =>
  title ? <h3 className="section-title">{title}</h3> : null;

const renderProfiles = (profiles?: ProfileItem[]) => {
  const items = filterVisibleItems(profiles);
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="resume-section">
      <SectionHeader title="Profiles" />
      <ul className="profile-list">
        {items.map((item) => (
          <li key={`${item.network}-${item.username}`}>
            <strong>{item.network}</strong>
            {item.username && <span> · {item.username}</span>}
            {item.website?.url && (
              <a href={item.website.url} target="_blank" rel="noreferrer">
                {item.website.label || item.website.url}
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};

const renderSummary = (summary?: { hidden?: boolean; title?: string; content?: string }) => {
  if (!summary || isHidden(summary)) {
    return null;
  }
  return (
    <section className="resume-section">
      <SectionHeader title={summary.title || 'Summary'} />
      {summary.content && (
        <div className="rich-text" dangerouslySetInnerHTML={sanitizeHtml(summary.content)} />
      )}
    </section>
  );
};

const renderExperience = (items?: ExperienceItem[]) => {
  const visibleItems = filterVisibleItems(items);
  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <section className="resume-section">
      <SectionHeader title="Experience" />
      <div className="timeline">
        {visibleItems.map((item) => (
          <article key={`${item.company}-${item.position}`} className="timeline-item">
            <header>
              <h4>{item.position || 'Role'}</h4>
              <p className="muted">{[item.company, item.location].filter(Boolean).join(' · ')}</p>
              {item.period && <p className="muted">{item.period}</p>}
            </header>
            {item.description && (
              <div className="rich-text" dangerouslySetInnerHTML={sanitizeHtml(item.description)} />
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

const renderEducation = (items?: EducationItem[]) => {
  const visibleItems = filterVisibleItems(items);
  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <section className="resume-section">
      <SectionHeader title="Education" />
      <div className="cards">
        {visibleItems.map((item) => (
          <article key={`${item.school}-${item.area}`} className="card">
            <h4>{item.school || 'School'}</h4>
            <p className="muted">{[item.degree, item.area].filter(Boolean).join(' · ')}</p>
            {item.period && <p className="muted">{item.period}</p>}
            {item.description && <p>{item.description}</p>}
          </article>
        ))}
      </div>
    </section>
  );
};

const renderSkills = (items?: SkillItem[]) => {
  const visibleItems = filterVisibleItems(items);
  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <section className="resume-section">
      <SectionHeader title="Skills" />
      <div className="cards">
        {visibleItems.map((item) => (
          <article key={item.name} className="card">
            <h4>{item.name}</h4>
            {item.proficiency && <p>{item.proficiency}</p>}
          </article>
        ))}
      </div>
    </section>
  );
};

const renderCertifications = (items?: CertificationItem[]) => {
  const visibleItems = filterVisibleItems(items);
  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <section className="resume-section">
      <SectionHeader title="Certifications" />
      <ul className="list">
        {visibleItems.map((item) => (
          <li key={item.title}>
            <strong>{item.title}</strong>
            {item.issuer && <span> · {item.issuer}</span>}
            {item.date && <span> · {item.date}</span>}
            {item.description && <p>{item.description}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
};

const renderProjects = (items?: ProjectItem[]) => {
  const visibleItems = filterVisibleItems(items);
  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <section className="resume-section">
      <SectionHeader title="Projects" />
      <ul className="list">
        {visibleItems.map((item) => (
          <li key={item.name}>
            <strong>{item.name}</strong>
            {item.period && <span> · {item.period}</span>}
            {item.website?.url && (
              <a href={item.website.url} target="_blank" rel="noreferrer">
                {item.website.label || item.website.url}
              </a>
            )}
            {item.description && <p>{item.description}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
};

const renderCustomSections = (sections?: ResumeData['customSections']) => {
  const visibleSections = (sections ?? []).filter((section) => !isHidden(section));
  if (visibleSections.length === 0) {
    return null;
  }

  return visibleSections.map((section) => (
    <section key={section.id || section.title} className="resume-section">
      <SectionHeader title={section.title} />
      {section.content && (
        <div className="rich-text" dangerouslySetInnerHTML={sanitizeHtml(section.content)} />
      )}
    </section>
  ));
};

const ResumePanel = ({ resume }: ResumePanelProps) => {
  const basics = resume?.basics;
  const sections = resume?.sections;

  return (
    <section className="panel resume-panel">
      <header className="resume-header">
        <div>
          <h1>{basics?.name || 'Resume'}</h1>
          {basics?.headline && <p>{basics.headline}</p>}
        </div>
        <div className="resume-contact">
          {basics?.email && <span>{basics.email}</span>}
          {basics?.phone && <span>{basics.phone}</span>}
          {basics?.location && <span>{basics.location}</span>}
          {basics?.website?.url && (
            <a href={basics.website.url} target="_blank" rel="noreferrer">
              {basics.website.label || basics.website.url}
            </a>
          )}
        </div>
      </header>

      {renderProfiles(sections?.profiles?.items)}
      {renderSummary(resume?.summary)}
      {renderExperience(sections?.experience?.items)}
      {renderEducation(sections?.education?.items)}
      {renderSkills(sections?.skills?.items)}
      {renderCertifications(sections?.certifications?.items)}
      {renderProjects(sections?.projects?.items)}
      {renderCustomSections(resume?.customSections)}

      {!hasVisibleItems(sections?.experience?.items) &&
        !hasVisibleItems(sections?.education?.items) &&
        !hasVisibleItems(sections?.skills?.items) && (
          <p className="muted">此履歷尚未有可顯示內容。</p>
        )}
    </section>
  );
};

export default ResumePanel;
