// Global variables
let settings = {
  enabled: true,
  summaryStyle: 'brief',
  triggerMode: 'auto',
  summaryLength: 3,
  themeMode: 'system'
};

let processedElements = new Set();
let apiUrl = 'http://localhost:3000/api';
let isRedditPage = false;
let isThreadPage = false;
let scrollTimeout = null;
let summaryRequests = {};
let summaryCounter = 0;

// Initialize extension
function init() {
  // Load settings
  chrome.storage.sync.get({
    enabled: true,
    summaryStyle: 'brief',
    triggerMode: 'auto',
    summaryLength: 3,
    themeMode: 'system'
  }, (loadedSettings) => {
    settings = loadedSettings;
    
    // Apply theme
    applyTheme(settings.themeMode);
    
    // Check if we're on a Reddit page
    isRedditPage = window.location.hostname.includes('reddit.com');
    
    // Check if we're on a thread page (has comments)
    isThreadPage = isRedditPage || 
                  document.querySelectorAll('.comment, .comments, .thread, .discussion').length > 5;
    
    // Set up scroll listener if enabled
    if (settings.enabled) {
      setupScrollListener();
    }
  });
}

// Apply theme to injected elements
function applyTheme(themeMode) {
  // Remove existing theme classes from body
  document.body.classList.remove('auto-tldr-light-theme', 'auto-tldr-dark-theme');
  
  if (themeMode === 'system') {
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add('auto-tldr-dark-theme');
    } else {
      document.body.classList.add('auto-tldr-light-theme');
    }
  } else {
    // Apply selected theme
    document.body.classList.add(`auto-tldr-${themeMode}-theme`);
  }
}

// Set up scroll listener
function setupScrollListener() {
  window.addEventListener('scroll', handleScroll);
  
  // Initial scan for visible content
  if (settings.triggerMode === 'auto') {
    setTimeout(scanVisibleContent, 1000);
  }
}

// Handle scroll event
function handleScroll() {
  if (!settings.enabled) return;
  
  // Debounce scroll events
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    if (settings.triggerMode === 'auto') {
      scanVisibleContent();
    }
  }, 300);
}

// Scan visible content for potential summarization
function scanVisibleContent() {
  // If on a thread page, check if we should summarize the thread
  if (isThreadPage && !document.querySelector('.auto-tldr-thread-summary')) {
    const threadContainer = findThreadContainer();
    if (threadContainer && isElementInViewport(threadContainer)) {
      if (settings.triggerMode === 'auto') {
        summarizeThread();
      } else {
        addManualSummaryTrigger(threadContainer, 'thread');
      }
    }
  }
  
  // Find large text blocks
  const textBlocks = findLargeTextBlocks();
  
  textBlocks.forEach(block => {
    // Skip already processed elements
    if (processedElements.has(block)) return;
    
    // Mark as processed
    processedElements.add(block);
    
    if (settings.triggerMode === 'auto') {
      // Auto summarize
      summarizeElement(block);
    } else {
      // Add manual trigger
      addManualSummaryTrigger(block, 'text');
    }
  });
}

