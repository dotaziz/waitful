import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import { DistractingSite } from "./types";


const Popup = () => {
  const [focusTime, setFocusTime] = useState(25);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [currentURL, setCurrentURL] = useState<string>();
  const [timeSpentToday, setTimeSpentToday] = useState("< 1m");
  const [timePercentage, setTimePercentage] = useState(5);
  const [distractingSites, setDistractingSites] = useState<DistractingSite[]>(
    []
  );
  const [isCurrentSiteDistracting, setIsCurrentSiteDistracting] =
    useState(false);
  const [focusCountdown, setFocusCountdown] = useState<number | null>(null);

  useEffect(() => {
    // chrome.action.setBadgeText({ text: '10' });
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0]?.url) {
        setCurrentURL(tabs[0].url);
        const domain = new URL(tabs[0].url).hostname;

        chrome.storage.sync.get(["distractingSites"], (result) => {
          const savedSites = result.distractingSites || [];
          setDistractingSites(savedSites);

          // Check if current site is in distracting list
          const isDist = savedSites.some(
            (site: DistractingSite) =>
              domain?.includes(site?.domain) ||
              site?.domain?.includes(domain?.replace("www.", ""))
          );
          setIsCurrentSiteDistracting(isDist);
        });
      }
    });

    chrome.storage.local.get(["isFocusMode", "timeSpentToday"], (result) => {
      setIsFocusMode(result.isFocusMode || false);
      setTimeSpentToday(result.timeSpentToday || "< 1m");

      // Calculate percentage (assuming 60 minutes max)
      const timeMinutes = parseInt(result.timeSpentToday) || 0;
      setTimePercentage(Math.min((timeMinutes / 60) * 100, 100));
    });
  }, []);

  useEffect(() => {
    if (isFocusMode) {
      const interval = setInterval(() => {
        chrome.runtime.sendMessage({ type: 'GET_REMAINING_TIME' }, (response) => {
          const remainingTime = response.remainingTime || 0;

          if (remainingTime <= 0) {
            clearInterval(interval);
            setFocusCountdown(null);
            setIsFocusMode(false);
            chrome.action.setBadgeText({ text: '' });
          } else {
            setFocusCountdown(remainingTime);
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            chrome.action.setBadgeText({ text: `${minutes}:${seconds < 10 ? '0' : ''}${seconds}` });
          }
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  }, [isFocusMode]);

  const startFocusMode = () => {
    setIsFocusMode(true);
    chrome.runtime.sendMessage({ type: 'START_FOCUS_MODE', duration: focusTime * 60 });
  };

  const cancelFocusMode = () => {
    setIsFocusMode(false);
    setFocusCountdown(null);
    chrome.runtime.sendMessage({ type: 'CANCEL_FOCUS_MODE' });
  };

  useEffect(() => {
    if (focusCountdown === 0) {
      alert('Focus mode is complete!');
      cancelFocusMode();
    }
  }, [focusCountdown]);

  const toggleDistractingSite = () => {
    if (!currentURL) return;

    const domain = new URL(currentURL).hostname.replace("www.", "");

    if (isCurrentSiteDistracting) {
      // Remove from distracting sites
      const updatedSites = distractingSites.filter(
        (site) => !domain.includes(site.domain) && !site.domain.includes(domain)
      );
      setDistractingSites(updatedSites);
      setIsCurrentSiteDistracting(false);
      chrome.storage.sync.set({ distractingSites: updatedSites });
    } else {
      // Add to distracting sites
      const newSite: DistractingSite = {
        domain,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
      };
      const updatedSites = [...distractingSites, newSite];
      setDistractingSites(updatedSites);
      setIsCurrentSiteDistracting(true);
      chrome.storage.sync.set({ distractingSites: updatedSites });
    }
  };

  const getCurrentDomain = () => {
    if (!currentURL) return "";
    return new URL(currentURL).hostname.replace("www.", "");
  };

  const openSettings = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL("options.html"),
    });
    window.close();
  };

  const quickFocusTimes = [15, 25, 45, 60];

  const renderFocusCountdown = () => {
    if (!focusCountdown) return null;

    const minutes = Math.floor(focusCountdown / 60);
    const seconds = focusCountdown % 60;

    return (
      <div className="text-center text-sm text-slate-600 dark:text-slate-400">
        Time remaining: {minutes}m {seconds}s
      </div>
    );
  };

  const renderCancelButton = () => {
    if (!isFocusMode) return null;

    return (
      <button
        onClick={cancelFocusMode}
        className="w-full py-2 px-4 rounded-lg font-medium text-sm bg-red-500 text-white hover:bg-red-600 transition-all"
      >
        Cancel Focus Mode
      </button>
    );
  };

  return (
    <div className="w-80 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-bold text-slate-800 dark:text-white">
                Waitful
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mindful Browsing
              </p>
            </div>
          </div>

          <button
            onClick={openSettings}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
            title="Settings"
          >
            <svg
              className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Focus Mode Section */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Focus Session
            </h2>
            {isFocusMode && (
              <div className="ml-auto flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  Active
                </span>
              </div>
            )}
          </div>

          {/* Quick Time Selection */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {quickFocusTimes.map((time) => (
              <button
                key={time}
                onClick={() => setFocusTime(time)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  focusTime === time
                    ? "bg-blue-500 text-white shadow-md shadow-blue-500/25"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                {time}m
              </button>
            ))}
          </div>

          {/* Custom Time Input */}
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm text-slate-600 dark:text-slate-400">
              Custom:
            </label>
            <input
              type="number"
              value={focusTime}
              onChange={(e) => setFocusTime(parseInt(e.target.value) || 25)}
              className="w-20 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-center text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              min="1"
              max="120"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              minutes
            </span>
          </div>

          <button
            onClick={startFocusMode}
            disabled={isFocusMode}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
              isFocusMode
                ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transform hover:-translate-y-0.5"
            }`}
          >
            {isFocusMode ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                Focus Mode Active
              </div>
            ) : (
              "Start Focus Session"
            )}
          </button>

          {renderFocusCountdown()}
          {renderCancelButton()}
        </div>

        {/* Daily Usage */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <svg
              className="w-4 h-4 text-amber-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Today's Usage
            </h3>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Distracting sites
              </span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {timeSpentToday}
              </span>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-500 ease-out"
                style={{ width: `${Math.min(timePercentage, 100)}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>0m</span>
              <span
                className={
                  timePercentage > 80 ? "text-red-500 font-medium" : ""
                }
              >
                {timePercentage > 80 ? "⚠️ " : ""}60m goal
              </span>
            </div>
          </div>
        </div>

        {/* Current Site */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={`https://www.google.com/s2/favicons?domain=${getCurrentDomain()}&sz=32`}
              alt="Site favicon"
              className="w-6 h-6 rounded-md shadow-sm"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iIzk0YTNiOCIvPgo8L3N2Zz4K";
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                {getCurrentDomain()}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isCurrentSiteDistracting
                  ? "Marked as distracting"
                  : "Current website"}
              </p>
            </div>
          </div>

          <button
            onClick={toggleDistractingSite}
            className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
              isCurrentSiteDistracting
                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800"
                : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800"
            }`}
          >
            {isCurrentSiteDistracting ? (
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Remove from distracting sites
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Mark as distracting
              </div>
            )}
          </button>
        </div>

        {/* Quick Stats */}
        {distractingSites.length > 0 && (
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Blocked Sites
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Currently tracking {distractingSites.length} sites
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {distractingSites.length}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  sites
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
