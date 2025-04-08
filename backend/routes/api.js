const express = require('express');
const router = express.Router();
const { generateSummary, generateThreadSummary } = require('../gemini/summarize');

/**
 * @route POST /api/summarize
 * @desc Summarize text content
 * @access Public
 */
router.post('/summarize', async (req, res) => {
  try {
    const { text, format, length } = req.body;

    // Validate request
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Validate format
    const validFormats = ['brief', 'bullets', 'takeaways'];
    const summaryFormat = validFormats.includes(format) ? format : 'brief';

    // Validate length (1-5)
    const summaryLength = Math.min(Math.max(parseInt(length) || 3, 1), 5);

    // Generate summary
    const summary = await generateSummary(text, summaryFormat, summaryLength);

    // Return summary
    res.json({ summary });
  } catch (error) {
    console.error('Error in /api/summarize:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

/**
 * @route POST /api/summarize/thread
 * @desc Summarize a thread (e.g., Reddit, forum)
 * @access Public
 */
router.post('/summarize/thread', async (req, res) => {
  try {
    const { thread, format, length } = req.body;

    // Validate request
    if (!thread || !thread.title) {
      return res.status(400).json({ error: 'Thread data is required' });
    }

    // Validate format
    const validFormats = ['brief', 'bullets', 'takeaways'];
    const summaryFormat = validFormats.includes(format) ? format : 'brief';

    // Validate length (1-5)
    const summaryLength = Math.min(Math.max(parseInt(length) || 3, 1), 5);

    // Generate thread summary
    const summary = await generateThreadSummary(thread, summaryFormat, summaryLength);

    // Return summary
    res.json({ summary });
  } catch (error) {
    console.error('Error in /api/summarize/thread:', error);
    res.status(500).json({ error: 'Failed to generate thread summary' });
  }
});

/**
 * @route GET /api/health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Auto TL;DR API is running' });
});

module.exports = router;
