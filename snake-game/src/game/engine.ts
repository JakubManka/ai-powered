// ==========================================
// Game Engine - Main game loop and state management
// ==========================================

import { Application, Container } from 'pixi.js';
import type { GameState, GameStatus, Direction, Position, ReplayData, ReplayMove } from '@/types';
import { 
  GRID_SIZE, 
  INITIAL_SNAKE_LENGTH, 
  POINTS_PER_FOOD, 
  calculateSpeed 
} from '@/lib/constants';
import { createSnake, moveSnake, growSnake, checkSelfCollision } from './snake';
import { spawnFood } from './food';
import { InputHandler } from './input';
import { AudioManager } from './audio';
import { EffectsManager } from './effects';
import { OPPOSITE_DIRECTIONS } from '@/types';

export interface GameEngineCallbacks {
  onScoreChange: (score: number) => void;
  onLengthChange: (length: number) => void;
  onGameOver: (finalScore: number, finalLength: number) => void;
  onStateChange: (status: GameStatus) => void;
}

export class GameEngine {
  private app: Application | null = null;
  private gameContainer: Container | null = null;
  private state: GameState;
  private callbacks: GameEngineCallbacks;
  private inputHandler: InputHandler;
  private audioManager: AudioManager;
  private effectsManager: EffectsManager | null = null;
  private gameLoopInterval: number | null = null;
  private tickCount: number = 0;
  private isReplay: boolean = false;
  private replayMoves: ReplayMove[] = [];
  private replayMoveIndex: number = 0;
  private recordedMoves: ReplayMove[] = [];

  // Seeded RNG state
  private rngState: number = 0;

  constructor(callbacks: GameEngineCallbacks) {
    this.callbacks = callbacks;
    this.inputHandler = new InputHandler();
    this.audioManager = new AudioManager();
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    const seed = Date.now();
    this.rngState = seed;
    
    const snake = createSnake(GRID_SIZE, INITIAL_SNAKE_LENGTH);
    
    return {
      status: 'idle',
      snake,
      food: { position: { x: 0, y: 0 } }, // Will be set in init
      score: 0,
      speed: calculateSpeed(0),
      seed,
    };
  }

  // Seeded random number generator (for deterministic replays)
  private seededRandom(): number {
    this.rngState = (this.rngState * 1103515245 + 12345) & 0x7fffffff;
    return this.rngState / 0x7fffffff;
  }

  async init(canvas: HTMLCanvasElement): Promise<void> {
    // Initialize PixiJS application
    this.app = new Application();
    
    await this.app.init({
      canvas,
      width: canvas.width,
      height: canvas.height,
      backgroundColor: 0x9bbc0f, // Game Boy lightest green
      antialias: false,
      resolution: 1,
    });

    // Create game container
    this.gameContainer = new Container();
    this.app.stage.addChild(this.gameContainer);

    // Initialize effects manager
    this.effectsManager = new EffectsManager(this.app, this.gameContainer);

    // Spawn initial food
    this.state.food.position = spawnFood(
      this.state.snake.segments,
      GRID_SIZE,
      () => this.seededRandom()
    );
  }

  start(): void {
    if (this.state.status === 'playing') return;

    this.state.status = 'playing';
    this.callbacks.onStateChange('playing');
    this.inputHandler.start();
    this.startGameLoop();
  }

  stop(): void {
    this.stopGameLoop();
    this.inputHandler.stop();
    this.state.status = 'idle';
    this.callbacks.onStateChange('idle');
  }

  reset(): void {
    this.stopGameLoop();
    this.inputHandler.reset();
    this.recordedMoves = [];
    this.tickCount = 0;
    this.state = this.createInitialState();
    
    // Spawn initial food with new seed
    this.state.food.position = spawnFood(
      this.state.snake.segments,
      GRID_SIZE,
      () => this.seededRandom()
    );

    this.callbacks.onScoreChange(0);
    this.callbacks.onLengthChange(INITIAL_SNAKE_LENGTH);
  }

  private startGameLoop(): void {
    if (this.gameLoopInterval !== null) return;

    const tick = () => {
      this.update();
      this.gameLoopInterval = window.setTimeout(tick, this.state.speed);
    };

    this.gameLoopInterval = window.setTimeout(tick, this.state.speed);
  }

