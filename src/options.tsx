import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import './styles/global.css';

interface Settings {
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
}

const defaultSettings: Settings = {
  defaultFocusTime: 25,
  pauseDuration: 5,
  enableNotifications: true,
  enableSounds: false,
  dailyTimeLimit: 60,
  distractingSites: [],
  allowedBreakTime: 10,
  darkMode: false,
  weeklyGoal: 7,
  focusGoal: 4,
  enableAnalytics: true,
  shareData: false
};

const WaitfulLogo = ({ size = 32 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 120 120" 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none"
    className="animate-pulse"
  >
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" className="text-blue-500" stopColor="currentColor" stopOpacity="1" />
        <stop offset="100%" className="text-blue-700" stopColor="currentColor" stopOpacity="1" />
      </linearGradient>
    </defs>
    
    <circle cx="60" cy="60" r="50" fill="url(#logoGradient)" opacity="0.1" />
    
    <g transform="translate(60, 60)">
      <rect x="-8" y="-12" width="4" height="24" rx="2" fill="url(#logoGradient)" />
      <rect x="4" y="-12" width="4" height="24" rx="2" fill="url(#logoGradient)" />
      
      <circle r="18" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3" strokeDasharray="3 3" className="text-blue-500">
        <animateTransform attributeName="transform" type="rotate" values="0;360" dur="8s" repeatCount="indefinite"/>
      </circle>
    </g>
  </svg>
);

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled = false }) => (
  <button
    type="button"
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
      disabled 
        ? 'cursor-not-allowed opacity-50' 
        : 'cursor-pointer'
    } ${
      checked 
        ? 'bg-blue-600' 
        : 'bg-gray-200 dark:bg-gray-700'
    }`}
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

// Sites Component
const SitesComponent: React.FC<{ settings: Settings; updateSettings: (updates: Partial<Settings>) => void }> = ({ settings, updateSettings }) => {
  const [newSite, setNewSite] = useState('');

  const addSite = () => {
    if (newSite.trim() && !settings.distractingSites.includes(newSite.trim())) {
      const sites = [...settings.distractingSites, newSite.trim()];
      updateSettings({ distractingSites: sites });
      setNewSite('');
    }
  };

  const removeSite = (siteToRemove: string) => {
    const sites = settings.distractingSites.filter(site => site !== siteToRemove);
    updateSettings({ distractingSites: sites });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Distracting Sites</h2>
        <p className="text-gray-600 dark:text-gray-400">Manage websites that you find distracting during focus sessions.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Site</h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Enter domain (e.g., facebook.com)"
            value={newSite}
            onChange={(e) => setNewSite(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addSite()}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            onClick={addSite}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Add Site
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Blocked Sites ({settings.distractingSites.length})
        </h3>
        
        {settings.distractingSites.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No distracting sites added yet. Add some to get started!
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {settings.distractingSites.map((site, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <img 
                    src={`https://www.google.com/s2/favicons?domain=${site}&sz=32`}
                    alt={`${site} favicon`}
                    className="w-5 h-5 rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iIzk0YTNiOCIvPgo8L3N2Zz4K';
                    }}
                  />
                  <span className="text-gray-900 dark:text-white font-medium">{site}</span>
                </div>
                <button
                  onClick={() => removeSite(site)}
                  className="px-3 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Schedule Component