// Find large text blocks suitable for summarization
function findLargeTextBlocks() {
  const minTextLength = 1000; // Minimum text length to consider for summarization
  const blocks = [];
  
  // Common selectors for article content
  const contentSelectors = [
    'article',
    '.article-content',
    '.post-content',
    '.entry-content',
    '.content',
    '.post-body',
    '.story-body',
    'main p'
  ];
  
  // Try to find content containers first
  let containers = [];
  contentSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      containers = [...containers, ...Array.from(elements)];
    }
  });
  
  // Process content containers
  containers.forEach(container => {
    const text = container.textContent.trim();
    if (text.length >= minTextLength && isElementInViewport(container)) {
      blocks.push(container);
    }
  });
  
  // If no containers found, look for large paragraphs
  if (blocks.length === 0) {
    const paragraphs = document.querySelectorAll('p');
    let currentBlock = null;
    let currentBlockText = '';
    
    paragraphs.forEach(p => {
      const text = p.textContent.trim();
      if (text.length > 100) {
        if (!currentBlock) {
          currentBlock = p;
          currentBlockText = text;
        } else {
          // Check if paragraphs are adjacent
          if (areElementsAdjacent(currentBlock, p)) {
            currentBlockText += ' ' + text;
          } else {
            // Check if current block is large enough
            if (currentBlockText.length >= minTextLength) {
              blocks.push(currentBlock);
            }
            // Start new block
            currentBlock = p;
            currentBlockText = text;
          }
        }
      }
    });
    
    // Check the last block
    if (currentBlock && currentBlockText.length >= minTextLength) {
      blocks.push(currentBlock);
    }
  }
  
  return blocks;
}

// Find thread container for thread summarization
function findThreadContainer() {
  // Reddit-specific selectors
  if (isRedditPage) {
    const redditSelectors = [
      '.Post',
      '[data-testid="post-container"]',
      '.sitetable.nestedlisting'
    ];
    
    for (const selector of redditSelectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }
  }
  
  // Generic thread selectors
  const threadSelectors = [
    '.thread',
    '.discussion',
    '.comments',
    '.comment-thread',
    'article'
  ];
  
  for (const selector of threadSelectors) {
    const element = document.querySelector(selector);
    if (element) return element;
  }
  
  return null;
}

// Check if an element is in the viewport
function isElementInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Check if two elements are adjacent
function areElementsAdjacent(el1, el2) {
  const rect1 = el1.getBoundingClientRect();
  const rect2 = el2.getBoundingClientRect();
  
  // Check if elements are in the same container and close to each other
  return Math.abs(rect2.top - rect1.bottom) < 50;
}

// Add manual summary trigger button
function addManualSummaryTrigger(element, type) {
  // Create trigger button
  const trigger = document.createElement('div');
  trigger.className = 'auto-tldr-trigger';
  trigger.innerHTML = `
    <span class="auto-tldr-icon">📝</span>
    <span class="auto-tldr-trigger-text">Summarize this ${type === 'thread' ? 'thread' : 'text'}</span>
  `;
  
  // Add click event
  trigger.addEventListener('click', () => {
    trigger.remove();
    if (type === 'thread') {
      summarizeThread();
    } else {
      summarizeElement(element);
    }
  });
  
  // Insert after element
  element.parentNode.insertBefore(trigger, element.nextSibling);
}

// Summarize a text element
function summarizeElement(element) {
  // Create summary container
  const summaryId = 'auto-tldr-summary-' + (++summaryCounter);
  const summaryContainer = document.createElement('div');
  summaryContainer.className = 'auto-tldr-container';
  summaryContainer.id = summaryId;
  summaryContainer.innerHTML = `
    <div class="auto-tldr-header">
      <div class="auto-tldr-logo">
        <span class="auto-tldr-icon">📝</span>
        <span class="auto-tldr-title">Auto TL;DR</span>
      </div>
      <div class="auto-tldr-actions">
        <button class="auto-tldr-regenerate" title="Regenerate summary">🔄</button>
        <button class="auto-tldr-close" title="Close summary">✕</button>
      </div>
    </div>
    <div class="auto-tldr-content">
      <div class="auto-tldr-loading">Generating summary...</div>
    </div>
  `;
  
  // Insert after element
  element.parentNode.insertBefore(summaryContainer, element.nextSibling);
  
  // Add event listeners
  summaryContainer.querySelector('.auto-tldr-close').addEventListener('click', () => {
    summaryContainer.remove();
  });
  
  summaryContainer.querySelector('.auto-tldr-regenerate').addEventListener('click', () => {
    regenerateSummary(summaryId, element);
  });
  
  // Get text content
  const text = element.textContent.trim();
  
  // Request summary
  requestSummary(summaryId, text);
}

