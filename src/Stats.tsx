import React, { useEffect, useState } from "react";
// Stats Component
const Stats = () => {
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


export default Stats;