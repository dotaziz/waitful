import React, { useEffect, useState } from "react";
import { Settings, SettingsProps } from "./types";


const Sites = (props: SettingsProps) => {
  const [newSite, setNewSite] = useState('');
  const {settings, updateSettings} = props

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

export default Sites;