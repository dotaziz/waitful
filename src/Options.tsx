import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import './styles/global.css';
import Sites from "./Sites";
import Schedule from "./Schedule";
import Goals from "./Goals";
import Stats from "./Stats";
import Privacy from "./Privacy";
import { Settings } from "./types";

// Import Lucide icons
import { 
  Globe, 
  Calendar, 
  Target, 
  BarChart3, 
  Shield,
  CheckCircle,
  Loader2
} from "lucide-react";
import Dashboard from "./Dashboard";

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
    className="flex-shrink-0"
  >
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
    </defs>
    
    <circle cx="60" cy="60" r="50" fill="url(#logoGradient)" opacity="0.1" />
    
    <g transform="translate(60, 60)">
      <rect x="-8" y="-12" width="4" height="24" rx="2" fill="url(#logoGradient)" />
      <rect x="4" y="-12" width="4" height="24" rx="2" fill="url(#logoGradient)" />
      
      <circle 
        r="18" 
        stroke="#3B82F6" 
        strokeWidth="1.5" 
        fill="none" 
        opacity="0.4" 
        strokeDasharray="2 4"
      />
    </g>
  </svg>
);

const Options = () => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [activeTab, setActiveTab] = useState('sites');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const result = await chrome.storage.sync.get(Object.keys(defaultSettings));
      setSettings({ ...defaultSettings, ...result });
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<Settings>) => {
    try {
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);
      await chrome.storage.sync.set(updates);
      
      setStatus('saved');
      setTimeout(() => setStatus(''), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setStatus('error');
      setTimeout(() => setStatus(''), 2000);
    }
  };

  const sidebarItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: <BarChart3 className="w-5 h-5" />,
      description: 'Overview & quick actions'
    },
    { 
      id: 'sites', 
      label: 'Blocked Sites', 
      icon: <Globe className="w-5 h-5" />,
      description: 'Manage distracting websites'
    },
    { 
      id: 'schedule', 
      label: 'Schedule', 
      icon: <Calendar className="w-5 h-5" />,
      description: 'Set active hours'
    },
    { 
      id: 'goals', 
      label: 'Goals', 
      icon: <Target className="w-5 h-5" />,
      description: 'Track your progress'
    },
    { 
      id: 'stats', 
      label: 'Analytics', 
      icon: <BarChart3 className="w-5 h-5" />,
      description: 'View your insights'
    },
    { 
      id: 'privacy', 
      label: 'Privacy', 
      icon: <Shield className="w-5 h-5" />,
      description: 'Data and security'
    }
  ];

  const renderStatus = () => {
    if (!status) return null;
    
    const isError = status === 'error';
    const isLoading = status === 'saving';
    
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        isError 
          ? 'bg-red-50 text-red-700 border border-red-200' 
          : 'bg-green-50 text-green-700 border border-green-200'
      }`}>
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CheckCircle className="w-4 h-4" />
        )}
        {isError ? 'Failed to save' : 'Settings saved'}
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading settings...</span>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <WaitfulLogo size={32} />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Waitful</h1>
                <p className="text-sm text-gray-500">Mindful browsing settings</p>
              </div>
            </div>
            
            {renderStatus()}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Enhanced Sidebar */}
          <div className="w-72 flex-shrink-0">
            <nav className="space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full group flex items-start gap-3 px-4 py-3 text-left rounded-xl transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-blue-50 border border-blue-200 text-blue-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:border-gray-200 border border-transparent'
                  }`}
                >
                  <div className={`mt-0.5 transition-colors ${
                    activeTab === item.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                  }`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm ${
                      activeTab === item.id ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {item.label}
                    </div>
                    <div className={`text-xs mt-0.5 ${
                      activeTab === item.id ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {item.description}
                    </div>
                  </div>
                  
                  {/* Active indicator */}
                  {activeTab === item.id && (
                    <div className="w-1 h-6 bg-blue-600 rounded-full" />
                  )}
                </button>
              ))}
            </nav>
            
            {/* Quick Stats Card */}
            <div className="mt-8 p-4 bg-white rounded-xl border border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Stats</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Blocked sites</span>
                  <span className="font-medium text-gray-900">
                    {settings.distractingSites?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Focus time</span>
                  <span className="font-medium text-gray-900">
                    {settings.defaultFocusTime}m
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pause duration</span>
                  <span className="font-medium text-gray-900">
                    {settings.pauseDuration}s
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden p-10">
              {renderContent()}
            </div>
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