const ScheduleComponent: React.FC<{ settings: Settings; updateSettings: (updates: Partial<Settings>) => void }> = ({ settings, updateSettings }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Focus Schedule</h2>
        <p className="text-gray-600 dark:text-gray-400">Configure your default focus session settings and timing preferences.</p>
      </div>

      <div className="grid gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Focus Sessions</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">Default Focus Time</label>
                <p className="text-sm text-gray-500 dark:text-gray-400">How long should focus sessions last by default?</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={settings.defaultFocusTime}
                  onChange={(e) => updateSettings({ defaultFocusTime: parseInt(e.target.value) || 25 })}
                  className="w-20 px-3 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="5"
                  max="120"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">minutes</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">Pause Duration</label>
                <p className="text-sm text-gray-500 dark:text-gray-400">How long should the mindful pause last?</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={settings.pauseDuration}
                  onChange={(e) => updateSettings({ pauseDuration: parseInt(e.target.value) || 5 })}
                  className="w-20 px-3 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="1"
                  max="30"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">seconds</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">Daily Time Limit</label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Maximum time allowed on distracting sites per day</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={settings.dailyTimeLimit}
                  onChange={(e) => updateSettings({ dailyTimeLimit: parseInt(e.target.value) || 60 })}
                  className="w-20 px-3 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="15"
                  max="480"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">minutes</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notifications</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">Enable Notifications</label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Show notifications when focus sessions end</p>
              </div>
              <ToggleSwitch
                checked={settings.enableNotifications}
                onChange={(checked) => updateSettings({ enableNotifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">Enable Sounds</label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Play gentle sounds during mindful pauses</p>
              </div>
              <ToggleSwitch
                checked={settings.enableSounds}
                onChange={(checked) => updateSettings({ enableSounds: checked })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Goals Component
const GoalsComponent: React.FC<{ settings: Settings; updateSettings: (updates: Partial<Settings>) => void }> = ({ settings, updateSettings }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Focus Goals</h2>
        <p className="text-gray-600 dark:text-gray-400">Set your daily and weekly focus targets to build better habits.</p>
      </div>

      <div className="grid gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daily Goals</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">Focus Sessions per Day</label>
                <p className="text-sm text-gray-500 dark:text-gray-400">How many focus sessions do you want to complete daily?</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={settings.focusGoal}
                  onChange={(e) => updateSettings({ focusGoal: parseInt(e.target.value) || 4 })}
                  className="w-20 px-3 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="1"
                  max="20"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">sessions</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">Weekly Goal</label>
                <p className="text-sm text-gray-500 dark:text-gray-400">How many days per week should you reach your daily goal?</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={settings.weeklyGoal}
                  onChange={(e) => updateSettings({ weeklyGoal: parseInt(e.target.value) || 7 })}
                  className="w-20 px-3 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="1"
                  max="7"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">days</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Current Progress</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">0/4</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Today's Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">0/7</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">This Week</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stats Component
const StatsComponent = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Usage Statistics</h2>
        <p className="text-gray-600 dark:text-gray-400">Track your progress and see how Waitful is helping you stay focused.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Total Focus Time</h3>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">0h 0m</div>
          <p className="text-sm text-gray-500 dark:text-gray-400">All time</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Sessions Completed</h3>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">0</div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total sessions</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Current Streak</h3>
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">0</div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Days</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Activity</h3>
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>Statistics will appear here once you start using Waitful</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Privacy Component
const PrivacyComponent: React.FC<{ settings: Settings; updateSettings: (updates: Partial<Settings>) => void }> = ({ settings, updateSettings }) => {
  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'waitful-settings.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Privacy & Data</h2>
        <p className="text-gray-600 dark:text-gray-400">Manage your data and privacy preferences.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data Collection</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">Enable Analytics</label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Collect anonymous usage data to improve the extension</p>
              </div>
              <ToggleSwitch
                checked={settings.enableAnalytics}
                onChange={(checked) => updateSettings({ enableAnalytics: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">Share Anonymous Data</label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Help improve Waitful by sharing anonymous usage statistics</p>
              </div>
              <ToggleSwitch
                checked={settings.shareData}
                onChange={(checked) => updateSettings({ shareData: checked })}
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data Management</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Export Settings</span>
                <p className="text-sm text-gray-500 dark:text-gray-400">Download your settings as a JSON file</p>
              </div>
              <button
                onClick={exportSettings}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Export
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Reset All Data</span>
                <p className="text-sm text-gray-500 dark:text-gray-400">Clear all settings and statistics</p>
              </div>
              <button
                onClick={() => {
                  if (confirm('This will reset all settings and data. Are you sure?')) {
                    chrome.storage.sync.clear();
                    chrome.storage.local.clear();
                    window.location.reload();
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h4 className="text-md font-semibold text-blue-900 dark:text-blue-100 mb-2">Privacy Notice</h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Waitful stores all data locally on your device. We never collect or transmit personal information. 
            Your browsing data remains private and under your control.
          </p>
        </div>
      </div>
    </div>
  );
};

const Options = () => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [activeTab, setActiveTab] = useState('sites');
  const [status, setStatus] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const result = await chrome.storage.sync.get(Object.keys(defaultSettings));
    setSettings({ ...defaultSettings, ...result });
  };

  const updateSettings = async (updates: Partial<Settings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await chrome.storage.sync.set(updates);
    
    setStatus('Settings saved!');
    setTimeout(() => setStatus(''), 2000);
  };

  const sidebarItems = [
    { id: 'sites', label: 'Sites', icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" fill="#e0e7ef" />
        <path d="M10 2a8 8 0 0 1 8 8h-8V2z" fill="#3b82f6" />
        <path d="M10 10v8a8 8 0 0 1-8-8h8z" fill="#2563eb" />
      </svg>
    ) },
    { id: 'schedule', label: 'Schedule', icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
        <rect x="3" y="4" width="14" height="13" rx="2" fill="#e0e7ef" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="6" y="1.5" width="2" height="5" rx="1" fill="#3b82f6"/>
        <rect x="12" y="1.5" width="2" height="5" rx="1" fill="#3b82f6"/>
        <circle cx="10" cy="12" r="3" fill="#2563eb"/>
        <path d="M10 10v2l1 1" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ) },
    { id: 'goals', label: 'Goals', icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="8" fill="#e0e7ef" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="10" cy="10" r="4" fill="#3b82f6"/>
        <path d="M10 6v4l2 2" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ) },
    { id: 'stats', label: 'Stats', icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
        <rect x="3" y="12" width="3" height="5" rx="1" fill="#3b82f6"/>
        <rect x="8.5" y="8" width="3" height="9" rx="1" fill="#2563eb"/>
        <rect x="14" y="4" width="3" height="13" rx="1" fill="#e0e7ef" stroke="currentColor" strokeWidth="1"/>
      </svg>
    ) },
    { id: 'privacy', label: 'Privacy', icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
        <rect x="4" y="8" width="12" height="8" rx="2" fill="#e0e7ef" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7 8V6a3 3 0 1 1 6 0v2" stroke="#3b82f6" strokeWidth="1.5"/>
        <circle cx="10" cy="13" r="1.5" fill="#2563eb"/>
      </svg>
    ) },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'sites':
        return <SitesComponent settings={settings} updateSettings={updateSettings} />;
      case 'schedule':
        return <ScheduleComponent settings={settings} updateSettings={updateSettings} />;
      case 'goals':
        return <GoalsComponent settings={settings} updateSettings={updateSettings} />;
      case 'stats':
        return <StatsComponent />;
      case 'privacy':
        return <PrivacyComponent settings={settings} updateSettings={updateSettings} />;
      default:
        return <SitesComponent settings={settings} updateSettings={updateSettings} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <WaitfulLogo size={32} />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Waitful Settings</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Configure your mindful browsing experience</p>
              </div>
            </div>
            
            {status && (
              <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium">
                {status}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
);