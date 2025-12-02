// ==========================================
// Replay System - Recording and playback utilities
// ==========================================

import type { ReplayData } from '@/types';

const REPLAY_STORAGE_KEY = 'snake_replay';

// Save replay data to localStorage
export function saveReplay(data: ReplayData): boolean {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(REPLAY_STORAGE_KEY, serialized);
    return true;
  } catch (error) {
    console.error('Failed to save replay:', error);
    return false;
  }
}

// Load replay data from localStorage
export function loadReplay(): ReplayData | null {
  try {
    const serialized = localStorage.getItem(REPLAY_STORAGE_KEY);
    if (!serialized) return null;

    const data = JSON.parse(serialized) as ReplayData;
    
    // Validate replay data structure
    if (!isValidReplayData(data)) {
      console.warn('Invalid replay data structure');
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to load replay:', error);
    return null;
  }
}

// Check if replay data exists
export function hasReplay(): boolean {
  try {
    const serialized = localStorage.getItem(REPLAY_STORAGE_KEY);
    if (!serialized) return false;
    
    const data = JSON.parse(serialized);
    return isValidReplayData(data);
  } catch {
    return false;
  }
}

// Clear replay data
export function clearReplay(): void {
  try {
    localStorage.removeItem(REPLAY_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear replay:', error);
  }
}

// Validate replay data structure
function isValidReplayData(data: unknown): data is ReplayData {
  if (!data || typeof data !== 'object') return false;
  
  const replay = data as Record<string, unknown>;
  
  return (
    typeof replay.seed === 'number' &&
    Array.isArray(replay.moves) &&
    typeof replay.finalScore === 'number' &&
    typeof replay.finalLength === 'number' &&
    typeof replay.timestamp === 'number' &&
    replay.moves.every((move: unknown) => 
      move && 
      typeof move === 'object' &&
      typeof (move as Record<string, unknown>).tick === 'number' &&
      typeof (move as Record<string, unknown>).direction === 'string'
    )
  );
}

// Format replay date for display
export function formatReplayDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Get replay duration estimate (based on moves and speed)
export function estimateReplayDuration(data: ReplayData): number {
  // Rough estimate: average 80ms per tick
  const avgTickMs = 80;
  const lastTick = data.moves.length > 0 
    ? data.moves[data.moves.length - 1].tick 
    : 0;
  
  return lastTick * avgTickMs;
}

