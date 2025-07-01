import React, { useEffect, useState } from "react";
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
import { 
  Clock, 
  Target, 
  Flame, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Shield
} from 'lucide-react';

interface StatsData {
  totalFocusTime: number;
  sessionsCompleted: number;
  currentStreak: number;
  weeklyActivity: Array<{
    day: string;
    focusTime: number;
    sessions: number;
    blockedAttempts: number;
  }>;
  focusSessionsBreakdown: Array<{
    duration: string;
    count: number;
    percentage: number;
  }>;
  productivityScore: number;
  weeklyComparison: number;
}

const Stats = () => {
  const [stats, setStats] = useState<StatsData>({
    totalFocusTime: 0,
    sessionsCompleted: 0,
    currentStreak: 0,
    weeklyActivity: [],
    focusSessionsBreakdown: [],
    productivityScore: 0,
    weeklyComparison: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [browsingAnalytics, setBrowsingAnalytics] = useState<{ siteVisits: { [siteName: string]: number } } | null>(null);

  useEffect(() => {
    loadStatsData();
    loadBrowsingAnalytics();
  }, [timeRange]);

  const loadStatsData = async () => {
    try {
      setLoading(true);
      
      // Get real data from Chrome storage
      const result = await chrome.storage.local.get([
        'focusSessions',
        'pauseLogs',
        'siteHistory',
        'visitLogs',
        'dailyStats'
      ]);

      const focusSessions = result.focusSessions || [];
      const pauseLogs = result.pauseLogs || [];
      const siteHistory = result.siteHistory || {};
      const visitLogs = result.visitLogs || [];

      // Process the real data
      const processed = processStatsData(focusSessions, pauseLogs, siteHistory, visitLogs, timeRange);
      setStats(processed);
    } catch (error) {
      console.error('Failed to load stats data:', error);
      // Set empty stats on error
      setStats({
        totalFocusTime: 0,
        sessionsCompleted: 0,
        currentStreak: 0,
        weeklyActivity: generateEmptyWeeklyData(),
        focusSessionsBreakdown: [],
        productivityScore: 0,
        weeklyComparison: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const processStatsData = (
    focusSessions: any[],
    pauseLogs: any[],
    siteHistory: any,
    visitLogs: any[],
    range: string
  ): StatsData => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    // Filter data by time range
    const recentFocusSessions = focusSessions.filter(session => session.timestamp > cutoffDate);
    const recentPauseLogs = pauseLogs.filter(log => log.timestamp > cutoffDate);
    const recentVisitLogs = visitLogs.filter(log => log.timestamp > cutoffDate);

    // Calculate total focus time and completed sessions
    const completedSessions = recentFocusSessions.filter(session => session.completed);
    const totalFocusTime = completedSessions.reduce((total, session) => total + (session.duration || 0), 0);
    const sessionsCompleted = completedSessions.length;

    // Calculate current streak
    const currentStreak = calculateStreak(focusSessions);

    // Generate weekly activity data
    const weeklyActivity = generateWeeklyActivity(recentFocusSessions, recentPauseLogs, days);

    // Calculate focus sessions breakdown
    const focusSessionsBreakdown = calculateFocusBreakdown(completedSessions);

    // Calculate productivity score (0-100)
    const productivityScore = calculateProductivityScore(
      recentFocusSessions,
      recentPauseLogs,
      recentVisitLogs
    );

    // Calculate weekly comparison
    const weeklyComparison = calculateWeeklyComparison(focusSessions, pauseLogs);

    return {
      totalFocusTime,
      sessionsCompleted,
      currentStreak,
      weeklyActivity,
      focusSessionsBreakdown,
      productivityScore,
      weeklyComparison
    };
  };

  const calculateStreak = (focusSessions: any[]): number => {
    if (focusSessions.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) { // Check up to a year
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dayStart = checkDate.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const sessionsOnDay = focusSessions.filter(session => 
        session.timestamp >= dayStart && 
        session.timestamp < dayEnd && 
        session.completed
      );

      if (sessionsOnDay.length > 0) {
        streak++;
      } else if (i > 0) { // Don't break on today if no sessions yet
        break;
      }
    }

    return streak;
  };

  const generateWeeklyActivity = (focusSessions: any[], pauseLogs: any[], days: number) => {
    const activity = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dayStart = date.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const dayFocusSessions = focusSessions.filter(session =>
        session.timestamp >= dayStart && 
        session.timestamp < dayEnd &&
        session.completed
      );

      const dayPauseLogs = pauseLogs.filter(log =>
        log.timestamp >= dayStart && log.timestamp < dayEnd
      );

      const focusTime = dayFocusSessions.reduce((total, session) => total + (session.duration || 0), 0);

      activity.push({
        day: days <= 7 ? dayNames[date.getDay()] : `${date.getMonth() + 1}/${date.getDate()}`,
        focusTime: Math.round(focusTime / 60), // Convert to minutes
        sessions: dayFocusSessions.length,
        blockedAttempts: dayPauseLogs.length
      });
    }

    return activity;
  };

  const generateEmptyWeeklyData = () => {
    const activity = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      activity.push({
        day: dayNames[date.getDay()],
        focusTime: 0,
        sessions: 0,
        blockedAttempts: 0
      });
    }

    return activity;
  };

  const calculateFocusBreakdown = (sessions: any[]) => {
    const breakdown = {
      '< 5 min': 0,
      '5-15 min': 0,
      '15-30 min': 0,
      '30+ min': 0
    };

    sessions.forEach(session => {
      const minutes = (session.duration || 0) / 60;
      if (minutes < 5) breakdown['< 5 min']++;
      else if (minutes < 15) breakdown['5-15 min']++;
      else if (minutes < 30) breakdown['15-30 min']++;
      else breakdown['30+ min']++;
    });

    const total = sessions.length;
    return Object.entries(breakdown).map(([duration, count]) => ({
      duration,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));
  };

  const calculateProductivityScore = (sessions: any[], pauseLogs: any[], visitLogs: any[]): number => {
    if (sessions.length === 0 && pauseLogs.length === 0) return 0;

    const completedSessions = sessions.filter(s => s.completed).length;
    const totalSessions = sessions.length;
    const completionRate = totalSessions > 0 ? completedSessions / totalSessions : 0;

    const completedPauses = pauseLogs.filter(p => p.action === 'completed').length;
    const totalPauses = pauseLogs.length;
    const pauseCompletionRate = totalPauses > 0 ? completedPauses / totalPauses : 1;

    const score = (completionRate * 0.7 + pauseCompletionRate * 0.3) * 100;
    return Math.round(score);
  };

  const calculateWeeklyComparison = (focusSessions: any[], pauseLogs: any[]): number => {
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = now - (14 * 24 * 60 * 60 * 1000);

    const thisWeekSessions = focusSessions.filter(s => 
      s.timestamp > oneWeekAgo && s.completed
    ).length;

    const lastWeekSessions = focusSessions.filter(s => 
      s.timestamp > twoWeeksAgo && s.timestamp <= oneWeekAgo && s.completed
    ).length;

    if (lastWeekSessions === 0) return thisWeekSessions > 0 ? 100 : 0;
    return Math.round(((thisWeekSessions - lastWeekSessions) / lastWeekSessions) * 100);
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

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
                {entry.dataKey === 'focusTime' ? `${entry.value}m` : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  const loadBrowsingAnalytics = async () => {
    try {
      const historyItems = await new Promise<chrome.history.HistoryItem[]>((resolve, reject) => {
        chrome.history.search({ text: '', maxResults: 1000 }, (results) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(results);
          }
        });
      });

      const siteVisits: { [siteName: string]: number } = {};

      historyItems.forEach((item: chrome.history.HistoryItem) => {
        if (item.url) {
          const url = new URL(item.url);
          const domain = url.hostname;
          siteVisits[domain] = (siteVisits[domain] || 0) + 1;
        }
      });

      setBrowsingAnalytics({ siteVisits });
    } catch (error) {
      console.error('Failed to load browsing analytics:', error);
    }
  };

  const renderBrowsingAnalytics = () => {
    if (!browsingAnalytics) return <p>Loading browsing analytics...</p>;

    const sortedSites = Object.entries(browsingAnalytics.siteVisits).sort((a, b) => b[1] - a[1]);

    return (
      <BarChart width={600} height={300} data={sortedSites.map(([site, visits]) => ({ site, visits }))}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="site" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="visits" fill="#8884d8" />
      </BarChart>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
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
          <h1 className="text-3xl font-light text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Your focus and productivity insights</p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                timeRange === range
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {range === '7d' ? '7 days' : range === '30d' ? '30 days' : '90 days'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Focus Time</h3>
            <Clock className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {formatTime(stats.totalFocusTime)}
          </div>
          <div className={`flex items-center mt-2 text-xs ${
            stats.weeklyComparison > 0 ? 'text-green-600' : stats.weeklyComparison < 0 ? 'text-red-600' : 'text-gray-500'
          }`}>
            {stats.weeklyComparison > 0 ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : stats.weeklyComparison < 0 ? (
              <TrendingDown className="w-3 h-3 mr-1" />
            ) : null}
            {stats.weeklyComparison !== 0 ? `${Math.abs(stats.weeklyComparison)}% vs last week` : 'No change'}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Sessions Completed</h3>
            <Target className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {stats.sessionsCompleted}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Focus sessions finished
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Current Streak</h3>
            <Flame className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {stats.currentStreak}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {stats.currentStreak === 1 ? 'Day' : 'Days'} in a row
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Productivity Score</h3>
            <BarChart3 className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-semibold text-gray-900">
            {stats.productivityScore}%
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Based on session completion
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Activity Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Activity Trend</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="day" 
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
                  dataKey="focusTime" 
                  stackId="1"
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.6}
                  name="Focus Time (min)"
                />
                <Area 
                  type="monotone" 
                  dataKey="sessions" 
                  stackId="2"
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.6}
                  name="Sessions"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Focus Session Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Session Duration</h2>
          {stats.focusSessionsBreakdown.length > 0 ? (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.focusSessionsBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="count"
                    >
                      {stats.focusSessionsBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [value, 'Sessions']}
                      labelFormatter={(label: any) => `${label}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {stats.focusSessionsBreakdown.map((item, index) => (
                  <div key={item.duration} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-gray-600">{item.duration}</span>
                    </div>
                    <span className="font-medium text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500">
              <div className="text-center">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No focus sessions yet</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Daily Activity Bar Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Daily Activity Breakdown</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.weeklyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="sessions" fill="#3B82F6" name="Focus Sessions" />
              <Bar dataKey="blockedAttempts" fill="#EF4444" name="Blocked Attempts" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Browsing Analytics */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Browsing Analytics</h2>
        {renderBrowsingAnalytics()}
      </div>

      {/* Empty State */}
      {stats.sessionsCompleted === 0 && stats.totalFocusTime === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Start Your Focus Journey</h3>
          <p className="text-gray-500 mb-4">
            Begin using Waitful to track your productivity and see your progress here.
          </p>
          <button
            onClick={loadStatsData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Stats
          </button>
        </div>
      )}
    </div>
  );
};


export default Stats;