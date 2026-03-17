// Test the text-to-speech endpoint directly
import fetch from 'node-fetch';

const testTTS = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/trpc/ai.textToSpeech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Hello! This is a test of the voice chat feature.'
      })
    });
    
    const data = await response.json();
    console.log('TTS Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('TTS Error:', error.message);
  }
};

testTTS();
