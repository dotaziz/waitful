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
  const [activeTab, setActiveTab] = useState('dashboard');
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
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-3 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-lg">Loading settings...</span>
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
        return <Dashboard />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Fixed Header */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0 z-10">
        <div className="px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <WaitfulLogo size={32} />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Waitful</h1>
                <p className="text-sm text-gray-500">Mindful browsing dashboard</p>
              </div>
            </div>
            
            {renderStatus()}
          </div>
        </div>
      </header>

      {/* Dashboard Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Fixed Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            <nav className="space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full group flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-blue-50 border border-blue-200 text-blue-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border border-transparent hover:border-gray-200'
                  }`}
                >
                  <div className={`transition-colors ${
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
                    <div className="w-1 h-8 bg-blue-600 rounded-full" />
                  )}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Quick Stats Card - Fixed at bottom of sidebar */}
          <div className="p-6 border-t border-gray-100">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gray-600" />
                Quick Stats
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Blocked sites</span>
                  <span className="font-semibold text-gray-900 bg-white px-2 py-1 rounded text-xs">
                    {settings.distractingSites?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Focus time</span>
                  <span className="font-semibold text-gray-900 bg-white px-2 py-1 rounded text-xs">
                    {settings.defaultFocusTime}m
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pause duration</span>
                  <span className="font-semibold text-gray-900 bg-white px-2 py-1 rounded text-xs">
                    {settings.pauseDuration}s
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            <div className="max-w-6xl mx-auto">
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