/**
 * Sound Manager for Kiosk Check-In System
 * Generates and plays synthesized sound effects using Web Audio API
 */

class SoundManager {
  private audioContext: AudioContext | null = null;
  private masterVolume = 0.3; // Default volume (0-1)

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Play belt snap sound - quick percussive snap
   */
  playBeltSnap() {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    // Create noise buffer for snap sound
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.05));
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 1;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(this.masterVolume * 0.8, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(now);
    source.stop(now + 0.1);
  }

  /**
   * Play XP chime - positive achievement sound
   */
  playXPChime() {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    // Create three-note ascending chime
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    const duration = 0.15;

    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = freq;

      const gainNode = ctx.createGain();
      const startTime = now + index * 0.08;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.4, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
  }

  /**
   * Play error sound - gentle negative feedback
   */
  playError() {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.2);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(this.masterVolume * 0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.2);
  }

  /**
   * Play button tap - subtle UI feedback
   */
  playButtonTap() {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = 800;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(this.masterVolume * 0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.05);
  }

  /**
   * Play birthday celebration - festive sound
   */
  playBirthday() {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    // Play "Happy Birthday" melody snippet (first 4 notes)
    const notes = [
      { freq: 261.63, time: 0 },    // C4
      { freq: 261.63, time: 0.15 },  // C4
      { freq: 293.66, time: 0.3 },   // D4
      { freq: 261.63, time: 0.45 },  // C4
    ];

    notes.forEach(({ freq, time }) => {
      const oscillator = ctx.createOscillator();
      oscillator.type = 'triangle';
      oscillator.frequency.value = freq;

      const gainNode = ctx.createGain();
      const startTime = now + time;
      gainNode.gain.setValueAtTime(this.masterVolume * 0.4, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.15);
    });
  }

  /**
   * Play success fanfare - triumphant sound for check-in success
   */
  playSuccessFanfare() {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    // Ascending major chord arpeggio
    const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const duration = 0.2;

    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      oscillator.type = 'triangle';
      oscillator.frequency.value = freq;

      const gainNode = ctx.createGain();
      const startTime = now + index * 0.1;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.5, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
  }

  /**
   * Set master volume (0-1)
   */
  setVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Resume audio context (required for user interaction on some browsers)
   */
  async resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
}

// Export singleton instance
export const soundManager = new SoundManager();
