import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

interface BreathingOverlayProps {
  duration: number;
  siteName: string;
  onComplete: () => void;
  onSkip: (reason: string) => void;
}

// Breathing Overlay Component
const BreathingOverlay: React.FC<BreathingOverlayProps> = ({
  duration,
  siteName,
  onComplete,
  onSkip
}) => {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);
  const [showSkipButton, setShowSkipButton] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('inhale');
  const [showEvasionWarning, setShowEvasionWarning] = useState(false);

  // Breathing cycle phases
  const breathingInstructions = {
    inhale: "Breathe in slowly...",
    hold: "Hold gently...",
    exhale: "Breathe out softly...", 
    rest: "Rest and reflect..."
  };

  // Handle visibility change (tab switching)
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      setIsPaused(true);
      setShowEvasionWarning(true);
    } else {
      setIsPaused(false);
      setShowEvasionWarning(false);
    }
  }, []);

  // Handle window blur/focus
  const handleWindowBlur = useCallback(() => {
    setIsPaused(true);
    setShowEvasionWarning(true);
  }, []);

  const handleWindowFocus = useCallback(() => {
    setIsPaused(false);
    setShowEvasionWarning(false);
  }, []);

  // Prevent keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const blockedKeys = ['F5', 'F12', 'Escape'];
    const blockedCombos = [
      event.ctrlKey && event.key === 'r', // Ctrl+R
      event.ctrlKey && event.key === 'w', // Ctrl+W
      event.ctrlKey && event.key === 't', // Ctrl+T
      event.ctrlKey && event.shiftKey && event.key === 'I', // DevTools
      event.altKey && event.key === 'F4', // Alt+F4
    ];

    if (blockedKeys.includes(event.key) || blockedCombos.some(combo => combo)) {
      event.preventDefault();
      event.stopPropagation();
      // Show gentle reminder
      setShowEvasionWarning(true);
      setTimeout(() => setShowEvasionWarning(false), 3000);
    }
  }, []);

  useEffect(() => {
    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('keydown', handleKeyDown, true);

    // Show skip button after 3 seconds
    const skipTimer = setTimeout(() => setShowSkipButton(true), 3000);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('keydown', handleKeyDown, true);
      clearTimeout(skipTimer);
    };
  }, [handleVisibilityChange, handleWindowBlur, handleWindowFocus, handleKeyDown]);

  // Main timer
  useEffect(() => {
    if (timeRemaining <= 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      if (!isPaused) {
        setTimeRemaining(prev => prev - 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isPaused, onComplete]);

  // Breathing phase cycle
  useEffect(() => {
    const phaseTimer = setInterval(() => {
      if (!isPaused) {
        setBreathingPhase(current => {
          switch (current) {
            case 'inhale': return 'hold';
            case 'hold': return 'exhale';
            case 'exhale': return 'rest';
            case 'rest': return 'inhale';
            default: return 'inhale';
          }
        });
      }
    }, 3000); // 3 second phases

    return () => clearInterval(phaseTimer);
  }, [isPaused]);

  const progress = ((duration - timeRemaining) / duration) * 100;

  const getBreathingScale = () => {
    switch (breathingPhase) {
      case 'inhale': return 1.2;
      case 'hold': return 1.2;
      case 'exhale': return 0.8;
      case 'rest': return 0.8;
      default: return 1;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
      zIndex: 2147483647,
      userSelect: 'none',
      textAlign: 'center',
    }}>
      {/* Site Info */}
      <div style={{
        position: 'absolute',
        top: '2rem',
        left: '2rem',
        fontSize: '0.9rem',
        opacity: 0.8,
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '0.5rem 1rem',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)',
      }}>
        Taking a mindful pause before <strong>{siteName}</strong>
      </div>

      {/* Main Text */}
      <div style={{
        fontSize: '2.5rem',
        fontWeight: 300,
        marginBottom: '1rem',
        opacity: 0.95,
      }}>
        Take a Deep Breath
      </div>

      {/* Breathing Container */}
      <div style={{ margin: '2rem 0', position: 'relative' }}>
        {/* Pulse Rings */}
        {[220, 260, 300].map((size, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: `${size}px`,
              height: `${size}px`,
              transform: 'translate(-50%, -50%)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              animation: `pulse 4s ease-in-out infinite`,
              animationDelay: `${index}s`,
            }}
          />
        ))}
        
        {/* Main Breathing Circle */}
        <div style={{
          width: '200px',
          height: '200px',
          border: '3px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '50%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 3s ease-in-out',
          transform: `scale(${getBreathingScale()})`,
        }}>
          <div style={{
            width: '150px',
            height: '150px',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05))',
            borderRadius: '50%',
            transition: 'transform 3s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 30px rgba(255, 255, 255, 0.1)',
            transform: `scale(${getBreathingScale()})`,
          }}>
            {/* Paused Indicator */}
            {isPaused && (
              <div style={{
                fontSize: '1.2rem',
                opacity: 1,
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                backdropFilter: 'blur(10px)',
              }}>
                ⏸️ Paused
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instruction */}
      <div style={{
        fontSize: '1.3rem',
        marginBottom: '2rem',
        opacity: 0.85,
        maxWidth: '500px',
        transition: 'all 0.5s ease',
      }}>
        {breathingInstructions[breathingPhase]}
      </div>

      {/* Timer */}
      <div style={{
        fontSize: '4rem',
        fontWeight: 700,
        margin: '1rem 0',
        textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
      }}>
        {timeRemaining}
      </div>

      {/* Progress Bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '6px',
        background: 'rgba(255, 255, 255, 0.2)',
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 1))',
          width: `${progress}%`,
          transition: 'width 0.5s ease',
          boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
        }} />
      </div>

      {/* Skip Button */}
      {showSkipButton && (
        <button
          onClick={() => onSkip('user_clicked')}
          style={{
            position: 'absolute',
            bottom: '2rem',
            right: '2rem',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '30px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            backdropFilter: 'blur(10px)',
            opacity: 0.7,
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.opacity = '1';
            target.style.background = 'rgba(255, 255, 255, 0.2)';
            target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLButtonElement;
            target.style.opacity = '0.7';
            target.style.background = 'rgba(255, 255, 255, 0.1)';
            target.style.transform = 'translateY(0)';
          }}
        >
          Continue to {siteName}
        </button>
      )}

      {/* Evasion Warning */}
      {showEvasionWarning && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 255, 255, 0.15)',
          padding: '1.5rem 2rem',
          borderRadius: '15px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(15px)',
          maxWidth: '400px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '1.1rem',
            marginBottom: '0.5rem',
            fontWeight: 500,
          }}>
            🧘 Gentle Reminder
          </div>
          <div style={{
            fontSize: '0.9rem',
            opacity: 0.8,
          }}>
            This pause helps you browse more mindfully. The timer will continue when you return your focus here.
          </div>
        </div>
      )}

      {/* CSS Animation for Pulse */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          50% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  );
};

