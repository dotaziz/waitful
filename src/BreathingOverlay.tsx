import React, { useState, useEffect, useRef, useCallback } from "react";
import { BreathingOverlayProps, SiteHistory } from "./types";

const BreathingOverlay = (props: BreathingOverlayProps) => {
  const { duration, siteName, onComplete, onSkip } = props;
  const [breathingPhase, setBreathingPhase] = useState<
    "ready" | "inhale" | "complete"
  >("ready");
  const [fillHeight, setFillHeight] = useState("0%");
  const [visitsInLast24h, setVisitsInLast24h] = useState(0);
  const [lastVisitTimeAgo, setLastVisitTimeAgo] = useState("");
  const [showEvasionWarning, setShowEvasionWarning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);


  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const breatheDuration = 4000;

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""}`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""}`;
  };

  useEffect(() => {
    const loadStats = async () => {
      try {
        const result = await chrome.storage.local.get(["siteHistory"]);
        const history = result.siteHistory || {};
        const siteData: SiteHistory = history[siteName] || {
          visitTimestamps: [],
        };
        const now = Date.now();
        const oneDayAgo = now - 24 * 60 * 60 * 1000;

        const recentVisits = siteData.visitTimestamps.filter(
          (ts) => ts > oneDayAgo
        );
        setVisitsInLast24h(recentVisits.length + 1);

        if (siteData.visitTimestamps.length > 0) {
          const lastVisit =
            siteData.visitTimestamps[siteData.visitTimestamps.length - 1];
          setLastVisitTimeAgo(formatTimeAgo(lastVisit));
        } else {
          setLastVisitTimeAgo("This is your first visit");
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


  const handleWindowBlur = useCallback(() => {
    setIsPaused(true);
    setShowEvasionWarning(true);
    clearCurrentTimeout();
  }, []);

  const handleWindowFocus = useCallback(() => {
    setIsPaused(false);
    setShowEvasionWarning(false);
  }, []);


  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
        setIsPaused(true);
        setShowEvasionWarning(true);
        clearCurrentTimeout();
    }
  }, []);


  useEffect(() => {
    if (showEvasionWarning) {
      // Immediately close the tab as a consequence of evasion
      window.close();
    }
  }, [showEvasionWarning]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const blockedKeys = ["F5", "F12", "Escape"];
    const blockedCombos = [
      event.ctrlKey && (event.key === "r" || event.key === "w" || event.key === "t"),
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
    }
  }, []);


  const startBreathingCycle = useCallback(() => {
    setBreathingPhase("inhale");
    setFillHeight("100%");

    timeoutRef.current = setTimeout(() => {
      setBreathingPhase("complete");
      setFillHeight("0%");
    }, breatheDuration);
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
    if (isPaused) return "Paused";
    switch (breathingPhase) {
      case "ready":
      case "inhale":
        return "It's time to take a deep breath.";
      default:
        return ""; // Message is handled by the stats view now
    }
  };

  return (
    <>
      <style>{`
        /* AGGRESSIVE RESET & DEFINITIONS */
        #waitful-overlay, #waitful-overlay * {
          all: initial !important; /* Resets everything */
          box-sizing: border-box !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
        }

        :root {
          --brand-bg: #F8FAFC !important;
          --brand-primary: #1E293B !important;
          --brand-secondary: #64748B !important;
          --brand-accent-light: #E0F2FE !important;
          --brand-accent-medium: #B3E5FC !important;
        }

        /* OVERLAY STYLES */
        #waitful-overlay {
          background: var(--brand-bg) !important;
          color: var(--brand-primary) !important;
          position: fixed !important;
          top: 0 !important; left: 0 !important;
          width: 100vw !important; height: 100vh !important;
          z-index: 2147483647 !important;
          user-select: none !important;
          overflow: hidden !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-align: center !important;
        }

        /* FILL ANIMATION STYLES */
        #waitful-fill {
          position: absolute !important;
          bottom: 0 !important; left: 0 !important; right: 0 !important;
          background: linear-gradient(180deg, var(--brand-accent-light) 0%, var(--brand-accent-medium) 100%) !important;
          height: ${fillHeight} !important;
          z-index: 3 !important; /* Must be higher than content */
          transition: height ${breatheDuration}ms cubic-bezier(0.45, 0, 0.55, 1) !important;
        }

        /* CONTENT CONTAINER STYLES */
        #waitful-content-wrapper {
          position: relative !important;
          z-index: 2 !important; /* Lower than fill */
          height: 100% !important;
          width: 100% !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 2rem !important;
        }

        /* INITIAL MESSAGE STYLES */
        #main-message {
          font-size: 2.25rem !important;
          font-weight: 300 !important;
          max-width: 500px !important;
          min-height: 80px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: opacity 0.5s ease-in-out !important;
          opacity: ${breathingPhase === "complete" ? 0 : 1} !important;
          position: absolute !important; /* Keep it centered */
          z-index: 1 !important;
        }

        /* CALM STATS & DECISION UI STYLES */
        #calm-container {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 3.5rem !important; /* Increased gap for more calm space */
          max-width: 480px !important;
          width: 100% !important;
          padding: 1rem !important;
          /* This container is always present but only visible when the fill reveals it */
        }

        #stats-group {
          display: flex !important;
          flex-direction: column !important;
          gap: 1.5rem !important;
        }

        #stat-item {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
        }

        #stat-value {
          font-size: 2.5rem !important; /* Slightly smaller for a calmer feel */
          font-weight: 600 !important;
          line-height: 1 !important;
        }

        #stat-label {
          font-size: 1rem !important;
          color: var(--brand-secondary) !important;
          margin-top: 0.5rem !important;
        }

        #decision-group {
          width: 100% !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          gap: 1rem !important;
        }

        #decision-btn-primary {
          width: 100% !important;
          padding: 16px !important;
          background: var(--brand-primary) !important;
          color: white !important;
          font-weight: 600 !important;
          font-size: 1.1rem !important;
          text-align: center !important;
          border-radius: 1rem !important;
          border: none !important;
          cursor: pointer !important;
          transition: transform 0.2s ease, box-shadow 0.2s ease !important;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1) !important;
        }

        #decision-btn-primary:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15) !important;
        }

        #continue-link-secondary {
          color: var(--brand-secondary) !important;
          font-size: 0.9rem !important;
          font-weight: 500 !important; /* Slightly bolder for clarity */
          background: none !important;
          border: none !important;
          cursor: pointer !important;
          padding: 0.5rem !important;
          text-decoration: none !important;
        }

        #continue-link-secondary:hover {
          text-decoration: underline !important;
        }
      `}</style>

      <div id="waitful-overlay">
        <div id="waitful-fill" />
        <div id="waitful-content-wrapper">
          <div id="main-message">{getMainMessage()}</div>

          {breathingPhase === "complete" && (
            <div id="calm-container">
              <div id="stats-group">
                <div id="stat-item">
                  <span id="stat-value">{visitsInLast24h}</span>
                  <span id="stat-label">
                    visits to {siteName} in the last 24 hours
                  </span>
                </div>
                <div id="stat-item">
                  <span id="stat-value">{lastVisitTimeAgo}</span>
                  <span id="stat-label">since your last visit</span>
                </div>
              </div>

              <div id="decision-group">
                <button onClick={onComplete} id="decision-btn-primary">
                  I can wait, close this tab
                </button>
                <button
                  onClick={() => onSkip("proceed")}
                  id="continue-link-secondary"
                >
                  Proceed to {siteName}
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