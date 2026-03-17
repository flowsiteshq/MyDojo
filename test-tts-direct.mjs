import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

async function test() {
  try {
    console.log('Testing ElevenLabs TTS...');
    console.log('API Key:', process.env.ELEVENLABS_API_KEY ? 'Set' : 'Not set');
    
    const audio = await client.textToSpeech.convert('JBFqnCBsd6RMkjVDRZzb', {
      text: 'Hello, this is a test.',
      modelId: 'eleven_turbo_v2_5',
      outputFormat: 'mp3_44100_128',
    });

    const chunks = [];
    const reader = audio.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
    }

    const buffer = Buffer.concat(chunks);
    console.log('✅ Success! Audio buffer size:', buffer.length, 'bytes');
    console.log('Base64 preview:', buffer.toString('base64').substring(0, 50) + '...');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

test();
