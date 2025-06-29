import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import BreathingOverlay from './BreathingOverlay';

// --- Step 1: Immediately inject placeholder to block page content ---
// This runs at document_start before any site content is rendered
const placeholder = document.createElement('div');
placeholder.id = 'waitful-root-placeholder';
placeholder.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #F8FAFC;
  z-index: 2147483647;
  pointer-events: none;
`;
document.documentElement.appendChild(placeholder);

// --- Step 2: Main execution logic ---
(async () => {
  let reactRoot: Root | null = null;
  let originalOverflow = '';

  // Settings interface
  interface Settings {
    distractingSites: string[];
    pauseDuration: number;
    enablePauses: boolean;
  }

  // Load settings from Chrome storage
  const loadSettings = async (): Promise<Settings> => {
    const result = await chrome.storage.sync.get([
      'distractingSites',
      'pauseDuration',
      'enablePauses',
    ]);
    return {
      distractingSites: result.distractingSites || [],
      pauseDuration: result.pauseDuration || 7,
      enablePauses: result.enablePauses !== false,
    };
  };

  // Check if current site should show pause
  const shouldShowPause = (settings: Settings): boolean => {
    if (!settings.enablePauses) return false;

    const currentDomain = window.location.hostname.replace('www.', '');
    return settings.distractingSites.some((siteDomain) =>
      currentDomain.includes(siteDomain) || siteDomain.includes(currentDomain)
    );
  };

  // Log pause events
  const logPauseEvent = async (action: string, data: any) => {
    const timestamp = Date.now();
    const today = new Date().toDateString();

    const result = await chrome.storage.local.get(['pauseLogs']);
    const logs = result.pauseLogs || {};

    if (!logs[today]) logs[today] = [];
    logs[today].push({ timestamp, action, ...data });

    await chrome.storage.local.set({ pauseLogs: logs });
  };

  // Remove overlay and cleanup
  const removeOverlay = async () => {
    if (reactRoot) {
      reactRoot.unmount();
      reactRoot = null;
    }
    if (placeholder.parentNode) {
      placeholder.remove();
    }
    // Restore page scroll
    document.documentElement.style.overflow = originalOverflow;
  };

  // Handle overlay completion (user chose to wait)
  const handleOverlayComplete = async () => {
    await removeOverlay();
    await logPauseEvent('completed', { domain: window.location.hostname });

    chrome.runtime.sendMessage({
      type: 'PAUSE_COMPLETED',
      domain: window.location.hostname,
      url: window.location.href,
    });
  };

  // Handle overlay skip (user chose to proceed)
  const handleOverlaySkip = async (reason: string) => {
    await removeOverlay();
    await logPauseEvent('skipped', {
      domain: window.location.hostname,
      reason,
    });

    chrome.runtime.sendMessage({
      type: 'PAUSE_SKIPPED',
      domain: window.location.hostname,
      url: window.location.href,
      reason,
    });
  };

  // Main execution
  const settings = await loadSettings();
  const currentDomain = window.location.hostname.replace('www.', '');

  if (shouldShowPause(settings)) {
    // --- Step 3: Hydrate full React UI into placeholder ---
    
    // Prevent page scroll and make overlay interactive
    originalOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    placeholder.style.pointerEvents = 'auto';

    // Log pause initiation
    await logPauseEvent('initiated', { 
      domain: currentDomain, 
      duration: settings.pauseDuration 
    });

    // Render React overlay
    reactRoot = createRoot(placeholder);
    reactRoot.render(
      <React.StrictMode>
        <BreathingOverlay
          duration={settings.pauseDuration}
          siteName={currentDomain}
          onComplete={handleOverlayComplete}
          onSkip={handleOverlaySkip}
        />
      </React.StrictMode>
    );
  } else {
    // --- Step 4: Not a distracting site, remove placeholder ---
    await removeOverlay();
  }

  // Listen for settings changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.distractingSites || changes.pauseDuration || changes.enablePauses) {
      console.log('Waitful: Settings changed, will apply on next page load.');
    }
  });

})().catch(console.error);