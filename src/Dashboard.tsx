import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Filter,
  BarChart3,
  Globe,
  Eye,
  Shield,
  ChevronDown,
  Download
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface SiteHistory {
  domain: string;
  visits: number;
  totalTime: number;
  lastVisit: number;
  blocked: boolean;
  allowed: boolean;
}

interface DailyUsage {
  date: string;
  totalTime: number;
  visits: number;
  blockedAttempts: number;
  focusSessions: number;
  formattedDate: string;
}

interface DashboardStats {
  totalUsageTime: number;
  totalVisits: number;
  averageSessionTime: number;
  topSites: SiteHistory[];
  dailyUsage: DailyUsage[];
  weeklyComparison: number;
  blockedAttempts: number;
  focusSessionsCompleted: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsageTime: 0,
    totalVisits: 0,
    averageSessionTime: 0,
    topSites: [],
    dailyUsage: [],
    weeklyComparison: 0,
    blockedAttempts: 0,
    focusSessionsCompleted: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('30'); // days
  const [chartType, setChartType] = useState<'time' | 'visits' | 'combined'>('time');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [dateFilter]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get real data from Chrome storage
      const result = await chrome.storage.local.get([
        'siteHistory',
        'dailyUsage',
        'pauseLogs',
        'focusSessions',
        'distractingSites',
        'allowedSites',
        'visitLogs' // Add visit logs for more accurate daily data
      ]);

      const siteHistory = result.siteHistory || {};
      const visitLogs = result.visitLogs || [];
      const pauseLogs = result.pauseLogs || [];
      const focusSessions = result.focusSessions || [];
      const blockedSites = result.distractingSites || [];
      const allowedSites = result.allowedSites || [];

      // Process the real data
      const processed = processDashboardData(
        siteHistory, 
        visitLogs,
        pauseLogs, 
        focusSessions, 
        blockedSites, 
        allowedSites, 
        parseInt(dateFilter)
      );
      
