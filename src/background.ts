const blockedSites: string[] = [];
let focusEndTime: number | null = null;

chrome.storage.sync.get(["distractingSites"], (result) => {
  blockedSites.push(...(result.distractingSites || []).map((site: { domain: string }) => site.domain));
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_FOCUS_MODE") {
    focusEndTime = Date.now() + message.duration * 1000;
    updateBadge();
    sendResponse({ success: true });
  } else if (message.type === "CANCEL_FOCUS_MODE") {
    focusEndTime = null;
    chrome.action.setBadgeText({ text: "" });
    sendResponse({ success: true });
  } else if (message.type === "GET_REMAINING_TIME") {
    const remainingTime = focusEndTime ? Math.max(0, Math.floor((focusEndTime - Date.now()) / 1000)) : 0;
    sendResponse({ remainingTime });
  }
});

// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   if (focusEndTime && Date.now() < focusEndTime) {
//     const url = new URL(tab.url || "");
//     if (blockedSites.some((site) => url.hostname.includes(site))) {
//       chrome.tabs.executeScript(tabId, {
//         file: "blockingOverlay.js",
//       });
//     }
//   }
// });

function updateBadge() {
  if (focusEndTime) {
    const interval = setInterval(() => {
      const remainingTime = Math.max(0, Math.floor((focusEndTime! - Date.now()) / 1000));
      let displayTime = "";
      if (remainingTime >= 3600) {
        const hours = Math.floor(remainingTime / 3600);
        displayTime = `${hours}h`;
      } else if (remainingTime >= 60) {
        const minutes = Math.floor(remainingTime / 60);
        displayTime = `${minutes}m`;
      } else {
        displayTime = `${remainingTime}s`;
      }
      chrome.action.setBadgeText({ text: remainingTime > 0 ? displayTime : "" });
      if (remainingTime <= 0) {
        clearInterval(interval);
        focusEndTime = null;
        chrome.action.setBadgeText({ text: "" });
      }
    }, 1000);
  }
}