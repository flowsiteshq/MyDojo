import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY!,
});

/**
 * Convert text to speech using ElevenLabs API
 * @param text - The text to convert to speech
 * @param voiceId - Optional voice ID (defaults to a friendly female voice)
 * @returns Audio data as a Buffer
 */
export async function textToSpeech(
  text: string,
  voiceId: string = 'kdmDKE6EkgrWrrykO9Qt' // Default: Custom voice
): Promise<Buffer> {
  try {
    const audio = await client.textToSpeech.convert(voiceId, {
      text,
      modelId: 'eleven_turbo_v2_5', // Fast, low-latency model
      outputFormat: 'mp3_44100_128',
    });

    // Collect all audio chunks into a single buffer
    const chunks: Buffer[] = [];
    const reader = audio.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
    }

    return Buffer.concat(chunks);
  } catch (error) {
    console.error('Text-to-speech error:', error);
    throw new Error('Failed to generate speech');
  }
}

/**
 * Available voice IDs for different personas:
 * - 'JBFqnCBsd6RMkjVDRZzb' - George (friendly male)
 * - 'EXAVITQu4vr4xnSDxMaL' - Bella (warm female)
 * - 'pNInz6obpgDQGcFmaJgB' - Adam (professional male)
 * - '21m00Tcm4TlvDq8ikWAM' - Rachel (clear female)
 */
