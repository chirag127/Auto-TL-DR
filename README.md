# Auto TL;DR - Smart Summarizer Extension

Auto TL;DR is a browser extension that provides real-time, AI-generated summaries of articles, threads, Reddit posts, and other long-form content directly in the browser as you scroll. It saves you time, reduces cognitive load, and provides digestible insights across the web.

**Website:** Open `index.html` in your browser to view the landing page.
**Privacy Policy:** Open `privacy-policy.html` to view the privacy policy.

## Features

-   **Auto-Summarization on Scroll**: Detects large blocks of text and provides summaries as you scroll.
-   **Thread Summarizer**: Summarizes Reddit threads, comment chains, or discussion forums.
-   **Multiple Summary Formats**: Brief summary, bullet points, or key takeaways.
-   **Customizable Settings**: Control how and when summaries appear.
-   **Context Menu Integration**: Right-click to summarize any page or selection.
-   **Scroll Tags**: Visual indicators on the scroll bar for summarized regions.

## Installation

### Browser Extension

1. Clone this repository:

    ```
    git clone https://github.com/chirag127/Auto-TL-DR.git
    ```

2. Load the extension in Chrome:

    - Open Chrome and navigate to `chrome://extensions/`
    - Enable "Developer mode"
    - Click "Load unpacked" and select the `Nextension` directory

3. Load the extension in Firefox:
    - Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
    - Click "Load Temporary Add-on" and select any file in the `Nextension` directory

### Backend Server

1. Navigate to the backend directory:

    ```
    cd Auto-TL-DR/backend
    ```

2. Install dependencies:

    ```
    npm install
    ```

3. Create a `.env` file based on `.env.example` and add your Gemini API key:

    ```
    GEMINI_API_KEY=your_api_key_here
    PORT=3000
    ```

4. Start the server:
    ```
    npm start
    ```

## Usage

1. Click the Auto TL;DR icon in your browser toolbar to access settings.
2. Browse the web as usual. When the extension detects large blocks of text, it will offer to summarize them.
3. Click on the summary indicator to view the summary.
4. Right-click on any page or selection to summarize it manually.

## Testing

### Backend Testing

1. Navigate to the backend directory:

    ```
    cd Auto-TL-DR/backend
    ```

2. Create a `.env` file with your Gemini API key:

    ```
    GEMINI_API_KEY=your_api_key_here
    ```

3. Run the test script:
    ```
    node test.js
    ```

### Extension Testing

1. Load the extension in your browser as described in the Installation section.

2. Open the included test page:

    ```
    open test.html
    ```

    or simply open the file in your browser.

3. The test page contains sample articles and a thread to test the extension's functionality.

## Development

### Backend

The backend is built with Express.js and uses Google's Gemini AI for text summarization.

### Frontend

The browser extension is built with Manifest V3 and is compatible with Chrome, Firefox, Edge, Opera, and Brave.

### Icons

The extension includes an SVG icon and a tool to convert it to PNG files:

1. Open the icon conversion tool in your browser:

    ```
    open Nextension/icons/convert-icons.html
    ```

    or simply open the file in your browser.

2. Click the "Generate Icons" button to create the PNG versions.

3. Download each icon using the download buttons:

    - icon16.png (16x16 pixels)
    - icon48.png (48x48 pixels)
    - icon128.png (128x128 pixels)

4. The downloaded icons will be saved in the `Nextension/icons/` directory.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
