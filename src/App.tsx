import { useEffect, useState } from 'react';
import ChatPanel from './components/ChatPanel';
import ResumePanel from './components/ResumePanel';
import type { ResumePayload } from './types/resume';
import './App.css';

const INTRO_MODAL_KEY = 'interactive-ai-resume-hide-intro';

const App = () => {
  const [resume, setResume] = useState<ResumePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(false);
  const [skipIntroNextTime, setSkipIntroNextTime] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const shouldHideIntro = localStorage.getItem(INTRO_MODAL_KEY) === 'true';
    setShowIntro(!shouldHideIntro);
    setSkipIntroNextTime(shouldHideIntro);

    const loadResume = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}resume.json`);
        if (!response.ok) {
          throw new Error(`Failed to load resume: ${response.status}`);
        }
        const data = (await response.json()) as ResumePayload;
        if (isMounted) {
          setResume(data);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError instanceof Error ? fetchError.message : 'Unknown error');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadResume();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCloseIntro = () => {
    if (skipIntroNextTime) {
      localStorage.setItem(INTRO_MODAL_KEY, 'true');
    } else {
      localStorage.removeItem(INTRO_MODAL_KEY);
    }
    setShowIntro(false);
  };

  const handleOpenIntro = () => {
    const shouldHideIntro = localStorage.getItem(INTRO_MODAL_KEY) === 'true';
    setSkipIntroNextTime(shouldHideIntro);
    setShowIntro(true);
  };

  const resumeData = resume?.data;

  return (
    <div className="app">
      {showIntro && (
        <div className="intro-overlay" onClick={handleCloseIntro} role="dialog" aria-modal="true">
          <div className="intro-modal" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="intro-close"
              aria-label="關閉提示"
              onClick={handleCloseIntro}
            >
              ×
            </button>
            <div className="intro-content">
              <p>Hi, 我是 Johnny! 感謝您體驗我的互動式 AI 履歷。</p>
              <p>
                這是一個結合 LLM 的實驗性專案，您可以透過 [履歷區塊] 閱讀我的經歷，或直接在
                [聊天室] 考考我的 AI 代理人關於專案細節或技術能力等問題。
              </p>
              <p>有幾點說明：</p>
              <ul>
                <li>
                  隱私宣告：對話內容將匿名用於除錯與優化，請安心使用（請勿輸入機敏資訊）。
                </li>
                <li>
                  系統效能：本專案採用 Google Apps Script 環境，對話時若遇到「冷啟動」導致回應較慢，屬正常現象，感謝您的包容。
                </li>
                <li>
                  誠實聲明：儘管已透過提示工程（Prompt Engineering）嚴格約束回答依據，AI 模型仍可能產生過度正向的修飾或美化。準確資訊請務必參閱正式履歷，或直接與我聯繫。
                </li>
                <li>更多功能：右下角↘️選單可下載 PDF 版履歷或下載當次對話記錄。</li>
              </ul>
              <p>
                有任何回饋或 Bug 回報，歡迎{' '}
                <a
                  className="intro-link"
                  href="mailto:rainbowrain0930@gmail.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  來信
                </a>{' '}
                告訴我！
              </p>
            </div>
            <div className="intro-footer">
              <label className="intro-checkbox">
                <input
                  type="checkbox"
                  checked={skipIntroNextTime}
                  onChange={(event) => setSkipIntroNextTime(event.target.checked)}
                />
                下次不再顯示
              </label>
              <button type="button" className="intro-start" onClick={handleCloseIntro}>
                開始使用
              </button>
            </div>
          </div>
        </div>
      )}
      <ChatPanel resume={resumeData} onOpenIntro={handleOpenIntro} />
      <div className="resume-wrapper">
        {isLoading && <p className="muted">載入履歷中...</p>}
        {error && <p className="error">{error}</p>}
        {!isLoading && !error && <ResumePanel resume={resumeData} />}
      </div>
    </div>
  );
};

export default App;
