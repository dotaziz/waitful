import React, { useState, useEffect, useRef, useCallback } from "react";

interface BreathingOverlayProps {
  duration: number;
  siteName: string;
  onComplete: () => void;
  onSkip: (reason: string) => void;
}

interface SiteHistory {
  visitTimestamps: number[];
}

const BreathingOverlay = (props: BreathingOverlayProps) => {
  const { duration, siteName, onComplete, onSkip } = props;
  const [breathingPhase, setBreathingPhase] = useState<"ready" | "inhale" | "complete">(
    "ready"
  );
  const [fillHeight, setFillHeight] = useState("0%");
  const [visitsInLast24h, setVisitsInLast24h] = useState(0);
  const [lastVisitTimeAgo, setLastVisitTimeAgo] = useState("");

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const breatheDuration = 4000;

  // Utility function to format time since last visit (Unchanged)
  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  useEffect(() => {
    const loadStats = async () => {
      try {
        const result = await chrome.storage.local.get(["siteHistory"]);
        const history = result.siteHistory || {};
        const siteData: SiteHistory = history[siteName] || { visitTimestamps: [] };
        const now = Date.now();
        const oneDayAgo = now - 24 * 60 * 60 * 1000;

        const recentVisits = siteData.visitTimestamps.filter(ts => ts > oneDayAgo);
        setVisitsInLast24h(recentVisits.length + 1);

        if (siteData.visitTimestamps.length > 0) {
          const lastVisit = siteData.visitTimestamps[siteData.visitTimestamps.length - 1];
          setLastVisitTimeAgo(formatTimeAgo(lastVisit));
        } else {
          setLastVisitTimeAgo("this is your first visit");
        }

        const updatedTimestamps = [...siteData.visitTimestamps, now];
        const updatedHistory = {
          ...history,
          [siteName]: { visitTimestamps: updatedTimestamps },
        };
        await chrome.storage.local.set({ siteHistory: updatedHistory });
      } catch (error) {
        console.log("Could not load site history:", error);
        setVisitsInLast24h(1);
        setLastVisitTimeAgo("this is your first visit");
      }
    };

    loadStats();
  }, [siteName]);

  const clearCurrentTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const startBreathingCycle = useCallback(() => {
    setBreathingPhase("inhale");
    setFillHeight("100%");

    // This timeout triggers the "reveal"
    timeoutRef.current = setTimeout(() => {
      // Set the phase to complete to render the stats and decision UI *behind* the fill
      setBreathingPhase("complete");
      // Start the fill animation downwards, revealing the new UI
      setFillHeight("0%");
    }, breatheDuration);
  }, []);

  // Event listeners for pausing (Unchanged)
  const [isPaused, setIsPaused] = useState(false);
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) setIsPaused(true);
    else setIsPaused(false);
  }, []);
  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const startTimer = setTimeout(startBreathingCycle, 1000);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearCurrentTimeout();
      clearTimeout(startTimer);
    };
  }, [startBreathingCycle, handleVisibilityChange]);


  const getMainMessage = () => {
    if (isPaused) return "Paused";
    switch (breathingPhase) {
      case "ready":
      case "inhale":
        return "It's time to take a deep breath.";
      // The "complete" message is no longer needed here as the stats take its place
      default:
        return "";
    }
  };

  return (
    <>
      <style>{`
        :root {
          --brand-bg: #F8FAFC;
          --brand-primary: #1E293B;
          --brand-secondary: #64748B;
          --brand-accent-light: #E0F2FE;
          --brand-accent-medium: #B3E5FC;
        }
        .waitful-overlay {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: var(--brand-bg);
          color: var(--brand-primary);
          position: fixed; top: 0; left: 0;
          width: 100vw; height: 100vh;
          z-index: 2147483647;
          user-select: none;
          overflow: hidden;
        }
        .waitful-fill {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: linear-gradient(180deg, var(--brand-accent-light) 0%, var(--brand-accent-medium) 100%);
          height: ${fillHeight};
          z-index: 3; /* HIGHER z-index to cover the content */
          transition: height ${breatheDuration}ms cubic-bezier(0.45, 0, 0.55, 1);
        }
        .waitful-content {
          position: relative;
          z-index: 2; /* LOWER z-index so it's covered by the fill */
          height: 100%;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; padding: 2rem;
        }
        .main-message {
          font-size: 2.25rem; font-weight: 300;
          max-width: 500px;
          min-height: 80px;
          display: flex; align-items: center; justify-content: center;
          /* Fade out as the stats are revealed */
          transition: opacity 0.5s ease-in-out;
          opacity: ${breathingPhase === 'complete' ? 0 : 1};
        }
        .stats-and-decision-container {
          position: absolute; top: 0; left: 0;
          height: 100%; width: 100%;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          /* This container is always present but only visible when the fill reveals it */
        }
        .stats-container {
          display: flex; flex-direction: column; gap: 1.5rem;
          padding: 1rem;
          margin-bottom: auto; /* Pushes itself to the top of its container space */
          padding-top: 30vh;
        }
        .stat-item {
          display: flex; flex-direction: column; align-items: center;
        }
        .stat-value {
          font-size: 3rem; font-weight: 700;
          line-height: 1;
        }
        .stat-label {
          font-size: 1rem; color: var(--brand-secondary);
          margin-top: 0.5rem;
        }
        .decision-container {
          width: 100%; max-width: 420px;
          display: flex; flex-direction: column; align-items: center; gap: 1.5rem;
          margin-top: auto; /* Pushes itself to the bottom */
          padding-bottom: 10vh;
        }
        .decision-btn-primary {
          width: 100%; padding: 16px;
          background: var(--brand-primary); color: white;
          font-weight: 600; font-size: 1.1rem; border-radius: 1rem; border: none;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
        }
        .decision-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }
        .continue-link-secondary {
          color: var(--brand-secondary);
          font-size: 0.9rem; font-weight: 400;
          background: none; border: none; cursor: pointer;
          padding: 0.5rem; text-decoration: none;
        }
        .continue-link-secondary:hover {
          text-decoration: underline;
        }
      `}</style>

      <div className="waitful-overlay">
        <div className="waitful-fill" />
        <div className="waitful-content">
          <div className="main-message">{getMainMessage()}</div>

          {breathingPhase === 'complete' && (
            <div className="stats-and-decision-container">
              <div className="stats-container">
                <div className="stat-item">
                  <span className="stat-value">{visitsInLast24h}</span>
                  <span className="stat-label">visits to {siteName} in the last 24 hours</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{lastVisitTimeAgo}</span>
                  <span className="stat-label">since your last visit</span>
                </div>
              </div>

              <div className="decision-container">
                <button onClick={onComplete} className="decision-btn-primary">
                  I can wait, close this tab
                </button>
                <button onClick={() => onSkip("proceed")} className="continue-link-secondary">
                  Proceed to site
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BreathingOverlay;


// this is fine...

// make the stats/decison UI more calmly to help declutter the users mind to make informed decison

