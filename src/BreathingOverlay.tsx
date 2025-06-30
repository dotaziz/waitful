import React, { useState, useEffect, useRef, useCallback } from "react";

interface BreathingOverlayProps {
  duration: number;
  siteName: string;
  onComplete: () => void;
  onSkip: (reason: string) => void;
}

interface SiteStats {
  attempts: number;
  lastAttempt: string;
}

const BreathingOverlay = (props: BreathingOverlayProps) => {
  const { duration, siteName, onComplete, onSkip } = props;
  const [breathingPhase, setBreathingPhase] = useState<
    "ready" | "inhale" | "exhale" | "complete"
  >("ready");
  const [fillHeight, setFillHeight] = useState("0%");
  const [showDecision, setShowDecision] = useState(false);
  const [siteStats, setSiteStats] = useState<SiteStats>({
    attempts: 0,
    lastAttempt: "",
  });
  const [isPaused, setIsPaused] = useState(false);
  const [showEvasionWarning, setShowEvasionWarning] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const breatheDuration = 4000;

  useEffect(() => {
    const loadStats = async () => {
      try {
        const result = await chrome.storage.local.get(["siteStats"]);
        const stats = result.siteStats || {};
        const currentSiteStats = stats[siteName] || {
          attempts: 0,
          lastAttempt: "",
        };
        const updatedStats = {
          ...stats,
          [siteName]: {
            attempts: currentSiteStats.attempts + 1,
            lastAttempt: new Date().toLocaleString(),
          },
        };
        await chrome.storage.local.set({ siteStats: updatedStats });
        setSiteStats(updatedStats[siteName]);
      } catch (error) {
        console.log("Could not load stats:", error);
        setSiteStats({ attempts: 1, lastAttempt: new Date().toLocaleString() });
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
    if (isPaused) return;

    setBreathingPhase("inhale");
    setFillHeight("100%");

    timeoutRef.current = setTimeout(() => {
      setBreathingPhase("exhale");
      setFillHeight("0%");

      timeoutRef.current = setTimeout(() => {
        setBreathingPhase("complete");
        setShowDecision(true);
      }, breatheDuration);
    }, breatheDuration);
  }, [isPaused]);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      setIsPaused(true);
      setShowEvasionWarning(true);
      clearCurrentTimeout();
    } else {
      setIsPaused(false);
      setShowEvasionWarning(false);
    }
  }, []);

  const handleWindowBlur = useCallback(() => {
    setIsPaused(true);
    setShowEvasionWarning(true);
    clearCurrentTimeout();
  }, []);

  const handleWindowFocus = useCallback(() => {
    setIsPaused(false);
    setShowEvasionWarning(false);
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const blockedKeys = ["F5", "F12", "Escape"];
    const blockedCombos = [
      event.ctrlKey && event.key === "r",
      event.ctrlKey && event.key === "w",
      event.ctrlKey && event.key === "t",
      event.ctrlKey && event.shiftKey && event.key === "I",
      event.altKey && event.key === "F4",
    ];

    if (
      blockedKeys.includes(event.key) ||
      blockedCombos.some((combo) => combo)
    ) {
      event.preventDefault();
      event.stopPropagation();
      setShowEvasionWarning(true);
      setTimeout(() => setShowEvasionWarning(false), 3000);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("keydown", handleKeyDown, true);
    const startTimer = setTimeout(startBreathingCycle, 1000);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("keydown", handleKeyDown, true);
      clearCurrentTimeout();
      clearTimeout(startTimer);
    };
  }, [
    startBreathingCycle,
    handleVisibilityChange,
    handleWindowBlur,
    handleWindowFocus,
    handleKeyDown,
  ]);

  const getMainMessage = () => {
    if (isPaused) return "Paused. Bring your focus back to this screen.";
    switch (breathingPhase) {
      case "ready":
        return "An intentional pause from Waitful.";
      case "inhale":
        return "Breathe in and fill your lungs.";
      case "exhale":
        return "Gently release the breath.";
      case "complete":
        return "What is your intention now?";
      default:
        return "";
    }
  };

  const getStatsMessage = () => {
    if (siteStats.attempts <= 1) {
      return `This is your first intentional pause for ${siteName}.`;
    }
    return `You've paused for ${siteName} ${siteStats.attempts} times. Last visit: ${siteStats.lastAttempt}`;
  };

  return (
    <>
      <style>{`
        :root {
          --brand-bg: #F8FAFC;
          --brand-primary: #334155;
          --brand-secondary: #64748B;
          --brand-accent-light: #E0F2FE;
          --brand-accent-medium: #B3E5FC;
          --brand-border: #E2E8F0;
        }
        .waitful-overlay {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: var(--brand-bg);
          color: var(--brand-primary);
          position: fixed;
          top: 0; left: 0;
          width: 100vw; height: 100vh;
          z-index: 2147483647;
          user-select: none;
          overflow: hidden;
        }
        .waitful-fill {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          background: linear-gradient(180deg, var(--brand-accent-light) 0%, var(--brand-accent-medium) 100%);
          height: ${fillHeight};
          z-index: 1;
          /* A smoother bezier curve for a more natural feel */
          transition: height ${breatheDuration}ms cubic-bezier(0.45, 0, 0.55, 1);
        }
        .waitful-content {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 2rem;
        }
        .fade-in {
          animation: fadeIn 1s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .main-message {
          font-size: 2.5rem;
          font-weight: 300;
          line-height: 1.3;
          max-width: 600px;
          margin-bottom: 2rem;
        }
        .instruction-text {
          position: absolute;
          bottom: 5rem;
          font-size: 1.125rem;
          color: var(--brand-secondary);
          transition: opacity 0.5s ease-in-out;
          opacity: ${
            breathingPhase === "inhale" || breathingPhase === "exhale" ? 1 : 0
          };
        }
        .stats-message {
          font-size: 1rem;
          color: var(--brand-secondary);
          max-width: 500px;
          line-height: 1.5;
          text-align: center;
          /* Use opacity to fade in/out to prevent layout shift */
          opacity: ${breathingPhase === "exhale" && !isPaused ? 1 : 0};
          transition: opacity 0.5s ease-in-out;
        }
        .decision-container {
          position: absolute;
          left: 50%;
          bottom: 10vh;
          transform: translateX(-50%);
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .decision-btn {
          width: 100%;
          padding: 16px;
          background: var(--brand-primary);
          color: white;
          font-weight: 600;
          font-size: 1.1rem;
          border-radius: 1rem;
          border: none;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
        }
        .decision-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
        }
        .continue-link {
          color: var(--brand-secondary);
          font-size: 1rem;
          font-weight: 500;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
        }
        .continue-link:hover {
          color: var(--brand-primary);
        }
        .site-tag {
          position: absolute;
          top: 2rem;
          left: 2rem;
          background: white;
          padding: 0.75rem 1.25rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          color: var(--brand-primary);
          font-weight: 500;
          border: 1px solid var(--brand-border);
          z-index: 3;
        }
      `}</style>

      <div className="waitful-overlay">
        <div className="waitful-fill" />
        <div className="site-tag">🌐 {siteName}</div>

        <div className="waitful-content">
          <div className="main-message fade-in">{getMainMessage()}</div>

          <div className="stats-message">{getStatsMessage()}</div>

          <div className="instruction-text">
            {isPaused
              ? ""
              : breathingPhase === "inhale"
              ? "Feel the pause..."
              : "Gently release..."}
          </div>

          {showDecision && (
            <div className="decision-container fade-in">
              <button onClick={onComplete} className="decision-btn">
                I can wait, close this tab
              </button>
              <button
                onClick={() => onSkip("proceed")}
                className="continue-link"
              >
                Proceed to site
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BreathingOverlay;
