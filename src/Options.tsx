import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import './styles/global.css';
import Sites from "./Sites";
import Schedule from "./Schedule";
import Goals from "./Goals";
import Stats from "./Stats";
import Privacy from "./Privacy";

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
        return <Sites settings={settings} updateSettings={updateSettings} />;
      case 'schedule':
        return <Schedule settings={settings} updateSettings={updateSettings} />;
      case 'goals':
        return <Goals settings={settings} updateSettings={updateSettings} />;
      case 'stats':
        return <Stats />;
      case 'privacy':
        return <Privacy settings={settings} updateSettings={updateSettings} />;
      default:
        return <Sites settings={settings} updateSettings={updateSettings} />;
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