  private stopGameLoop(): void {
    if (this.gameLoopInterval !== null) {
      clearTimeout(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }
  }

  private update(): void {
    if (this.state.status !== 'playing') return;

    this.tickCount++;

    // Get direction input (from player or replay)
    let newDirection: Direction | null = null;

    if (this.isReplay) {
      // Check if there's a move for this tick
      while (
        this.replayMoveIndex < this.replayMoves.length &&
        this.replayMoves[this.replayMoveIndex].tick <= this.tickCount
      ) {
        newDirection = this.replayMoves[this.replayMoveIndex].direction;
        this.replayMoveIndex++;
      }
    } else {
      newDirection = this.inputHandler.getNextDirection(this.state.snake.direction);
    }

    // Apply direction change
    if (newDirection && newDirection !== OPPOSITE_DIRECTIONS[this.state.snake.direction]) {
      this.state.snake.nextDirection = newDirection;
      
      // Record move for replay
      if (!this.isReplay) {
        this.recordedMoves.push({
          tick: this.tickCount,
          direction: newDirection,
        });
      }
    }

    // Move snake
    this.state.snake = moveSnake(this.state.snake);
    const newHead = this.state.snake.segments[0];

    // Check wall collision
    if (
      newHead.x < 0 ||
      newHead.x >= GRID_SIZE ||
      newHead.y < 0 ||
      newHead.y >= GRID_SIZE
    ) {
      this.handleGameOver();
      return;
    }

    // Check self collision
    if (checkSelfCollision(this.state.snake)) {
      this.handleGameOver();
      return;
    }

    // Check food collision
    if (newHead.x === this.state.food.position.x && newHead.y === this.state.food.position.y) {
      this.handleFoodEaten();
    }

    // Render
    this.render();
  }

  private handleFoodEaten(): void {
    // Grow snake
    this.state.snake = growSnake(this.state.snake);
    
    // Update score
    this.state.score += POINTS_PER_FOOD;
    this.callbacks.onScoreChange(this.state.score);
    this.callbacks.onLengthChange(this.state.snake.segments.length);

    // Update speed
    this.state.speed = calculateSpeed(this.state.score);

    // Spawn new food
    this.state.food.position = spawnFood(
      this.state.snake.segments,
      GRID_SIZE,
      () => this.seededRandom()
    );

    // Effects
    this.audioManager.play('eat');
    this.effectsManager?.spawnParticles(this.state.food.position);
  }

  private handleGameOver(): void {
    this.state.status = 'gameover';
    this.stopGameLoop();
    this.inputHandler.stop();

    // Effects
    this.audioManager.play('die');
    this.effectsManager?.screenShake();

    // Save replay data
    if (!this.isReplay) {
      this.saveReplayData();
    }

    // Notify callback after effects
    setTimeout(() => {
      this.callbacks.onGameOver(
        this.state.score,
        this.state.snake.segments.length
      );
      this.callbacks.onStateChange('gameover');
    }, 200);
  }

  private saveReplayData(): void {
    const replayData: ReplayData = {
      seed: this.state.seed,
      moves: this.recordedMoves,
      finalScore: this.state.score,
      finalLength: this.state.snake.segments.length,
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem('snake_replay', JSON.stringify(replayData));
    } catch (error) {
      console.error('Failed to save replay data:', error);
    }
  }

  loadReplay(): ReplayData | null {
    try {
      const data = localStorage.getItem('snake_replay');
      if (!data) return null;
      return JSON.parse(data) as ReplayData;
    } catch {
      return null;
    }
  }

  startReplay(replayData: ReplayData): void {
    this.isReplay = true;
    this.replayMoves = replayData.moves;
    this.replayMoveIndex = 0;
    this.tickCount = 0;

    // Reset with replay seed
    this.rngState = replayData.seed;
    this.state.seed = replayData.seed;
    
    const snake = createSnake(GRID_SIZE, INITIAL_SNAKE_LENGTH);
    this.state.snake = snake;
    this.state.score = 0;
    this.state.speed = calculateSpeed(0);
    
    // Spawn food with same seed
    this.state.food.position = spawnFood(
      this.state.snake.segments,
      GRID_SIZE,
      () => this.seededRandom()
    );

    this.callbacks.onScoreChange(0);
    this.callbacks.onLengthChange(INITIAL_SNAKE_LENGTH);

    this.state.status = 'playing';
    this.callbacks.onStateChange('replay');
    this.startGameLoop();
  }

  stopReplay(): void {
    this.isReplay = false;
    this.replayMoves = [];
    this.replayMoveIndex = 0;
    this.stop();
    this.reset();
  }

  private render(): void {
    if (!this.effectsManager) return;

    this.effectsManager.render(
      this.state.snake,
      this.state.food,
      GRID_SIZE
    );
  }

  setMuted(muted: boolean): void {
    this.audioManager.setMuted(muted);
  }

  destroy(): void {
    this.stop();
    this.effectsManager?.destroy();
    this.app?.destroy(true);
    this.app = null;
  }

  getState(): GameState {
    return this.state;
  }
}

