// --- Core Extension Types ---

export interface Settings {
  defaultFocusTime: number;
  pauseDuration: number;
  enableNotifications: boolean;
  enableSounds: boolean;
  dailyTimeLimit: number;
  distractingSites: string[];
  allowedBreakTime: number;
  darkMode: boolean;
  weeklyGoal: number;
  focusGoal: number;
  enableAnalytics: boolean;
  shareData: boolean;
  browsingAnalytics?: BrowsingAnalytics;
  goals?: Goal[];
  schedule?: Schedule;
}


export interface DistractingSite {
  domain: string;
  favicon?: string;
}

export interface BreathingOverlayProps {
  duration: number;
  siteName: string;
  onComplete: () => void;
  onSkip: (reason: string) => void;
}


export interface SettingsProps {
    settings: Settings,
    updateSettings: (updates: Partial<Settings>) => void
}

// --- Site History & Statistics ---

export interface SiteHistory {
  visitTimestamps: number[];
}

export interface SiteStats {
  attempts: number;
  lastAttempt: string;
}

export interface PauseLogEntry {
  timestamp: number;
  action: 'initiated' | 'completed' | 'skipped';
  domain: string;
  reason?: string;
  duration?: number;
}

export interface PauseLogs {
  [date: string]: PauseLogEntry[];
}

// --- Breathing Animation States ---

export type BreathingPhase = 'ready' | 'inhale' | 'exhale' | 'complete';

export interface BreathingState {
  phase: BreathingPhase;
  fillHeight: string;
  showDecision: boolean;
  isPaused: boolean;
  showEvasionWarning: boolean;
}

// --- Chrome Extension Message Types ---

export interface ChromeMessage {
  type: 'PAUSE_COMPLETED' | 'PAUSE_SKIPPED' | 'CLOSE_TAB' | 'SETTINGS_CHANGED';
  domain?: string;
  url?: string;
  reason?: string;
  data?: any;
}

export interface StorageData {
  siteHistory?: { [siteName: string]: SiteHistory };
  siteStats?: { [siteName: string]: SiteStats };
  pauseLogs?: PauseLogs;
  distractingSites?: string[];
  pauseDuration?: number;
  enablePauses?: boolean;
}

// --- Component State Types ---

export interface ContentScriptState {
  reactRoot: any; // React Root type
  originalOverflow: string;
  settings: Settings;
}

export interface OverlayHandlers {
  onComplete: () => Promise<void>;
  onSkip: (reason: string) => Promise<void>;
  removeOverlay: () => Promise<void>;
}

// --- Utility Types ---

export type SkipReason = 'proceed' | 'emergency' | 'important' | 'other';

export interface TimeFormatOptions {
  includeSeconds?: boolean;
  shortForm?: boolean;
}

// --- Storage Keys ---

export const STORAGE_KEYS = {
  SITE_HISTORY: 'siteHistory',
  SITE_STATS: 'siteStats',
  PAUSE_LOGS: 'pauseLogs',
  DISTRACTING_SITES: 'distractingSites',
  PAUSE_DURATION: 'pauseDuration',
  ENABLE_PAUSES: 'enablePauses',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

// --- Event Types ---

export interface PauseEvent {
  type: 'pause_initiated' | 'pause_completed' | 'pause_skipped';
  timestamp: number;
  domain: string;
  duration?: number;
  reason?: string;
}

// --- Analytics Types ---

export interface UsageStats {
  totalPauses: number;
  completedPauses: number;
  skippedPauses: number;
  averagePauseDuration: number;
  mostVisitedSites: Array<{
    domain: string;
    count: number;
  }>;
}

export interface DailyStats {
  date: string;
  pauseCount: number;
  completionRate: number;
  topSites: string[];
}

export interface BrowsingAnalytics {
  siteVisits: { [siteName: string]: number };
  lastUpdated: number;
}

export interface Goal {
  description: string;
  target: number;
  progress: number;
  achieved: boolean;
}

export interface Schedule {
  startTime: string;
  endTime: string;
  activeDays: string[];
}