// Main Content Script Class
class WaitfulContentScript {
  private settings: any = {};
  private overlayRoot: HTMLElement | null = null;
  private reactRoot: any = null;
  private isOverlayActive = false;
  private originalOverflow = '';

  constructor() {
    this.init();
  }

  private async init() {
    // Load settings
    await this.loadSettings();
    
    // Check if current site should trigger pause
    if (this.shouldShowPause()) {
      this.injectBreathingOverlay();
    }

    // Listen for settings changes
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.distractingSites || changes.pauseDuration) {
        this.loadSettings();
      }
    });
  }

  private async loadSettings() {
    const result = await chrome.storage.sync.get(['distractingSites', 'pauseDuration', 'enablePauses']);
    this.settings = {
      distractingSites: result.distractingSites || [], // Array of strings
      pauseDuration: result.pauseDuration || 7,
      enablePauses: result.enablePauses !== false // default true
    };
  }

  private shouldShowPause(): boolean {
    if (!this.settings.enablePauses || this.isOverlayActive) {
      return false;
    }

    const currentDomain = window.location.hostname.replace('www.', '');
    
    // console.log(this)
    // Fix: Handle array of strings, not objects
    return this.settings.distractingSites.some((siteDomain: string) => 
      currentDomain.includes(siteDomain) || siteDomain.includes(currentDomain)
    );
  }

  private async injectBreathingOverlay() {
    if (this.overlayRoot || this.isOverlayActive) return;

    this.isOverlayActive = true;

    // Create overlay container
    this.overlayRoot = document.createElement('div');
    this.overlayRoot.id = 'waitful-breathing-overlay';
    
    // Store original overflow and prevent page scroll
    this.originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    // Insert at the very end of body to ensure it's on top
    document.body.appendChild(this.overlayRoot);

    const currentDomain = window.location.hostname.replace('www.', '');
    
    // Fix: Since distractingSites is string[], just use default duration
    const duration = this.settings.pauseDuration;

    // Create React root and render overlay
    this.reactRoot = createRoot(this.overlayRoot);
    this.reactRoot.render(
      <BreathingOverlay
        duration={duration}
        siteName={currentDomain}
        onComplete={this.handleOverlayComplete.bind(this)}
        onSkip={this.handleOverlaySkip.bind(this)}
      />
    );

    // Log the pause initiation
    await this.logPauseEvent('initiated', { domain: currentDomain, duration });
  }

  private async handleOverlayComplete() {
    await this.removeOverlay();
    await this.logPauseEvent('completed', { domain: window.location.hostname });
    
    // Send analytics to background
    chrome.runtime.sendMessage({
      type: 'PAUSE_COMPLETED',
      domain: window.location.hostname,
      url: window.location.href
    });
  }

  private async handleOverlaySkip(reason: string) {
    await this.removeOverlay();
    await this.logPauseEvent('skipped', { 
      domain: window.location.hostname, 
      reason 
    });

    // Send analytics to background
    chrome.runtime.sendMessage({
      type: 'PAUSE_SKIPPED',
      domain: window.location.hostname,
      url: window.location.href,
      reason
    });
  }

  private async removeOverlay() {
    if (this.reactRoot) {
      this.reactRoot.unmount();
      this.reactRoot = null;
    }

    if (this.overlayRoot) {
      this.overlayRoot.remove();
      this.overlayRoot = null;
    }

    // Restore page scroll
    document.body.style.overflow = this.originalOverflow;
    this.isOverlayActive = false;
  }

  private async logPauseEvent(action: string, data: any) {
    const timestamp = Date.now();
    const today = new Date().toDateString();
    
    const result = await chrome.storage.local.get(['pauseLogs']);
    const logs = result.pauseLogs || {};
    
    if (!logs[today]) logs[today] = [];
    logs[today].push({
      timestamp,
      action,
      ...data
    });
    
    await chrome.storage.local.set({ pauseLogs: logs });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new WaitfulContentScript();
  });
} else {
  new WaitfulContentScript();
}