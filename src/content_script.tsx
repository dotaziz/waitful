import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import BreathingOverlay from './BreathingOverlay';
import { Settings } from './types';

// --- Main execution logic using Shadow DOM ---
(async () => {
  // Define a single host element for our UI
  const HOST_ID = 'waitful-shadow-host';
  let hostElement = document.getElementById(HOST_ID);
  
  // Clean up any old instances first
  if (hostElement) {
    hostElement.remove();
  }
  
  // Load settings from Chrome storage
  const loadSettings = async (): Promise<Settings> => {
    const result = await chrome.storage.sync.get([
      'distractingSites',
      'pauseDuration',
      'enablePauses',
    ]);
    return {
      ...result as Settings,
      distractingSites: result.distractingSites || [],
      pauseDuration: result.pauseDuration || 7,
    };
  };

  // Check if current site should show pause
  const shouldShowPause = (settings: Settings): boolean => {
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

  // Main execution
  const settings = await loadSettings();
  if (!shouldShowPause(settings)) {
    return; // Not a distracting site, do nothing.
  }

  // --- Step 1: Create the Host and Shadow Root ---
  hostElement = document.createElement('div');
  hostElement.id = HOST_ID;
  document.documentElement.appendChild(hostElement);

  const shadowRoot = hostElement.attachShadow({ mode: 'open' });
  
  // Create the container for the React app inside the Shadow DOM
  const appContainer = document.createElement('div');
  shadowRoot.appendChild(appContainer);
  
  // We need to either link a stylesheet or inject styles directly into the shadow DOM.
  // For portability, injecting a style tag is robust.
  const styleElement = document.createElement('style');
  // You can link to a CSS file in your extension package or define styles here.
  // For this example, we'll assume BreathingOverlay provides its own styles.
  shadowRoot.appendChild(styleElement);


  // --- Step 2: Define Handlers and Render the App ---
  let reactRoot: Root | null = createRoot(appContainer);
  let originalOverflow = document.documentElement.style.overflow;

  // Prevent page scroll
  document.documentElement.style.overflow = 'hidden';

  const cleanup = () => {
    if (reactRoot) {
      reactRoot.unmount();
      reactRoot = null;
    }
    if (hostElement) {
      hostElement.remove();
    }
    document.documentElement.style.overflow = originalOverflow;
  };

  const handleOverlayComplete = async () => {
    await logPauseEvent('completed', { domain: window.location.hostname });
    chrome.runtime.sendMessage({ type: 'PAUSE_COMPLETED' });
    cleanup();
  };

  const handleOverlaySkip = async (reason: string) => {
    await logPauseEvent('skipped', { domain: window.location.hostname, reason });
    chrome.runtime.sendMessage({ type: 'PAUSE_SKIPPED', reason });
    cleanup();
  };
  
  await logPauseEvent('initiated', { 
    domain: window.location.hostname, 
    duration: settings.pauseDuration 
  });

  reactRoot.render(
    <React.StrictMode>
      <BreathingOverlay
        duration={settings.pauseDuration}
        siteName={window.location.hostname.replace('www.', '')}
        onComplete={handleOverlayComplete}
        onSkip={handleOverlaySkip}
      />
    </React.StrictMode>
  );

})().catch(console.error);
