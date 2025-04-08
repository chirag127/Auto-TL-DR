const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Gemini API client
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Get the Gemini model
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-lite",
});

// Default generation config
const defaultGenerationConfig = {
  temperature: 0.4,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 1024,
  responseMimeType: "text/plain",
};

/**
 * Generate a summary of the provided text
 * @param {string} text - The text to summarize
 * @param {string} format - The format of the summary (brief, bullets, takeaways)
 * @param {number} length - The desired length of the summary (1-5)
 * @returns {Promise<string>} - The generated summary
 */
async function generateSummary(text, format = "brief", length = 3) {
  try {
    // Validate input
    if (!text || text.trim().length === 0) {
      throw new Error("No text provided for summarization");
    }

    // Adjust max tokens based on length parameter (1-5)
    const maxTokens = 256 * length;
    
    // Create generation config with adjusted max tokens
    const generationConfig = {
      ...defaultGenerationConfig,
      maxOutputTokens: Math.min(maxTokens, 1024), // Cap at 1024 tokens
    };

    // Create prompt based on format
    let prompt;
    switch (format) {
      case "bullets":
        prompt = `Summarize the following text in ${length * 2} bullet points:\n\n${text}`;
        break;
      case "takeaways":
        prompt = `Extract ${length * 2} key takeaways from the following text:\n\n${text}`;
        break;
      case "brief":
      default:
        prompt = `Provide a brief summary (${length} paragraphs) of the following text:\n\n${text}`;
        break;
    }

    // Generate summary
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    });

    // Extract and return the summary text
    return result.response.text();
  } catch (error) {
    console.error("Error generating summary:", error);
    throw error;
  }
}

/**
 * Generate a summary of a thread (e.g., Reddit, forum)
 * @param {Object} thread - The thread object with title, content, and comments
 * @param {string} format - The format of the summary (brief, bullets, takeaways)
 * @param {number} length - The desired length of the summary (1-5)
 * @returns {Promise<string>} - The generated summary
 */
async function generateThreadSummary(thread, format = "brief", length = 3) {
  try {
    // Validate input
    if (!thread || !thread.title) {
      throw new Error("Invalid thread data provided");
    }

    // Prepare thread text
    const threadText = `
Title: ${thread.title}
Content: ${thread.content || ""}
Comments: ${thread.comments ? thread.comments.join("\n") : ""}
    `;

    // Adjust max tokens based on length parameter (1-5)
    const maxTokens = 256 * length;
    
    // Create generation config with adjusted max tokens
    const generationConfig = {
      ...defaultGenerationConfig,
      maxOutputTokens: Math.min(maxTokens, 1024), // Cap at 1024 tokens
    };

    // Create prompt based on format
    let prompt;
    switch (format) {
      case "bullets":
        prompt = `Summarize the following thread in ${length * 2} bullet points, capturing both the main post and key points from comments:\n\n${threadText}`;
        break;
      case "takeaways":
        prompt = `Extract ${length * 2} key takeaways from the following thread, including insights from both the main post and comments:\n\n${threadText}`;
        break;
      case "brief":
      default:
        prompt = `Provide a brief summary (${length} paragraphs) of the following thread, including both the main post and key points from comments:\n\n${threadText}`;
        break;
    }

    // Generate summary
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    });

    // Extract and return the summary text
    return result.response.text();
  } catch (error) {
    console.error("Error generating thread summary:", error);
    throw error;
  }
}

module.exports = {
  generateSummary,
  generateThreadSummary,
};