      setStats(processed);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Set realistic demo data with proper structure
      setStats(getDemoData());
    } finally {
      setLoading(false);
    }
  };

  const processDashboardData = (
    siteHistory: any,
    visitLogs: any[],
    pauseLogs: any[],
    focusSessions: any[],
    blockedSites: string[],
    allowedSites: string[],
    days: number
  ): DashboardStats => {
    const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    // Process site history with real data
    const sites: SiteHistory[] = Object.entries(siteHistory)
      .map(([domain, data]: [string, any]) => ({
        domain,
        visits: data.visits || 0,
        totalTime: data.totalTime || 0,
        lastVisit: data.lastVisit || 0,
        blocked: blockedSites.some(blocked => 
          domain.includes(blocked.replace('*', '')) || blocked === domain
        ),
        allowed: allowedSites.some(allowed => 
          domain.includes(allowed.replace('*', '')) || allowed === domain
        )
      }))
      .filter(site => site.lastVisit > cutoffDate)
      .sort((a, b) => b.totalTime - a.totalTime);

    // Calculate totals
    const totalUsageTime = sites.reduce((sum, site) => sum + site.totalTime, 0);
    const totalVisits = sites.reduce((sum, site) => sum + site.visits, 0);
    const averageSessionTime = totalVisits > 0 ? Math.round(totalUsageTime / totalVisits) : 0;

    // Process daily usage from real visit logs
    const processedDailyUsage = generateRealDailyUsageData(visitLogs, pauseLogs, focusSessions, cutoffDate, days);

    // Calculate weekly comparison
    const thisWeekTime = processedDailyUsage.slice(-7).reduce((sum, day) => sum + day.totalTime, 0);
    const lastWeekTime = processedDailyUsage.slice(-14, -7).reduce((sum, day) => sum + day.totalTime, 0);
    const weeklyComparison = lastWeekTime > 0 ? ((thisWeekTime - lastWeekTime) / lastWeekTime) * 100 : 0;

    return {
      totalUsageTime,
      totalVisits,
      averageSessionTime,
      topSites: sites.slice(0, 10),
      dailyUsage: processedDailyUsage,
      weeklyComparison,
      blockedAttempts: pauseLogs.filter((log: any) => log.timestamp > cutoffDate).length,
      focusSessionsCompleted: focusSessions.filter((session: any) => 
        session.timestamp > cutoffDate && session.completed
      ).length
    };
  };

  const generateRealDailyUsageData = (
    visitLogs: any[], 
    pauseLogs: any[], 
    focusSessions: any[], 
    cutoffDate: number, 
    days: number
  ): DailyUsage[] => {
    const dailyData: DailyUsage[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      const dateStr = date.toISOString().split('T')[0];
      
      // Filter logs for this specific day
      const dayVisitLogs = visitLogs.filter(log => 
        log.timestamp >= dayStart && log.timestamp < dayEnd
      );
      
      const dayPauseLogs = pauseLogs.filter(log => 
        log.timestamp >= dayStart && log.timestamp < dayEnd
      );
      
      const dayFocusSessions = focusSessions.filter(session => 
        session.timestamp >= dayStart && session.timestamp < dayEnd
      );

      // Calculate real metrics for the day
      const totalTime = dayVisitLogs.reduce((sum: number, log: any) => sum + (log.duration || 0), 0);
      const visits = dayVisitLogs.length;
      const blockedAttempts = dayPauseLogs.length;
      
      dailyData.push({
        date: dateStr,
        totalTime,
        visits,
        blockedAttempts,
        focusSessions: dayFocusSessions.filter((session: any) => session.completed).length ,
        formattedDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    
    return dailyData;
  };

  const getDemoData = (): DashboardStats => {
    const demoData = Array.from({ length: parseInt(dateFilter) }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (parseInt(dateFilter) - 1 - i));
      const dateStr = date.toISOString().split('T')[0];
      
      // Create realistic usage patterns (higher on weekdays, lower on weekends)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const baseUsage = isWeekend ? 0.6 : 1.0;
      const randomFactor = 0.5 + Math.random() * 0.5;
      
      return {
        date: dateStr,
        totalTime: Math.floor(baseUsage * randomFactor * 3600 + 300), // 5min to 1hr
        visits: Math.floor(baseUsage * randomFactor * 25 + 5), // 5-30 visits
        blockedAttempts: Math.floor(Math.random() * 5),
        focusSessions: Math.floor(Math.random() * 4),
        formattedDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    });

    return {
      totalUsageTime: demoData.reduce((sum, day) => sum + day.totalTime, 0),
      totalVisits: demoData.reduce((sum, day) => sum + day.visits, 0),
      averageSessionTime: 47,
      topSites: [
        { domain: 'github.com', visits: 45, totalTime: 2430, lastVisit: Date.now(), blocked: false, allowed: true },
        { domain: 'youtube.com', visits: 23, totalTime: 1890, lastVisit: Date.now() - 3600000, blocked: true, allowed: false },
        { domain: 'stackoverflow.com', visits: 34, totalTime: 1245, lastVisit: Date.now() - 7200000, blocked: false, allowed: true },
        { domain: 'twitter.com', visits: 18, totalTime: 980, lastVisit: Date.now() - 86400000, blocked: true, allowed: false },
        { domain: 'docs.google.com', visits: 12, totalTime: 700, lastVisit: Date.now() - 172800000, blocked: false, allowed: true }
      ],
      dailyUsage: demoData,
      weeklyComparison: -12.5,
      blockedAttempts: demoData.reduce((sum, day) => sum + day.blockedAttempts, 0),
      focusSessionsCompleted: demoData.reduce((sum, day) => sum + day.focusSessions, 0)
    };
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatTimeForChart = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}h`;
    }
    return `${minutes}m`;
  };

  const exportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      period: `${dateFilter} days`,
      stats,
      sites: stats.topSites,
      dailyUsage: stats.dailyUsage
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waitful-dashboard-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-medium text-gray-900">
                {entry.dataKey === 'totalTime' ? formatTimeForChart(entry.value) : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Prepare site data for pie chart
  const siteChartData = stats.topSites.slice(0, 5).map(site => ({
    name: site.domain,
    value: site.totalTime,
    visits: site.visits
  }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Your browsing insights and analytics</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Last {dateFilter} days
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showFilters && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[160px]">
                {['7', '14', '30', '90'].map((days) => (
                  <button
                    key={days}
                    onClick={() => {
                      setDateFilter(days);
                      setShowFilters(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                      dateFilter === days ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    Last {days} days
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Usage</h3>
            <Clock className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {formatTime(stats.totalUsageTime)}
          </div>
          <div className={`flex items-center mt-2 text-xs ${
            stats.weeklyComparison > 0 ? 'text-red-600' : 'text-green-600'
          }`}>
            {stats.weeklyComparison > 0 ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : (
              <TrendingDown className="w-3 h-3 mr-1" />
            )}
            {Math.abs(stats.weeklyComparison).toFixed(1)}% vs last week
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Visits</h3>
            <Eye className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {stats.totalVisits.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Avg {formatTime(stats.averageSessionTime)} per visit
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Blocked Attempts</h3>
            <Shield className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {stats.blockedAttempts}
          </div>
          <div className="text-xs text-green-600 mt-2">
            Distractions prevented
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Focus Sessions</h3>
            <BarChart3 className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {stats.focusSessionsCompleted}
          </div>
          <div className="text-xs text-blue-600 mt-2">
            Sessions completed
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usage Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Usage Trend</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setChartType('time')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  chartType === 'time' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Time
              </button>
              <button
                onClick={() => setChartType('visits')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  chartType === 'visits' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Visits
              </button>
              <button
                onClick={() => setChartType('combined')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  chartType === 'combined' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Combined
              </button>
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'combined' ? (
                <AreaChart data={stats.dailyUsage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="formattedDate" 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="totalTime" 
                    stackId="1"
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.6}
                    name="Time (seconds)"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="visits" 
                    stackId="2"
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.6}
                    name="Visits"
                  />
                </AreaChart>
              ) : (
                <LineChart data={stats.dailyUsage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="formattedDate" 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey={chartType === 'time' ? 'totalTime' : 'visits'}
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                    name={chartType === 'time' ? 'Time' : 'Visits'}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Sites Pie Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Top Sites</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={siteChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {siteChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: any) => [formatTime(value), 'Time spent']}
                  labelFormatter={(label: any) => `${label}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {siteChartData.map((site, index) => (
              <div key={site.name} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-gray-600 truncate flex-1">{site.name}</span>
                <span className="font-medium text-gray-900">{formatTime(site.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Overview Bar Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Daily Activity Overview</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.dailyUsage}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="visits" fill="#3B82F6" name="Visits" />
              <Bar dataKey="blockedAttempts" fill="#EF4444" name="Blocked" />
              <Bar dataKey="focusSessions" fill="#10B981" name="Focus Sessions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Site History */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Site Access History</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Globe className="w-4 h-4" />
            {stats.topSites.length} sites tracked
          </div>
        </div>

        <div className="space-y-3">
          {stats.topSites.map((site, index) => (
            <div key={site.domain} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${site.domain}&sz=32`}
                    alt={`${site.domain} favicon`}
                    className="w-8 h-8 rounded"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZWwgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiB2aWV3Qm94PSIwIDAgMzIgMzIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgZmlsbD0iI0YzRjRGNiIvPgo8cGF0aCBkPSJNMTYgOEMxMy44IDggMTIgOS44IDEyIDEyVjIwQzEyIDIyLjIgMTMuOCAyNCAxNiAyNEMxOC4yIDI0IDIwIDIyLjIgMjAgMjBWMTJDMjAgOS44IDE4LjIgOCAxNiA4WiIgZmlsbD0iIzY1NzM4NCIvPgo8L3N2Zz4K';
                    }}
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 truncate">{site.domain}</h3>
                    {site.blocked && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                        Blocked
                      </span>
                    )}
                    {site.allowed && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        Allowed
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    Last visit: {new Date(site.lastVisit).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{site.visits}</div>
                  <div className="text-gray-500">visits</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{formatTime(site.totalTime)}</div>
                  <div className="text-gray-500">time</div>
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${stats.topSites[0] ? (site.totalTime / stats.topSites[0].totalTime) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {stats.topSites.length === 0 && (
          <div className="text-center py-12">
            <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No site data yet</h3>
            <p className="text-gray-500">Start browsing to see your site usage patterns here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;