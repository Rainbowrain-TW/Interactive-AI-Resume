import type { ResumeData } from '../types/resume';

export interface LLMClient {
  getResponse: (input: string, resume?: ResumeData) => Promise<string>;
}

const extractTextFromHtml = (html?: string) => {
  if (!html) {
    return '';
  }
  const container = document.createElement('div');
  container.innerHTML = html;
  return container.textContent?.replace(/\s+/g, ' ').trim() ?? '';
};

const collectSnippets = (resume?: ResumeData) => {
  const snippets: string[] = [];
  const summary = extractTextFromHtml(resume?.summary?.content);
  if (summary) {
    snippets.push(summary);
  }

  const experienceItems = resume?.sections?.experience?.items ?? [];
  experienceItems.forEach((item) => {
    const description = extractTextFromHtml(item.description);
    const header = [item.company, item.position, item.period].filter(Boolean).join(' · ');
    const text = [header, description].filter(Boolean).join(' - ');
    if (text) {
      snippets.push(text);
    }
  });

  const customSections = resume?.customSections ?? [];
  customSections.forEach((section) => {
    const text = extractTextFromHtml(section.content);
    if (text) {
      snippets.push(text);
    }
  });

  return snippets;
};

const keywordGroups: Array<{ keywords: string[]; label: string }> = [
  { keywords: ['experience', '經驗', '工作'], label: 'experience' },
  { keywords: ['summary', '簡介', '介紹', '關於'], label: 'summary' },
  { keywords: ['project', '專案', '作品'], label: 'project' },
  { keywords: ['skill', '技能', '技術'], label: 'skill' }
];

const chooseSnippet = (input: string, resume?: ResumeData) => {
  const snippets = collectSnippets(resume);
  if (snippets.length === 0) {
    return '目前履歷資料較少，我可以先提供摘要或協助整理內容。';
  }

  const lowerInput = input.toLowerCase();
  const keywordGroup = keywordGroups.find((group) =>
    group.keywords.some((keyword) => lowerInput.includes(keyword))
  );

  if (keywordGroup) {
    const matchedSnippet = snippets.find((snippet) =>
      keywordGroup.keywords.some((keyword) => snippet.toLowerCase().includes(keyword))
    );
    if (matchedSnippet) {
      return matchedSnippet;
    }
  }

  const matchedByToken = snippets.find((snippet) =>
    lowerInput
      .split(/\s+/)
      .filter(Boolean)
      .some((token) => snippet.toLowerCase().includes(token))
  );

  return matchedByToken ?? snippets[0];
};

export const mockClient: LLMClient = {
  async getResponse(input: string, resume?: ResumeData) {
    const snippet = chooseSnippet(input, resume);
    return `根據履歷資料：${snippet}`;
  }
};

export const llmClient = mockClient;
