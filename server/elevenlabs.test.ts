import { describe, it, expect } from 'vitest';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

describe('ElevenLabs API Integration', () => {
  it('should successfully connect to ElevenLabs API with valid credentials', async () => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe('');
    
    const client = new ElevenLabsClient({
      apiKey: apiKey!,
    });
    
    // Test by generating a short audio sample (validates TTS permission)
    const audio = await client.textToSpeech.convert('JBFqnCBsd6RMkjVDRZzb', {
      text: 'Test',
      model_id: 'eleven_turbo_v2_5',
    });
    
    expect(audio).toBeDefined();
    
    // Convert async iterator to array to verify audio data
    const chunks = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    expect(chunks.length).toBeGreaterThan(0);
  }, 15000); // 15 second timeout for API call
});
