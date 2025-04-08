document.addEventListener("DOMContentLoaded", () => {
    // DOM elements
    const enableExtensionToggle = document.getElementById("enableExtension");
    const statusText = document.getElementById("statusText");
    const summaryStyleSelect = document.getElementById("summaryStyle");
    const triggerModeSelect = document.getElementById("triggerMode");
    const summaryLengthSlider = document.getElementById("summaryLength");
    const summaryLengthValue = document.getElementById("summaryLengthValue");
    const themeModeSelect = document.getElementById("themeMode");
    const historyList = document.getElementById("historyList");
    const clearHistoryBtn = document.getElementById("clearHistoryBtn");

    // TTS DOM elements
    const enableTTSToggle = document.getElementById("enableTTS");
    const ttsRateSlider = document.getElementById("ttsRate");
    const ttsRateValue = document.getElementById("ttsRateValue");
    const ttsPitchSlider = document.getElementById("ttsPitch");
    const ttsPitchValue = document.getElementById("ttsPitchValue");
    const ttsVoiceSelect = document.getElementById("ttsVoice");

    // Load settings from storage
    loadSettings();

    // Event listeners
    enableExtensionToggle.addEventListener("change", updateEnableStatus);
    summaryStyleSelect.addEventListener("change", saveSettings);
    triggerModeSelect.addEventListener("change", saveSettings);
    summaryLengthSlider.addEventListener("input", updateSummaryLengthValue);
    summaryLengthSlider.addEventListener("change", saveSettings);
    themeModeSelect.addEventListener("change", updateTheme);
    clearHistoryBtn.addEventListener("click", clearHistory);

    // TTS event listeners
    enableTTSToggle.addEventListener("change", saveSettings);
    ttsRateSlider.addEventListener("input", updateTTSRateValue);
    ttsRateSlider.addEventListener("change", saveSettings);
    ttsPitchSlider.addEventListener("input", updateTTSPitchValue);
    ttsPitchSlider.addEventListener("change", saveSettings);
    ttsVoiceSelect.addEventListener("change", saveSettings);

    // Populate voice options
    populateVoiceOptions();

    // Functions
    function loadSettings() {
        chrome.storage.sync.get(
            {
                enabled: true,
                summaryStyle: "brief",
                triggerMode: "auto",
                summaryLength: 3,
                themeMode: "system",
                history: [],
                // TTS settings
                ttsEnabled: true,
                ttsRate: 1,
                ttsPitch: 1,
                ttsVoice: "",
            },
            (settings) => {
                // Update UI with settings
                enableExtensionToggle.checked = settings.enabled;
                statusText.textContent = settings.enabled
                    ? "Enabled"
                    : "Disabled";
                summaryStyleSelect.value = settings.summaryStyle;
                triggerModeSelect.value = settings.triggerMode;
                summaryLengthSlider.value = settings.summaryLength;
                summaryLengthValue.textContent = settings.summaryLength;
                themeModeSelect.value = settings.themeMode;

                // Update TTS UI with settings
                enableTTSToggle.checked = settings.ttsEnabled;
                ttsRateSlider.value = settings.ttsRate;
                ttsRateValue.textContent = settings.ttsRate;
                ttsPitchSlider.value = settings.ttsPitch;
                ttsPitchValue.textContent = settings.ttsPitch;
                if (settings.ttsVoice) {
                    ttsVoiceSelect.value = settings.ttsVoice;
                }

                // Apply theme
                applyTheme(settings.themeMode);

                // Load history
                displayHistory(settings.history);
            }
        );
    }

    function saveSettings() {
        const settings = {
            enabled: enableExtensionToggle.checked,
            summaryStyle: summaryStyleSelect.value,
            triggerMode: triggerModeSelect.value,
            summaryLength: parseInt(summaryLengthSlider.value),
            themeMode: themeModeSelect.value,
            // TTS settings
            ttsEnabled: enableTTSToggle.checked,
            ttsRate: parseFloat(ttsRateSlider.value),
            ttsPitch: parseFloat(ttsPitchSlider.value),
            ttsVoice: ttsVoiceSelect.value,
        };

        chrome.storage.sync.set(settings, () => {
            // Notify content script of settings change
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: "settingsUpdated",
                        settings: settings,
                    });
                }
            });
        });
    }

    function updateEnableStatus() {
        statusText.textContent = enableExtensionToggle.checked
            ? "Enabled"
            : "Disabled";
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
        document.body.classList.remove("light-theme", "dark-theme");

        if (themeMode === "system") {
            // Check system preference
            if (
                window.matchMedia &&
                window.matchMedia("(prefers-color-scheme: dark)").matches
            ) {
                document.body.classList.add("dark-theme");
            } else {
                document.body.classList.add("light-theme");
            }
        } else {
            // Apply selected theme
            document.body.classList.add(`${themeMode}-theme`);
        }
    }

    function displayHistory(history) {
        if (!history || history.length === 0) {
            historyList.innerHTML =
                '<div class="empty-history">No recent summaries</div>';
            return;
        }

        historyList.innerHTML = "";

        // Display the 5 most recent summaries
        const recentHistory = history.slice(0, 5);

        recentHistory.forEach((item, index) => {
            const historyItem = document.createElement("div");
            historyItem.className = "history-item";

            const title = document.createElement("div");
            title.className = "history-title";
            title.textContent = truncateText(item.title || "Untitled", 40);

            const summary = document.createElement("div");
            summary.className = "history-summary";
            summary.textContent = truncateText(item.summary, 100);

            const date = document.createElement("div");
            date.className = "history-date";
            date.textContent = new Date(item.timestamp).toLocaleString();

            historyItem.appendChild(title);
            historyItem.appendChild(summary);
            historyItem.appendChild(date);

            historyList.appendChild(historyItem);
        });
    }

    function truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    }

    function clearHistory() {
        chrome.storage.sync.get({ history: [] }, (data) => {
            chrome.storage.sync.set({ history: [] }, () => {
                displayHistory([]);
            });
        });
    }

    // TTS functions
    function updateTTSRateValue() {
        ttsRateValue.textContent = ttsRateSlider.value;
    }

    function updateTTSPitchValue() {
        ttsPitchValue.textContent = ttsPitchSlider.value;
    }

    function populateVoiceOptions() {
        // Clear existing options except default
        while (ttsVoiceSelect.options.length > 1) {
            ttsVoiceSelect.remove(1);
        }

        // Check if speechSynthesis is available
        if (window.speechSynthesis) {
            // Get available voices
            let voices = window.speechSynthesis.getVoices();

            // If voices array is empty, wait for the voiceschanged event
            if (voices.length === 0) {
                window.speechSynthesis.addEventListener("voiceschanged", () => {
                    voices = window.speechSynthesis.getVoices();
                    addVoicesToSelect(voices);
                });
            } else {
                addVoicesToSelect(voices);
            }
        }
    }

    function addVoicesToSelect(voices) {
        // Add each voice as an option
        voices.forEach((voice) => {
            const option = document.createElement("option");
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})`;
            ttsVoiceSelect.appendChild(option);
        });

        // Set the selected voice if it exists in storage
        chrome.storage.sync.get({ ttsVoice: "" }, (data) => {
            if (
                data.ttsVoice &&
                ttsVoiceSelect.querySelector(`option[value="${data.ttsVoice}"]`)
            ) {
                ttsVoiceSelect.value = data.ttsVoice;
            }
        });
    }
});
