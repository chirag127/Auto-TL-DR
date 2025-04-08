
# 🧾 Product Requirements Document (PRD)

## 📌 Product Title
**Auto TL;DR** – Smart Summarizer Extension

---

## 📍 Purpose
Provide users with **real-time, AI-generated summaries** of articles, threads, Reddit posts, and other long-form content directly in the browser — as they scroll. The goal is to save users time, reduce cognitive load, and provide digestible insights across the web.

---

## 🎯 Target Audience
- Busy professionals
- Students and researchers
- News readers
- Reddit / X / Medium users
- Anyone who reads long-form web content

---

## 🧠 Core Features

### 1. 🔍 Auto-Summarization on Scroll
- Detects large blocks of text (e.g., articles, blog posts, Reddit posts).
- Sends content chunks to the backend for summary generation using Gemini 2.0 Flash Lite.
- Renders inline summaries (e.g., “Summary available – click to expand”).

### 2. 🧵 Thread Summarizer
- Detects Reddit threads, comment chains, or discussion forums.
- Extracts top-level text and key comments.
- Summarizes into TL;DR format (brief, bullet, or key takeaways).

### 3. 🧰 Summary Format Options
- Modes:
  - 🧠 **Brief Summary** (2-3 lines)
  - 📌 **Bullet Points**
  - 🪞 **Key Takeaways**
- User can set default mode in settings.

### 4. ⚙️ User Settings (Popup UI)
- Enable/Disable Auto TL;DR
- Default summary style
- Trigger mode: auto vs manual
- Customize summary length
- Light/Dark mode

### 5. 🧪 Right-Click Context Menu
- Option to “Summarize this Page” or “Summarize this Selection”

### 6. 🧭 Scroll Tags (Experimental)
- Adds a tiny summary pill on scroll bar to indicate summarized regions

---

## 🛠️ Technical Architecture

### 🔗 Project Structure
```
project-root/
├── Nextension/         # Browser extension (Manifest V3)
│   ├── popup.html
│   ├── popup.js
│   ├── content.js
│   ├── background.js
│   ├── styles.css
│   └── manifest.json
├── backend/            # Express.js backend
│   ├── server.js
│   ├── routes/
│   └── gemini/
│       └── summarize.js
└── README.md
```

### 🧩 Browser Support
- Chrome (Manifest V3)
- Firefox (MV3 support via `browser.*`)
- Edge
- Opera and Brave (inherits from Chromium)

---

## 🤖 AI Integration

### Gemini 2.0 Flash Lite (via API)
- Input: Raw text or extracted DOM sections
- Output: Summary (adjusted by user-selected format)
- Smart chunking for long articles (e.g., >4000 tokens)

---

## 🖼️ UI Overview

### 🔸 Popup Interface
- Toggle Extension ON/OFF
- Choose Summary Style
- See Past 5 Summaries (optional storage)
- Settings & Support

### 🔸 Inline Summaries
- Summary box injected below/next to paragraph
- “Expand” and “Regenerate” buttons

### 🔸 Right-Click Menu
- “Summarize this Page”
- “Summarize this Text Selection”

---

## 🧪 Edge Cases & Considerations
- Long dynamic content (Reddit infinite scroll, Medium, Substack)
- Pages with ads, popups (use content sanitization)
- Non-English content (detect and auto-skip or warn)
- Rate-limiting backend requests to avoid API overuse

---

## ✅ MVP Checklist

| Feature                          | Status |
|----------------------------------|--------|
| Manifest V3 setup                | ☐      |
| DOM text extractor               | ☐      |
| Gemini API integration           | ☐      |
| Summary UI injector              | ☐      |
| Popup UI with settings           | ☐      |
| Context menu summarizer          | ☐      |
| Backend API w/ Express.js        | ☐      |
| Gemini summarizer module         | ☐      |
| Cross-browser support (Chrome/Firefox) | ☐ |

---

## 🧩 Future Enhancements
- Save summary history to user account
- Support PDF or offline pages
- Auto-summary email reader (Gmail, Outlook web)
- Multi-language summaries
- Visual diff of source vs summary

---
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const fs = require("node:fs");
const mime = require("mime-types");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-lite",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseModalities: [
  ],
  responseMimeType: "text/plain",
};

async function run() {
  const chatSession = model.startChat({
    generationConfig,
    history: [
    ],
  });

  const result = await chatSession.sendMessage("INSERT_INPUT_HERE");
  // TODO: Following code needs to be updated for client-side apps.
  const candidates = result.response.candidates;
  for(let candidate_index = 0; candidate_index < candidates.length; candidate_index++) {
    for(let part_index = 0; part_index < candidates[candidate_index].content.parts.length; part_index++) {
      const part = candidates[candidate_index].content.parts[part_index];
      if(part.inlineData) {
        try {
          const filename = `output_${candidate_index}_${part_index}.${mime.extension(part.inlineData.mimeType)}`;
          fs.writeFileSync(filename, Buffer.from(part.inlineData.data, 'base64'));
          console.log(`Output written to: ${filename}`);
        } catch (err) {
          console.error(err);
        }
      }
    }
  }
  console.log(result.response.text());
}

run();