// ==========================================
// Input Handler - Keyboard input with 2-frame buffer
// ==========================================

import type { Direction } from '@/types';
import { KEY_MAPPINGS, OPPOSITE_DIRECTIONS } from '@/types';

export class InputHandler {
  private currentDirection: Direction = 'RIGHT';
  private pendingDirection: Direction | null = null;
  private bufferedDirection: Direction | null = null;
  private isListening: boolean = false;
  private boundHandleKeyDown: (e: KeyboardEvent) => void;

  constructor() {
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
  }

  start(): void {
    if (this.isListening) return;
    this.isListening = true;
    window.addEventListener('keydown', this.boundHandleKeyDown);
  }

  stop(): void {
    if (!this.isListening) return;
    this.isListening = false;
    window.removeEventListener('keydown', this.boundHandleKeyDown);
  }

  reset(): void {
    this.currentDirection = 'RIGHT';
    this.pendingDirection = null;
    this.bufferedDirection = null;
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Get direction from key
    const direction = KEY_MAPPINGS[e.code] || KEY_MAPPINGS[e.key];
    if (!direction) return;

    // Prevent default browser behavior for arrow keys
    e.preventDefault();

    // Check if this is a valid direction change (not 180 degrees)
    const effectiveDirection = this.pendingDirection || this.currentDirection;
    if (direction === OPPOSITE_DIRECTIONS[effectiveDirection]) {
      return; // Invalid 180-degree reversal
    }

    // 2-frame input buffer system
    if (this.pendingDirection === null) {
      // First input - set as pending
      this.pendingDirection = direction;
    } else if (this.bufferedDirection === null) {
      // Second input - buffer it (but validate against pending)
      if (direction !== OPPOSITE_DIRECTIONS[this.pendingDirection]) {
        this.bufferedDirection = direction;
      }
    }
    // Additional inputs are ignored (buffer is full)
  }

  // Called by game engine each tick
  getNextDirection(currentSnakeDirection: Direction): Direction | null {
    this.currentDirection = currentSnakeDirection;

    if (this.pendingDirection === null) {
      return null;
    }

    const direction = this.pendingDirection;

    // Promote buffered direction to pending
    this.pendingDirection = this.bufferedDirection;
    this.bufferedDirection = null;

    return direction;
  }

  // For external state checks
  hasPendingInput(): boolean {
    return this.pendingDirection !== null;
  }
}

