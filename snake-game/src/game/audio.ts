// ==========================================
// Audio Manager - 8-bit sound synthesis with Web Audio API
// ==========================================

import type { GameEvent } from '@/types';

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    // Load muted state from localStorage
    if (typeof window !== 'undefined') {
      const savedMuted = localStorage.getItem('snake_muted');
      this.isMuted = savedMuted === 'true';
    }
  }

  private initContext(): void {
    if (this.isInitialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.isInitialized = true;
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('snake_muted', String(muted));
    }
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  play(event: GameEvent): void {
    if (this.isMuted) return;
    
    // Initialize context on first play (user interaction required)
    this.initContext();
    if (!this.audioContext) return;

    // Resume context if suspended (autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    switch (event) {
      case 'eat':
        this.playEatSound();
        break;
      case 'die':
        this.playDieSound();
        break;
      case 'move':
        this.playMoveSound();
        break;
    }
  }

  // Short high-pitched beep for eating food
  private playEatSound(): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime); // A5
    oscillator.frequency.setValueAtTime(1108, this.audioContext.currentTime + 0.05); // C#6

    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gainNode.gain.exponentialDecayTo?.(0.01, this.audioContext.currentTime + 0.1) ??
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  // Descending sad tone for game over
  private playDieSound(): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'triangle';
    
    // Descending frequency
    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime); // A4
    oscillator.frequency.linearRampToValueAtTime(220, this.audioContext.currentTime + 0.2); // A3
    oscillator.frequency.linearRampToValueAtTime(110, this.audioContext.currentTime + 0.4); // A2

    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.4);
  }

  // Optional subtle tick for movement
  private playMoveSound(): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);

    gainNode.gain.setValueAtTime(0.02, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.02);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.02);
  }

  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.isInitialized = false;
  }
}

