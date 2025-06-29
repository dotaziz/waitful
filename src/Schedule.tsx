import ToggleSwitch from "./ToggleSwitch";
import { SettingsProps } from "./types";
import React, { useEffect, useState } from "react";

const Schedule = (props: SettingsProps) => {
  const { settings, updateSettings } = props;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Focus Schedule
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Configure your default focus session settings and timing preferences.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Focus Sessions
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Default Focus Time
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  How long should focus sessions last by default?
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={settings.defaultFocusTime}
                  onChange={(e) =>
                    updateSettings({
                      defaultFocusTime: parseInt(e.target.value) || 25,
                    })
                  }
                  className="w-20 px-3 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="5"
                  max="120"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  minutes
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Pause Duration
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  How long should the mindful pause last?
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={settings.pauseDuration}
                  onChange={(e) =>
                    updateSettings({
                      pauseDuration: parseInt(e.target.value) || 5,
                    })
                  }
                  className="w-20 px-3 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="1"
                  max="30"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  seconds
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Daily Time Limit
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Maximum time allowed on distracting sites per day
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={settings.dailyTimeLimit}
                  onChange={(e) =>
                    updateSettings({
                      dailyTimeLimit: parseInt(e.target.value) || 60,
                    })
                  }
                  className="w-20 px-3 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="15"
                  max="480"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  minutes
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Notifications
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Enable Notifications
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Show notifications when focus sessions end
                </p>
              </div>
              <ToggleSwitch
                checked={settings.enableNotifications}
                onChange={(checked) =>
                  updateSettings({ enableNotifications: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Enable Sounds
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Play gentle sounds during mindful pauses
                </p>
              </div>
              <ToggleSwitch
                checked={settings.enableSounds}
                onChange={(checked) =>
                  updateSettings({ enableSounds: checked })
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
