// Audio Service using Web Audio API for gentle, ambient focus session chimes
// Zero external mp3 dependencies, 100% offline-resilient, subtle and calming

class AudioService {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Warm harmonic chime: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz), C6 (1046.5Hz)
   * Soft marimba/singing bowl envelope with exponential decay.
   */
  playCompletionChime(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [
        { freq: 523.25, time: 0, duration: 1.5, gain: 0.16 },
        { freq: 659.25, time: 0.12, duration: 1.5, gain: 0.15 },
        { freq: 783.99, time: 0.24, duration: 1.7, gain: 0.16 },
        { freq: 1046.5, time: 0.36, duration: 1.9, gain: 0.13 },
      ];

      notes.forEach(({ freq, time, duration, gain }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        // Soft attack and natural exponential release
        gainNode.gain.setValueAtTime(0.0001, now + time);
        gainNode.gain.exponentialRampToValueAtTime(gain, now + time + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + duration);
      });
    } catch {
      // Audio playback fails gracefully if muted or blocked
    }
  }
}

export const audioService = new AudioService();
