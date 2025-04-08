// Initialize extension
function init() {
  // Create context menu items
  chrome.contextMenus.create({
    id: 'summarizePage',
    title: 'Summarize this page',
    contexts: ['page']
  });
  
  chrome.contextMenus.create({
    id: 'summarizeSelection',
    title: 'Summarize this selection',
    contexts: ['selection']
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'summarizePage') {
    // Send message to content script to summarize page
    chrome.tabs.sendMessage(tab.id, { action: 'summarizePage' });
  } else if (info.menuItemId === 'summarizeSelection') {
    // Send message to content script to summarize selection
    chrome.tabs.sendMessage(tab.id, { action: 'summarizeSelection' });
  }
});

// Handle extension installation or update
chrome.runtime.onInstalled.addListener((details) => {
  // Initialize extension
  init();
  
  // Set default settings on install
  if (details.reason === 'install') {
    chrome.storage.sync.set({
      enabled: true,
      summaryStyle: 'brief',
      triggerMode: 'auto',
      summaryLength: 3,
      themeMode: 'system',
      history: []
    });
  }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle messages if needed
  return true;
});
