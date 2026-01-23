export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type MockReplyOptions = {
  resumeHighlights: string[];
};

const fallbackReplies = [
  '我可以協助整理履歷重點，或回答特定技能與專案的問題。',
  '你可以問我關於專案經驗、技術棧、或工作內容的細節。',
];

export async function getMockReply(
  prompt: string,
  options: MockReplyOptions
): Promise<string> {
  const normalized = prompt.toLowerCase();
  const { resumeHighlights } = options;

  const keywordMap: Record<string, string[]> = {
    ai: resumeHighlights,
    全端: resumeHighlights,
    frontend: resumeHighlights,
    backend: resumeHighlights,
    project: resumeHighlights,
    專案: resumeHighlights,
    experience: resumeHighlights,
    經驗: resumeHighlights,
    summary: resumeHighlights,
    履歷: resumeHighlights,
  };

  const matchedKey = Object.keys(keywordMap).find((key) =>
    normalized.includes(key)
  );

  if (matchedKey) {
    const snippets = keywordMap[matchedKey].filter(Boolean);
    if (snippets.length > 0) {
      const selection = snippets.slice(0, 2).join(' ');
      return `根據履歷內容：${selection}`;
    }
  }

  const fallback = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
  return fallback;
}
