document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const enableExtensionToggle = document.getElementById('enableExtension');
  const statusText = document.getElementById('statusText');
  const summaryStyleSelect = document.getElementById('summaryStyle');
  const triggerModeSelect = document.getElementById('triggerMode');
  const summaryLengthSlider = document.getElementById('summaryLength');
  const summaryLengthValue = document.getElementById('summaryLengthValue');
  const themeModeSelect = document.getElementById('themeMode');
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');

  // Load settings from storage
  loadSettings();

  // Event listeners
  enableExtensionToggle.addEventListener('change', updateEnableStatus);
  summaryStyleSelect.addEventListener('change', saveSettings);
  triggerModeSelect.addEventListener('change', saveSettings);
  summaryLengthSlider.addEventListener('input', updateSummaryLengthValue);
  summaryLengthSlider.addEventListener('change', saveSettings);
  themeModeSelect.addEventListener('change', updateTheme);
  clearHistoryBtn.addEventListener('click', clearHistory);

  // Functions
  function loadSettings() {
    chrome.storage.sync.get({
      enabled: true,
      summaryStyle: 'brief',
      triggerMode: 'auto',
      summaryLength: 3,
      themeMode: 'system',
      history: []
    }, (settings) => {
      // Update UI with settings
      enableExtensionToggle.checked = settings.enabled;
      statusText.textContent = settings.enabled ? 'Enabled' : 'Disabled';
      summaryStyleSelect.value = settings.summaryStyle;
      triggerModeSelect.value = settings.triggerMode;
      summaryLengthSlider.value = settings.summaryLength;
      summaryLengthValue.textContent = settings.summaryLength;
      themeModeSelect.value = settings.themeMode;
      
      // Apply theme
      applyTheme(settings.themeMode);
      
      // Load history
      displayHistory(settings.history);
    });
  }

  function saveSettings() {
    const settings = {
      enabled: enableExtensionToggle.checked,
      summaryStyle: summaryStyleSelect.value,
      triggerMode: triggerModeSelect.value,
      summaryLength: parseInt(summaryLengthSlider.value),
      themeMode: themeModeSelect.value
    };

    chrome.storage.sync.set(settings, () => {
      // Notify content script of settings change
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { 
            action: 'settingsUpdated',
            settings: settings
          });
        }
      });
    });
  }

  function updateEnableStatus() {
    statusText.textContent = enableExtensionToggle.checked ? 'Enabled' : 'Disabled';
    saveSettings();
  }

  function updateSummaryLengthValue() {
    summaryLengthValue.textContent = summaryLengthSlider.value;
  }

  function updateTheme() {
    applyTheme(themeModeSelect.value);
    saveSettings();
  }

  function applyTheme(themeMode) {
    // Remove existing theme classes
    document.body.classList.remove('light-theme', 'dark-theme');
    
    if (themeMode === 'system') {
      // Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.add('light-theme');
      }
    } else {
      // Apply selected theme
      document.body.classList.add(`${themeMode}-theme`);
    }
  }

  function displayHistory(history) {
    if (!history || history.length === 0) {
      historyList.innerHTML = '<div class="empty-history">No recent summaries</div>';
      return;
    }

    historyList.innerHTML = '';
    
    // Display the 5 most recent summaries
    const recentHistory = history.slice(0, 5);
    
    recentHistory.forEach((item, index) => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      
      const title = document.createElement('div');
      title.className = 'history-title';
      title.textContent = truncateText(item.title || 'Untitled', 40);
      
      const summary = document.createElement('div');
      summary.className = 'history-summary';
      summary.textContent = truncateText(item.summary, 100);
      
      const date = document.createElement('div');
      date.className = 'history-date';
      date.textContent = new Date(item.timestamp).toLocaleString();
      
      historyItem.appendChild(title);
      historyItem.appendChild(summary);
      historyItem.appendChild(date);
      
      historyList.appendChild(historyItem);
    });
  }

  function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  function clearHistory() {
    chrome.storage.sync.get({ history: [] }, (data) => {
      chrome.storage.sync.set({ history: [] }, () => {
        displayHistory([]);
      });
    });
  }
});
