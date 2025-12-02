// ==========================================
// Game Module Exports
// ==========================================

export { GameEngine } from './engine';
export type { GameEngineCallbacks } from './engine';
export { createSnake, moveSnake, growSnake, checkSelfCollision, getSnakePositions } from './snake';
export { spawnFood, manhattanDistance, getEmptyCells } from './food';
export { InputHandler } from './input';
export { AudioManager } from './audio';
export { EffectsManager } from './effects';
export { 
  saveReplay, 
  loadReplay, 
  hasReplay, 
  clearReplay, 
  formatReplayDate, 
  estimateReplayDuration 
} from './replay';

