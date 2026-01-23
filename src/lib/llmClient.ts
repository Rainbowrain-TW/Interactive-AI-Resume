export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface ResumeKnowledge {
  summary?: string;
  experience?: string[];
  custom?: string[];
}

export interface LlmClient {
  sendMessage: (prompt: string) => Promise<string>;
}

const pickBestSnippet = (prompt: string, snippets: string[]) => {
  const lower = prompt.toLowerCase();
  const match = snippets.find((snippet) =>
    snippet.toLowerCase().includes(lower)
  );
  return match ?? snippets[0];
};

export const createMockClient = (knowledge: ResumeKnowledge): LlmClient => {
  return {
    sendMessage: async (prompt: string) => {
      const snippets = [
        knowledge.summary ?? "",
        ...(knowledge.experience ?? []),
        ...(knowledge.custom ?? []),
      ].filter(Boolean);

      if (!snippets.length) {
        return "目前還沒有履歷內容可用，請稍後再試。";
      }

      const keywordMatches: Record<string, string> = {
        專案: "這裡有部分專案摘要：",
        project: "Here are some project highlights:",
        經驗: "這裡是相關經驗摘要：",
        experience: "Here is a short experience summary:",
        技能: "技能亮點整理如下：",
        skill: "Skill highlights include:",
      };

      const prefix = Object.entries(keywordMatches).find(([keyword]) =>
        prompt.toLowerCase().includes(keyword.toLowerCase())
      )?.[1];

      const snippet = pickBestSnippet(prompt, snippets);
      const response = snippet || "可以更具體描述你想了解的內容嗎？";
      return prefix ? `${prefix}\n${response}` : response;
    },
  };
};