// Summarize a thread
function summarizeThread() {
  // Create thread summary container
  const summaryId = 'auto-tldr-thread-summary';
  const summaryContainer = document.createElement('div');
  summaryContainer.className = 'auto-tldr-container auto-tldr-thread-summary';
  summaryContainer.id = summaryId;
  summaryContainer.innerHTML = `
    <div class="auto-tldr-header">
      <div class="auto-tldr-logo">
        <span class="auto-tldr-icon">📝</span>
        <span class="auto-tldr-title">Thread Summary</span>
      </div>
      <div class="auto-tldr-actions">
        <button class="auto-tldr-regenerate" title="Regenerate summary">🔄</button>
        <button class="auto-tldr-close" title="Close summary">✕</button>
      </div>
    </div>
    <div class="auto-tldr-content">
      <div class="auto-tldr-loading">Generating thread summary...</div>
    </div>
  `;
  
  // Find insertion point
  const threadContainer = findThreadContainer();
  if (!threadContainer) return;
  
  // Insert at the beginning of the thread
  threadContainer.insertBefore(summaryContainer, threadContainer.firstChild);
  
  // Add event listeners
  summaryContainer.querySelector('.auto-tldr-close').addEventListener('click', () => {
    summaryContainer.remove();
  });
  
  summaryContainer.querySelector('.auto-tldr-regenerate').addEventListener('click', () => {
    regenerateThreadSummary(summaryId);
  });
  
  // Extract thread data
  const threadData = extractThreadData();
  
  // Request thread summary
  requestThreadSummary(summaryId, threadData);
}

// Extract thread data (title, content, comments)
function extractThreadData() {
  let title = '';
  let content = '';
  let comments = [];
  
  // Reddit-specific extraction
  if (isRedditPage) {
    // Extract title
    const titleElement = document.querySelector('h1');
    if (titleElement) {
      title = titleElement.textContent.trim();
    }
    
    // Extract post content
    const postContent = document.querySelector('.Post__content, .ThreadViewer__content, .selftext');
    if (postContent) {
      content = postContent.textContent.trim();
    }
    
    // Extract comments
    const commentElements = document.querySelectorAll('.Comment__body, .ThreadComment__content');
    commentElements.forEach(comment => {
      comments.push(comment.textContent.trim());
    });
  } else {
    // Generic extraction
    // Extract title
    const titleElement = document.querySelector('h1, .title, .thread-title');
    if (titleElement) {
      title = titleElement.textContent.trim();
    }
    
    // Extract post content
    const postContent = document.querySelector('.post-content, .thread-content, .original-post');
    if (postContent) {
      content = postContent.textContent.trim();
    }
    
    // Extract comments
    const commentElements = document.querySelectorAll('.comment, .comment-content');
    commentElements.forEach(comment => {
      comments.push(comment.textContent.trim());
    });
  }
  
  return { title, content, comments };
}

