import type { ResumeData } from "./resumeTypes";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

const stripHtml = (html?: string) => {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent?.replace(/\s+/g, " ").trim() ?? "";
};

const summarizeText = (text: string, limit = 220) => {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}…`;
};

const collectResumeSnippets = (resume?: ResumeData) => {
  const data = resume?.data;
  const snippets: Record<string, string[]> = {
    summary: [],
    experience: [],
    projects: [],
    skills: [],
  };

  const summary = stripHtml(data?.summary?.content);
  if (summary) snippets.summary.push(summary);

  const experienceItems = data?.sections?.experience?.items ?? [];
  experienceItems
    .filter((item) => !item?.hidden)
    .forEach((item) => {
      const base = [item?.company, item?.position, item?.period].filter(Boolean).join(" · ");
      const desc = stripHtml(item?.description);
      if (base || desc) {
        snippets.experience.push([base, desc].filter(Boolean).join(" — "));
      }
    });

  const projectItems = data?.sections?.projects?.items ?? [];
  projectItems
    .filter((item) => !item?.hidden)
    .forEach((item) => {
      const base = [item?.name, item?.period].filter(Boolean).join(" · ");
      const desc = stripHtml(item?.description);
      if (base || desc) {
        snippets.projects.push([base, desc].filter(Boolean).join(" — "));
      }
    });

  (data?.customSections ?? [])
    .filter((section) => !section?.hidden)
    .forEach((section) => {
      const content = stripHtml(section?.content);
      if (content) {
        snippets.projects.push(`${section?.title ?? "Project"} — ${content}`);
      }
    });

  const skillItems = data?.sections?.skills?.items ?? [];
  skillItems
    .filter((item) => !item?.hidden)
    .forEach((item) => {
      const entry = [item?.name, item?.proficiency].filter(Boolean).join(": ");
      if (entry) snippets.skills.push(entry);
    });

  return snippets;
};

export const getMockReply = async (input: string, resume?: ResumeData) => {
  const normalized = input.toLowerCase();
  const snippets = collectResumeSnippets(resume);

  let target: string[] = [];
  let header = "以下是從履歷整理的資訊：";

  if (/技能|skill/.test(normalized)) {
    target = snippets.skills;
    header = "技能摘要：";
  } else if (/經驗|experience|工作/.test(normalized)) {
    target = snippets.experience;
    header = "工作經驗摘要：";
  } else if (/專案|project|作品/.test(normalized)) {
    target = snippets.projects;
    header = "專案摘要：";
  } else if (/自我介紹|summary|簡介/.test(normalized)) {
    target = snippets.summary;
    header = "自我介紹：";
  }

  if (target.length === 0) {
    const fallback = snippets.summary[0] ?? snippets.experience[0] ?? "可以問我關於技能、經驗或專案。";
    return `${header}${summarizeText(fallback)}`;
  }

  const response = target.slice(0, 2).map((item) => `• ${summarizeText(item)}`).join("\n");
  return `${header}\n${response}`;
};
