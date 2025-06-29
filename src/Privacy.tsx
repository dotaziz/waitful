import React, { useEffect, useState } from "react";
import { SettingsProps } from "./types";
import ToggleSwitch from "./ToggleSwitch";
const Privacy = (props: SettingsProps) => {
  const { settings, updateSettings } = props;
  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "waitful-settings.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Privacy & Data
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your data and privacy preferences.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Data Collection
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Enable Analytics
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Collect anonymous usage data to improve the extension
                </p>
              </div>
              <ToggleSwitch
                checked={settings.enableAnalytics}
                onChange={(checked) =>
                  updateSettings({ enableAnalytics: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Share Anonymous Data
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Help improve Waitful by sharing anonymous usage statistics
                </p>
              </div>
              <ToggleSwitch
                checked={settings.shareData}
                onChange={(checked) => updateSettings({ shareData: checked })}
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Data Management
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Export Settings
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Download your settings as a JSON file
                </p>
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
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Reset All Data
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Clear all settings and statistics
                </p>
              </div>
              <button
                onClick={() => {
                  if (
                    confirm(
                      "This will reset all settings and data. Are you sure?"
                    )
                  ) {
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
          <h4 className="text-md font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Privacy Notice
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Waitful stores all data locally on your device. We never collect or
            transmit personal information. Your browsing data remains private
            and under your control.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