// Request summary from API
function requestSummary(summaryId, text) {
  const summaryContainer = document.getElementById(summaryId);
  if (!summaryContainer) return;
  
  // Store request in progress
  summaryRequests[summaryId] = true;
  
  // Prepare request data
  const requestData = {
    text: text,
    format: settings.summaryStyle,
    length: settings.summaryLength
  };
  
  // Make API request
  fetch(`${apiUrl}/summarize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestData)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to generate summary');
    }
    return response.json();
  })
  .then(data => {
    // Update summary container
    updateSummaryContainer(summaryId, data.summary);
    
    // Save to history
    saveSummaryToHistory({
      title: document.title,
      summary: data.summary,
      url: window.location.href,
      timestamp: Date.now()
    });
  })
  .catch(error => {
    console.error('Error generating summary:', error);
    updateSummaryContainer(summaryId, 'Failed to generate summary. Please try again.');
  })
  .finally(() => {
    // Clear request in progress
    delete summaryRequests[summaryId];
  });
}

// Request thread summary from API
function requestThreadSummary(summaryId, threadData) {
  const summaryContainer = document.getElementById(summaryId);
  if (!summaryContainer) return;
  
  // Store request in progress
  summaryRequests[summaryId] = true;
  
  // Prepare request data
  const requestData = {
    thread: threadData,
    format: settings.summaryStyle,
    length: settings.summaryLength
  };
  
  // Make API request
  fetch(`${apiUrl}/summarize/thread`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestData)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to generate thread summary');
    }
    return response.json();
  })
  .then(data => {
    // Update summary container
    updateSummaryContainer(summaryId, data.summary);
    
    // Save to history
    saveSummaryToHistory({
      title: threadData.title || document.title,
      summary: data.summary,
      url: window.location.href,
      timestamp: Date.now()
    });
  })
  .catch(error => {
    console.error('Error generating thread summary:', error);
    updateSummaryContainer(summaryId, 'Failed to generate thread summary. Please try again.');
  })
  .finally(() => {
    // Clear request in progress
    delete summaryRequests[summaryId];
  });
}

// Update summary container with summary text
function updateSummaryContainer(summaryId, summaryText) {
  const summaryContainer = document.getElementById(summaryId);
  if (!summaryContainer) return;
  
  const contentElement = summaryContainer.querySelector('.auto-tldr-content');
  if (!contentElement) return;
  
  // Format summary based on style
  let formattedSummary = summaryText;
  
  // Update content
  contentElement.innerHTML = `<div class="auto-tldr-summary">${formattedSummary}</div>`;
}

// Regenerate summary for an element
function regenerateSummary(summaryId, element) {
  const summaryContainer = document.getElementById(summaryId);
  if (!summaryContainer) return;
  
  // Update content to show loading
  const contentElement = summaryContainer.querySelector('.auto-tldr-content');
  if (contentElement) {
    contentElement.innerHTML = '<div class="auto-tldr-loading">Regenerating summary...</div>';
  }
  
  // Get text content
  const text = element.textContent.trim();
  
  // Request summary again
  requestSummary(summaryId, text);
}

// Regenerate thread summary
function regenerateThreadSummary(summaryId) {
  const summaryContainer = document.getElementById(summaryId);
  if (!summaryContainer) return;
  
  // Update content to show loading
  const contentElement = summaryContainer.querySelector('.auto-tldr-content');
  if (contentElement) {
    contentElement.innerHTML = '<div class="auto-tldr-loading">Regenerating thread summary...</div>';
  }
  
  // Extract thread data
  const threadData = extractThreadData();
  
  // Request thread summary again
  requestThreadSummary(summaryId, threadData);
}

// Save summary to history
function saveSummaryToHistory(summaryData) {
  chrome.storage.sync.get({ history: [] }, (data) => {
    let history = data.history;
    
    // Add new summary to the beginning
    history.unshift(summaryData);
    
    // Keep only the 10 most recent summaries
    if (history.length > 10) {
      history = history.slice(0, 10);
    }
    
    // Save updated history
    chrome.storage.sync.set({ history: history });
  });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'settingsUpdated') {
    // Update settings
    settings = message.settings;
    
    // Apply theme
    applyTheme(settings.themeMode);
    
    // Enable/disable scroll listener
    if (settings.enabled) {
      setupScrollListener();
    } else {
      window.removeEventListener('scroll', handleScroll);
    }
  } else if (message.action === 'summarizePage') {
    // Summarize the entire page
    summarizePage();
  } else if (message.action === 'summarizeSelection') {
    // Summarize the selected text
    summarizeSelection();
  }
  
  // Return true to indicate async response
  return true;
});

// Summarize the entire page
function summarizePage() {
  // Get page content
  const title = document.title;
  const content = document.body.innerText;
  
  // Create summary container
  const summaryId = 'auto-tldr-page-summary';
  let summaryContainer = document.getElementById(summaryId);
  
  // Create new container if it doesn't exist
  if (!summaryContainer) {
    summaryContainer = document.createElement('div');
    summaryContainer.className = 'auto-tldr-container auto-tldr-page-summary';
    summaryContainer.id = summaryId;
    summaryContainer.innerHTML = `
      <div class="auto-tldr-header">
        <div class="auto-tldr-logo">
          <span class="auto-tldr-icon">📝</span>
          <span class="auto-tldr-title">Page Summary</span>
        </div>
        <div class="auto-tldr-actions">
          <button class="auto-tldr-regenerate" title="Regenerate summary">🔄</button>
          <button class="auto-tldr-close" title="Close summary">✕</button>
        </div>
      </div>
      <div class="auto-tldr-content">
        <div class="auto-tldr-loading">Generating page summary...</div>
      </div>
    `;
    
    // Insert at the top of the page
    document.body.insertBefore(summaryContainer, document.body.firstChild);
    
    // Add event listeners
    summaryContainer.querySelector('.auto-tldr-close').addEventListener('click', () => {
      summaryContainer.remove();
    });
    
    summaryContainer.querySelector('.auto-tldr-regenerate').addEventListener('click', () => {
      regeneratePageSummary();
    });
  } else {
    // Update existing container
    const contentElement = summaryContainer.querySelector('.auto-tldr-content');
    if (contentElement) {
      contentElement.innerHTML = '<div class="auto-tldr-loading">Generating page summary...</div>';
    }
  }
  
  // Request summary
  requestSummary(summaryId, content);
}

// Regenerate page summary
function regeneratePageSummary() {
  // Get page content
  const content = document.body.innerText;
  
  // Request summary again
  requestSummary('auto-tldr-page-summary', content);
}

// Summarize the selected text
function summarizeSelection() {
  // Get selected text
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  if (!selectedText) {
    alert('No text selected. Please select some text to summarize.');
    return;
  }
  
  // Create summary container
  const summaryId = 'auto-tldr-selection-summary';
  let summaryContainer = document.getElementById(summaryId);
  
  // Create new container if it doesn't exist
  if (!summaryContainer) {
    summaryContainer = document.createElement('div');
    summaryContainer.className = 'auto-tldr-container auto-tldr-selection-summary';
    summaryContainer.id = summaryId;
    summaryContainer.innerHTML = `
      <div class="auto-tldr-header">
        <div class="auto-tldr-logo">
          <span class="auto-tldr-icon">📝</span>
          <span class="auto-tldr-title">Selection Summary</span>
        </div>
        <div class="auto-tldr-actions">
          <button class="auto-tldr-regenerate" title="Regenerate summary">🔄</button>
          <button class="auto-tldr-close" title="Close summary">✕</button>
        </div>
      </div>
      <div class="auto-tldr-content">
        <div class="auto-tldr-loading">Generating summary...</div>
      </div>
    `;
    
    // Insert after selection
    const range = selection.getRangeAt(0);
    range.collapse(false);
    range.insertNode(summaryContainer);
    
    // Add event listeners
    summaryContainer.querySelector('.auto-tldr-close').addEventListener('click', () => {
      summaryContainer.remove();
    });
    
    summaryContainer.querySelector('.auto-tldr-regenerate').addEventListener('click', () => {
      regenerateSelectionSummary(selectedText);
    });
  } else {
    // Update existing container
    const contentElement = summaryContainer.querySelector('.auto-tldr-content');
    if (contentElement) {
      contentElement.innerHTML = '<div class="auto-tldr-loading">Generating summary...</div>';
    }
  }
  
  // Request summary
  requestSummary(summaryId, selectedText);
}

// Regenerate selection summary
function regenerateSelectionSummary(selectedText) {
  // Request summary again
  requestSummary('auto-tldr-selection-summary', selectedText);
}

// Initialize extension when DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
