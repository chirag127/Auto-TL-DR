require('dotenv').config();
const { generateSummary, generateThreadSummary } = require('./gemini/summarize');

// Test text for summarization
const testText = `
Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to intelligence displayed by animals including humans. 
AI research has been defined as the field of study of intelligent agents, which refers to any system that perceives its environment and takes actions that maximize its chance of achieving its goals.

The term "artificial intelligence" had previously been used to describe machines that mimic and display "human" cognitive skills that are associated with the human mind, such as "learning" and "problem-solving". This definition has since been rejected by major AI researchers who now describe AI in terms of rationality and acting rationally, which does not limit how intelligence can be articulated.

AI applications include advanced web search engines (e.g., Google), recommendation systems (used by YouTube, Amazon, and Netflix), understanding human speech (such as Siri and Alexa), self-driving cars (e.g., Waymo), generative or creative tools (ChatGPT and AI art), automated decision-making, and competing at the highest level in strategic game systems (such as chess and Go).

As machines become increasingly capable, tasks considered to require "intelligence" are often removed from the definition of AI, a phenomenon known as the AI effect. For instance, optical character recognition is frequently excluded from things considered to be AI, having become a routine technology.
`;

// Test thread data for thread summarization
const testThread = {
  title: 'What are your thoughts on AI development?',
  content: 'I\'m curious about what people think about the current state of AI development. Are we moving too fast? Are there enough safeguards in place?',
  comments: [
    'I think we\'re moving way too fast without proper regulations in place. Look at what happened with social media - we didn\'t anticipate the negative effects.',
    'AI is just a tool like any other technology. It\'s how we use it that matters.',
    'The benefits far outweigh the risks. AI can help solve some of our biggest problems like climate change and disease.',
    'I\'m concerned about job displacement. We need better plans for retraining workers.',
    'The real issue is who controls the AI. If it\'s just a few big tech companies, that\'s a problem.'
  ]
};

// Test summary generation
async function testSummaryGeneration() {
  console.log('Testing summary generation...');
  
  try {
    // Test brief summary
    console.log('\nGenerating brief summary:');
    const briefSummary = await generateSummary(testText, 'brief', 2);
    console.log(briefSummary);
    
    // Test bullet points
    console.log('\nGenerating bullet points:');
    const bulletSummary = await generateSummary(testText, 'bullets', 2);
    console.log(bulletSummary);
    
    // Test key takeaways
    console.log('\nGenerating key takeaways:');
    const takeawaysSummary = await generateSummary(testText, 'takeaways', 2);
    console.log(takeawaysSummary);
    
    console.log('\nSummary generation tests completed successfully!');
  } catch (error) {
    console.error('Error in summary generation tests:', error);
  }
}

// Test thread summary generation
async function testThreadSummaryGeneration() {
  console.log('\nTesting thread summary generation...');
  
  try {
    // Test brief thread summary
    console.log('\nGenerating brief thread summary:');
    const briefThreadSummary = await generateThreadSummary(testThread, 'brief', 2);
    console.log(briefThreadSummary);
    
    // Test bullet points thread summary
    console.log('\nGenerating bullet points thread summary:');
    const bulletThreadSummary = await generateThreadSummary(testThread, 'bullets', 2);
    console.log(bulletThreadSummary);
    
    // Test key takeaways thread summary
    console.log('\nGenerating key takeaways thread summary:');
    const takeawaysThreadSummary = await generateThreadSummary(testThread, 'takeaways', 2);
    console.log(takeawaysThreadSummary);
    
    console.log('\nThread summary generation tests completed successfully!');
  } catch (error) {
    console.error('Error in thread summary generation tests:', error);
  }
}

// Run tests
async function runTests() {
  // Check if API key is set
  if (!process.env.GEMINI_API_KEY) {
    console.error('Error: GEMINI_API_KEY is not set in .env file');
    console.log('Please create a .env file with your Gemini API key:');
    console.log('GEMINI_API_KEY=your_api_key_here');
    return;
  }
  
  // Run tests
  await testSummaryGeneration();
  await testThreadSummaryGeneration();
}

// Run tests
runTests();
