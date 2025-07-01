import { SettingsProps } from "./types";
import React, { useEffect, useState } from "react";

// Goals Component
const Goals= (props: SettingsProps) => {
    const {settings, updateSettings} = props;
    const [goalProgress, setGoalProgress] = useState<{ daily: number; weekly: number }>({ daily: 0, weekly: 0 });

    useEffect(() => {
      loadGoalProgress();
    }, []);

    const loadGoalProgress = async () => {
      try {
        const result = await chrome.storage.local.get(['focusSessions']);
        const focusSessions: { timestamp: number; completed: boolean }[] = result.focusSessions || [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());

        const dailySessions = focusSessions.filter(session => session.timestamp >= today.getTime() && session.completed).length;
        const weeklySessions = focusSessions.filter(session => session.timestamp >= weekStart.getTime() && session.completed).length;

        setGoalProgress({ daily: dailySessions, weekly: weeklySessions });
      } catch (error) {
        console.error('Failed to load goal progress:', error);
      }
    };

    const renderGoalAcknowledgment = () => {
      const dailyGoalMet = goalProgress.daily >= settings.focusGoal;
      const weeklyGoalMet = goalProgress.weekly >= settings.weeklyGoal;

      return (
        <div className="space-y-4">
          {dailyGoalMet && <p className="text-green-600">🎉 Daily goal achieved!</p>}
          {weeklyGoalMet && <p className="text-green-600">🎉 Weekly goal achieved!</p>}
        </div>
      );
    };

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
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{goalProgress.daily}/{settings.focusGoal}</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Today's Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{goalProgress.weekly}/{settings.weeklyGoal}</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">This Week</div>
            </div>
          </div>
        </div>
      </div>
      {renderGoalAcknowledgment()}
    </div>
  );
};

export default Goals;