import { useEffect, useState } from 'react';
import ChatPanel from './components/ChatPanel';
import ResumePanel from './components/ResumePanel';
import type { ResumePayload } from './types/resume';
import './App.css';

const App = () => {
  const [resume, setResume] = useState<ResumePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

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

  const resumeData = resume?.data;

  return (
    <div className="app">
      <ChatPanel resume={resumeData} />
      <div className="resume-wrapper">
        {isLoading && <p className="muted">載入履歷中...</p>}
        {error && <p className="error">{error}</p>}
        {!isLoading && !error && <ResumePanel resume={resumeData} />}
      </div>
    </div>
  );
};

export default App;
