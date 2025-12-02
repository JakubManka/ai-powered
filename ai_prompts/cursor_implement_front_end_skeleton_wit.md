# Implement front-end skeleton with technologies

_Exported on 12/2/2025 at 12:03:20 GMT+1 from Cursor (2.1.42)_

---

**User**

Jako FE expert w react, typescript, tailwind css, pixiJS będziesz implementować FE

Zacznijmy od instalacji wymaganych node modules

---

**Cursor**

Zaczynam od sprawdzenia co już istnieje w projekcie i instalacji brakujących zależności.

Widzę, że projekt Next.js już istnieje z backendem. Sprawdzę co trzeba dodać dla frontendu.

Instaluję PixiJS dla renderowania gry:

```bash
npm install pixi.js
```

PixiJS zainstalowany pomyślnie. Projekt ma teraz wszystkie wymagane zależności:

- Next.js 15 z App Router
- React 19
- TypeScript
- Tailwind CSS
- PixiJS 8.x

Jestem gotowy do tworzenia struktury frontendu. Co chcesz żebym zrobił najpierw?

---

**User**

Zacznij od typów TypeScript i stałych gry.

---

**Cursor**

Tworzę typy i stałe dla gry Snake:

```typescript
// ==========================================
// Game Types - Snake Game
// ==========================================

// Direction enum for snake movement
export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

// Position on the grid
export interface Position {
	x: number;
	y: number;
}

// Snake state
export interface Snake {
	segments: Position[];
	direction: Direction;
	nextDirection: Direction;
	bufferedDirection: Direction | null;
}

// Food state
export interface Food {
	position: Position;
}

// Game state
export type GameStatus = "idle" | "playing" | "paused" | "gameover" | "replay";

export interface GameState {
	status: GameStatus;
	snake: Snake;
	food: Food;
	score: number;
	speed: number;
	seed: number;
}

// Screen types for navigation
export type ScreenType =
	| "start"
	| "game"
	| "gameover"
	| "settings"
	| "leaderboard"
	| "replay";

// Player settings persisted to localStorage
export interface PlayerSettings {
	soundEnabled: boolean;
	highContrastMode: boolean;
	foregroundColor: string;
	backgroundColor: string;
	nickname: string;
}

// Replay data structure
export interface ReplayData {
	seed: number;
	moves: ReplayMove[];
	finalScore: number;
	finalLength: number;
	timestamp: number;
}

export interface ReplayMove {
	tick: number;
	direction: Direction;
}

// Leaderboard entry from API
export interface LeaderboardEntry {
	id: number;
	nick: string;
	score: number;
	snakeLength: number;
	createdAt: string;
}

// API response types
export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

// Game events for audio/visual effects
export type GameEvent = "eat" | "die" | "move";

// Particle for visual effects
export interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	life: number;
	maxLife: number;
	color: string;
	size: number;
}

// Input key mappings
export const KEY_MAPPINGS: Record<string, Direction> = {
	ArrowUp: "UP",
	ArrowDown: "DOWN",
	ArrowLeft: "LEFT",
	ArrowRight: "RIGHT",
	KeyW: "UP",
	KeyS: "DOWN",
	KeyA: "LEFT",
	KeyD: "RIGHT",
	w: "UP",
	s: "DOWN",
	a: "LEFT",
	d: "RIGHT",
} as const;

// Opposite directions for 180-degree prevention
export const OPPOSITE_DIRECTIONS: Record<Direction, Direction> = {
	UP: "DOWN",
	DOWN: "UP",
	LEFT: "RIGHT",
	RIGHT: "LEFT",
} as const;
```

Typy i stałe utworzone. Co dalej?

---

**User**

Teraz stwórz główny silnik gry - GameEngine class.

---

**Cursor**

Tworzę główną klasę GameEngine z logiką gry:

```typescript
// ==========================================
// Game Engine - Main game loop and state management
// ==========================================

import { Application, Container } from "pixi.js";
import type {
	GameState,
	GameStatus,
	Direction,
	Position,
	ReplayData,
	ReplayMove,
} from "@/types";
import {
	GRID_SIZE,
	INITIAL_SNAKE_LENGTH,
	POINTS_PER_FOOD,
	calculateSpeed,
} from "@/lib/constants";
import { createSnake, moveSnake, growSnake, checkSelfCollision } from "./snake";
import { spawnFood } from "./food";
import { InputHandler } from "./input";
import { AudioManager } from "./audio";
import { EffectsManager } from "./effects";
import { OPPOSITE_DIRECTIONS } from "@/types";

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
			status: "idle",
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
		if (this.state.status === "playing") return;

		this.state.status = "playing";
		this.callbacks.onStateChange("playing");
		this.inputHandler.start();
		this.startGameLoop();
	}

	stop(): void {
		this.stopGameLoop();
		this.inputHandler.stop();
		this.state.status = "idle";
		this.callbacks.onStateChange("idle");
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
		if (this.state.status !== "playing") return;

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
			newDirection = this.inputHandler.getNextDirection(
				this.state.snake.direction
			);
		}

		// Apply direction change
		if (
			newDirection &&
			newDirection !== OPPOSITE_DIRECTIONS[this.state.snake.direction]
		) {
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
		const oldHead = { ...this.state.snake.segments[0] };
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
		if (
			newHead.x === this.state.food.position.x &&
			newHead.y === this.state.food.position.y
		) {
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
		this.audioManager.play("eat");
		this.effectsManager?.spawnParticles(this.state.food.position);
	}

	private handleGameOver(): void {
		this.state.status = "gameover";
		this.stopGameLoop();
		this.inputHandler.stop();

		// Effects
		this.audioManager.play("die");
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
			this.callbacks.onStateChange("gameover");
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
			localStorage.setItem("snake_replay", JSON.stringify(replayData));
		} catch (error) {
			console.error("Failed to save replay data:", error);
		}
	}

	loadReplay(): ReplayData | null {
		try {
			const data = localStorage.getItem("snake_replay");
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

		this.state.status = "playing";
		this.callbacks.onStateChange("replay");
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

		this.effectsManager.render(this.state.snake, this.state.food, GRID_SIZE);
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
```

GameEngine utworzony. Używa kilku modułów które muszę jeszcze stworzyć: `snake.ts`, `food.ts`, `input.ts`, `audio.ts` i `effects.ts`.

---

**User**

Stwórz snake.ts i food.ts - logikę węża i jedzenia.

---

**Cursor**

Tworzę logikę węża i spawnu jedzenia:

```typescript
// ==========================================
// Snake Logic - Movement and collision detection
// ==========================================

import type { Snake, Position, Direction } from "@/types";

// Create initial snake at center of grid
export function createSnake(gridSize: number, initialLength: number): Snake {
	const centerX = Math.floor(gridSize / 2);
	const centerY = Math.floor(gridSize / 2);

	// Snake starts horizontal, moving right
	const segments: Position[] = [];
	for (let i = 0; i < initialLength; i++) {
		segments.push({
			x: centerX - i,
			y: centerY,
		});
	}

	return {
		segments,
		direction: "RIGHT",
		nextDirection: "RIGHT",
		bufferedDirection: null,
	};
}

// Move snake in current direction
export function moveSnake(snake: Snake): Snake {
	const newSegments = [...snake.segments];
	const head = { ...newSegments[0] };

	// Apply direction
	const direction = snake.nextDirection;
	switch (direction) {
		case "UP":
			head.y -= 1;
			break;
		case "DOWN":
			head.y += 1;
			break;
		case "LEFT":
			head.x -= 1;
			break;
		case "RIGHT":
			head.x += 1;
			break;
	}

	// Add new head at front
	newSegments.unshift(head);
	// Remove tail (snake doesn't grow on move, only on eat)
	newSegments.pop();

	return {
		...snake,
		segments: newSegments,
		direction: direction,
		nextDirection: direction,
		// Process buffered direction
		bufferedDirection: null,
	};
}

// Grow snake by adding segment at tail
export function growSnake(snake: Snake): Snake {
	const tail = snake.segments[snake.segments.length - 1];
	const secondToLast = snake.segments[snake.segments.length - 2];

	// Determine direction of tail growth
	let newTail: Position;
	if (secondToLast) {
		// Extend in opposite direction of tail movement
		const dx = tail.x - secondToLast.x;
		const dy = tail.y - secondToLast.y;
		newTail = {
			x: tail.x + dx,
			y: tail.y + dy,
		};
	} else {
		// Fallback: just duplicate tail
		newTail = { ...tail };
	}

	return {
		...snake,
		segments: [...snake.segments, newTail],
	};
}

// Check if snake head collides with body
export function checkSelfCollision(snake: Snake): boolean {
	const head = snake.segments[0];

	// Check against all body segments (skip head at index 0)
	for (let i = 1; i < snake.segments.length; i++) {
		if (head.x === snake.segments[i].x && head.y === snake.segments[i].y) {
			return true;
		}
	}

	return false;
}

// Get all positions occupied by snake
export function getSnakePositions(snake: Snake): Set<string> {
	const positions = new Set<string>();
	for (const segment of snake.segments) {
		positions.add(`${segment.x},${segment.y}`);
	}
	return positions;
}
```

```typescript
// ==========================================
// Food Logic - Spawning algorithm with Manhattan distance
// ==========================================

import type { Position } from "@/types";

// Calculate Manhattan distance between two positions
export function manhattanDistance(a: Position, b: Position): number {
	return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// Find all empty cells on the grid
export function getEmptyCells(
	snakePositions: Position[],
	gridSize: number
): Position[] {
	const occupied = new Set<string>();

	for (const pos of snakePositions) {
		occupied.add(`${pos.x},${pos.y}`);
	}

	const emptyCells: Position[] = [];

	for (let x = 0; x < gridSize; x++) {
		for (let y = 0; y < gridSize; y++) {
			if (!occupied.has(`${x},${y}`)) {
				emptyCells.push({ x, y });
			}
		}
	}

	return emptyCells;
}

// Spawn food at maximum Manhattan distance from snake head
export function spawnFood(
	snakePositions: Position[],
	gridSize: number,
	randomFn: () => number
): Position {
	const emptyCells = getEmptyCells(snakePositions, gridSize);

	// Edge case: no empty cells (snake fills entire grid)
	if (emptyCells.length === 0) {
		// Return position outside grid to trigger game end
		return { x: -1, y: -1 };
	}

	const head = snakePositions[0];

	// Calculate distance for each empty cell
	const cellsWithDistance = emptyCells.map((cell) => ({
		cell,
		distance: manhattanDistance(head, cell),
	}));

	// Find maximum distance
	const maxDistance = Math.max(...cellsWithDistance.map((c) => c.distance));

	// Get all cells with maximum distance
	const farthestCells = cellsWithDistance
		.filter((c) => c.distance === maxDistance)
		.map((c) => c.cell);

	// If multiple cells tie, select randomly using seeded RNG
	if (farthestCells.length === 1) {
		return farthestCells[0];
	}

	const randomIndex = Math.floor(randomFn() * farthestCells.length);
	return farthestCells[randomIndex];
}
```

Snake i food logic gotowe. Food spawnuje się na maksymalnym dystansie Manhattan od głowy węża.

---

**User**

Teraz input handler i audio manager.

---

**Cursor**

Tworzę obsługę klawiatury z 2-frame bufferem i syntezę dźwięku 8-bit:

```typescript
// ==========================================
// Input Handler - Keyboard input with 2-frame buffer
// ==========================================

import type { Direction } from "@/types";
import { KEY_MAPPINGS, OPPOSITE_DIRECTIONS } from "@/types";

export class InputHandler {
	private currentDirection: Direction = "RIGHT";
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
		window.addEventListener("keydown", this.boundHandleKeyDown);
	}

	stop(): void {
		if (!this.isListening) return;
		this.isListening = false;
		window.removeEventListener("keydown", this.boundHandleKeyDown);
	}

	reset(): void {
		this.currentDirection = "RIGHT";
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
```

```typescript
// ==========================================
// Audio Manager - 8-bit sound synthesis with Web Audio API
// ==========================================

import type { GameEvent } from "@/types";

export class AudioManager {
	private audioContext: AudioContext | null = null;
	private isMuted: boolean = false;
	private isInitialized: boolean = false;

	constructor() {
		// Load muted state from localStorage
		if (typeof window !== "undefined") {
			const savedMuted = localStorage.getItem("snake_muted");
			this.isMuted = savedMuted === "true";
		}
	}

	private initContext(): void {
		if (this.isInitialized) return;

		try {
			this.audioContext = new (window.AudioContext ||
				(window as unknown as { webkitAudioContext: typeof AudioContext })
					.webkitAudioContext)();
			this.isInitialized = true;
		} catch (error) {
			console.warn("Web Audio API not supported:", error);
		}
	}

	setMuted(muted: boolean): void {
		this.isMuted = muted;
		if (typeof window !== "undefined") {
			localStorage.setItem("snake_muted", String(muted));
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
		if (this.audioContext.state === "suspended") {
			this.audioContext.resume();
		}

		switch (event) {
			case "eat":
				this.playEatSound();
				break;
			case "die":
				this.playDieSound();
				break;
			case "move":
				this.playMoveSound();
				break;
		}
	}

	// Short high-pitched beep for eating food
	private playEatSound(): void {
		if (!this.audioContext) return;

		const oscillator = this.audioContext.createOscillator();
		const gainNode = this.audioContext.createGain();

		oscillator.type = "square";
		oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime); // A5
		oscillator.frequency.setValueAtTime(
			1108,
			this.audioContext.currentTime + 0.05
		); // C#6

		gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
		gainNode.gain.exponentialDecayTo?.(
			0.01,
			this.audioContext.currentTime + 0.1
		) ??
			gainNode.gain.exponentialRampToValueAtTime(
				0.01,
				this.audioContext.currentTime + 0.1
			);

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

		oscillator.type = "triangle";

		// Descending frequency
		oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime); // A4
		oscillator.frequency.linearRampToValueAtTime(
			220,
			this.audioContext.currentTime + 0.2
		); // A3
		oscillator.frequency.linearRampToValueAtTime(
			110,
			this.audioContext.currentTime + 0.4
		); // A2

		gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
		gainNode.gain.exponentialRampToValueAtTime(
			0.01,
			this.audioContext.currentTime + 0.4
		);

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

		oscillator.type = "square";
		oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);

		gainNode.gain.setValueAtTime(0.02, this.audioContext.currentTime);
		gainNode.gain.exponentialRampToValueAtTime(
			0.001,
			this.audioContext.currentTime + 0.02
		);

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
```

Input handler z 2-frame bufferem i audio manager z syntezą 8-bit gotowe. Jeszcze potrzebujemy EffectsManager.

---

**User**

Kontynuuj - stwórz EffectsManager z renderowaniem PixiJS.

---

**Cursor**

Tworzę EffectsManager z renderowaniem PixiJS, particle effects i screen shake:

```typescript
// ==========================================
// Visual Effects Manager - PixiJS rendering and effects
// ==========================================

import { Application, Container, Graphics } from "pixi.js";
import type { Snake, Food, Position, Particle } from "@/types";
import { COLORS } from "@/lib/constants";

export class EffectsManager {
	private app: Application;
	private gameContainer: Container;
	private snakeGraphics: Graphics;
	private foodGraphics: Graphics;
	private particleContainer: Container;
	private gridGraphics: Graphics;
	private particles: Particle[] = [];
	private cellSize: number = 0;
	private foodPulse: number = 0;
	private shakeOffset = { x: 0, y: 0 };
	private shakeIntensity: number = 0;
	private animationFrame: number | null = null;

	// Custom colors for high contrast mode
	private foregroundColor: number = parseInt(COLORS.darkest.slice(1), 16);
	private backgroundColor: number = parseInt(COLORS.lightest.slice(1), 16);
	private useHighContrast: boolean = false;

	constructor(app: Application, gameContainer: Container) {
		this.app = app;
		this.gameContainer = gameContainer;

		// Create graphics layers
		this.gridGraphics = new Graphics();
		this.snakeGraphics = new Graphics();
		this.foodGraphics = new Graphics();
		this.particleContainer = new Container();

		this.gameContainer.addChild(this.gridGraphics);
		this.gameContainer.addChild(this.foodGraphics);
		this.gameContainer.addChild(this.snakeGraphics);
		this.gameContainer.addChild(this.particleContainer);

		// Start animation loop
		this.startAnimationLoop();
	}

	private startAnimationLoop(): void {
		const animate = () => {
			this.updateEffects();
			this.animationFrame = requestAnimationFrame(animate);
		};
		this.animationFrame = requestAnimationFrame(animate);
	}

	setHighContrast(
		enabled: boolean,
		foreground?: string,
		background?: string
	): void {
		this.useHighContrast = enabled;

		if (enabled && foreground && background) {
			this.foregroundColor = parseInt(foreground.slice(1), 16);
			this.backgroundColor = parseInt(background.slice(1), 16);
		} else {
			this.foregroundColor = parseInt(COLORS.darkest.slice(1), 16);
			this.backgroundColor = parseInt(COLORS.lightest.slice(1), 16);
		}
	}

	render(snake: Snake, food: Food, gridSize: number): void {
		// Calculate cell size based on canvas dimensions
		this.cellSize = Math.min(
			this.app.canvas.width / gridSize,
			this.app.canvas.height / gridSize
		);

		// Apply screen shake
		this.gameContainer.x = this.shakeOffset.x;
		this.gameContainer.y = this.shakeOffset.y;

		this.renderGrid(gridSize);
		this.renderSnake(snake);
		this.renderFood(food);
	}

	private renderGrid(gridSize: number): void {
		this.gridGraphics.clear();

		const gridColor = this.useHighContrast
			? this.foregroundColor
			: parseInt(COLORS.light.slice(1), 16);

		// Draw subtle grid lines
		for (let i = 0; i <= gridSize; i++) {
			// Vertical lines
			this.gridGraphics.moveTo(i * this.cellSize, 0);
			this.gridGraphics.lineTo(i * this.cellSize, gridSize * this.cellSize);

			// Horizontal lines
			this.gridGraphics.moveTo(0, i * this.cellSize);
			this.gridGraphics.lineTo(gridSize * this.cellSize, i * this.cellSize);
		}

		this.gridGraphics.stroke({ width: 0.5, color: gridColor, alpha: 0.3 });
	}

	private renderSnake(snake: Snake): void {
		this.snakeGraphics.clear();

		const headColor = this.useHighContrast
			? this.foregroundColor
			: parseInt(COLORS.darkest.slice(1), 16);

		const bodyColor = this.useHighContrast
			? this.foregroundColor
			: parseInt(COLORS.dark.slice(1), 16);

		snake.segments.forEach((segment, index) => {
			const isHead = index === 0;
			const color = isHead ? headColor : bodyColor;
			const padding = 1;

			this.snakeGraphics.rect(
				segment.x * this.cellSize + padding,
				segment.y * this.cellSize + padding,
				this.cellSize - padding * 2,
				this.cellSize - padding * 2
			);
			this.snakeGraphics.fill(color);

			// Add eyes to head
			if (isHead) {
				this.renderSnakeEyes(segment, snake.direction);
			}
		});
	}

	private renderSnakeEyes(head: Position, direction: string): void {
		const eyeColor = this.useHighContrast
			? this.backgroundColor
			: parseInt(COLORS.lightest.slice(1), 16);

		const eyeSize = this.cellSize * 0.15;
		const eyeOffset = this.cellSize * 0.25;

		let leftEye: Position;
		let rightEye: Position;

		const centerX = head.x * this.cellSize + this.cellSize / 2;
		const centerY = head.y * this.cellSize + this.cellSize / 2;

		switch (direction) {
			case "UP":
				leftEye = { x: centerX - eyeOffset, y: centerY - eyeOffset };
				rightEye = { x: centerX + eyeOffset, y: centerY - eyeOffset };
				break;
			case "DOWN":
				leftEye = { x: centerX - eyeOffset, y: centerY + eyeOffset };
				rightEye = { x: centerX + eyeOffset, y: centerY + eyeOffset };
				break;
			case "LEFT":
				leftEye = { x: centerX - eyeOffset, y: centerY - eyeOffset };
				rightEye = { x: centerX - eyeOffset, y: centerY + eyeOffset };
				break;
			case "RIGHT":
			default:
				leftEye = { x: centerX + eyeOffset, y: centerY - eyeOffset };
				rightEye = { x: centerX + eyeOffset, y: centerY + eyeOffset };
				break;
		}

		this.snakeGraphics.circle(leftEye.x, leftEye.y, eyeSize);
		this.snakeGraphics.circle(rightEye.x, rightEye.y, eyeSize);
		this.snakeGraphics.fill(eyeColor);
	}

	private renderFood(food: Food): void {
		this.foodGraphics.clear();

		// Pulsing glow effect
		const pulseAmount = Math.sin(this.foodPulse) * 0.15 + 0.85;
		const glowColor = this.useHighContrast
			? this.foregroundColor
			: parseInt(COLORS.light.slice(1), 16);

		const centerX = food.position.x * this.cellSize + this.cellSize / 2;
		const centerY = food.position.y * this.cellSize + this.cellSize / 2;
		const radius = (this.cellSize / 2 - 2) * pulseAmount;

		// Outer glow
		this.foodGraphics.circle(centerX, centerY, radius + 2);
		this.foodGraphics.fill({ color: glowColor, alpha: 0.3 * pulseAmount });

		// Inner food
		this.foodGraphics.circle(centerX, centerY, radius);
		this.foodGraphics.fill(glowColor);
	}

	spawnParticles(position: Position): void {
		const particleCount = 8;
		const centerX = position.x * this.cellSize + this.cellSize / 2;
		const centerY = position.y * this.cellSize + this.cellSize / 2;

		for (let i = 0; i < particleCount; i++) {
			const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
			const speed = 2 + Math.random() * 3;

			this.particles.push({
				x: centerX,
				y: centerY,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				life: 1,
				maxLife: 1,
				color: COLORS.light,
				size: 3 + Math.random() * 2,
			});
		}
	}

	screenShake(): void {
		this.shakeIntensity = 8;
	}

	private updateEffects(): void {
		// Update food pulse
		this.foodPulse += 0.1;

		// Update screen shake
		if (this.shakeIntensity > 0) {
			this.shakeOffset.x = (Math.random() - 0.5) * this.shakeIntensity;
			this.shakeOffset.y = (Math.random() - 0.5) * this.shakeIntensity;
			this.shakeIntensity *= 0.85;

			if (this.shakeIntensity < 0.5) {
				this.shakeIntensity = 0;
				this.shakeOffset = { x: 0, y: 0 };
			}
		}

		// Update and render particles
		this.updateParticles();
	}

	private updateParticles(): void {
		// Clear old particle graphics
		this.particleContainer.removeChildren();

		// Update particles
		this.particles = this.particles.filter((p) => {
			p.x += p.vx;
			p.y += p.vy;
			p.vy += 0.1; // Gravity
			p.life -= 0.03;

			if (p.life <= 0) return false;

			// Render particle
			const graphics = new Graphics();
			graphics.circle(p.x, p.y, p.size * p.life);
			graphics.fill({
				color: parseInt(p.color.slice(1), 16),
				alpha: p.life,
			});
			this.particleContainer.addChild(graphics);

			return true;
		});
	}

	destroy(): void {
		if (this.animationFrame !== null) {
			cancelAnimationFrame(this.animationFrame);
		}
		this.gameContainer.removeChildren();
		this.particles = [];
	}
}
```

EffectsManager gotowy z:

- Renderowanie siatki, węża z oczami, jedzenia z pulsowaniem
- Particle effects przy zjedzeniu
- Screen shake przy game over
- Obsługa high contrast mode

---

**User**

Dodaj replay system i index eksporty dla modułu game.

---

**Cursor**

Tworzę replay system i eksporty:

```typescript
// ==========================================
// Replay System - Recording and playback utilities
// ==========================================

import type { ReplayData } from "@/types";

const REPLAY_STORAGE_KEY = "snake_replay";

// Save replay data to localStorage
export function saveReplay(data: ReplayData): boolean {
	try {
		const serialized = JSON.stringify(data);
		localStorage.setItem(REPLAY_STORAGE_KEY, serialized);
		return true;
	} catch (error) {
		console.error("Failed to save replay:", error);
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
			console.warn("Invalid replay data structure");
			return null;
		}

		return data;
	} catch (error) {
		console.error("Failed to load replay:", error);
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
		console.error("Failed to clear replay:", error);
	}
}

// Validate replay data structure
function isValidReplayData(data: unknown): data is ReplayData {
	if (!data || typeof data !== "object") return false;

	const replay = data as Record<string, unknown>;

	return (
		typeof replay.seed === "number" &&
		Array.isArray(replay.moves) &&
		typeof replay.finalScore === "number" &&
		typeof replay.finalLength === "number" &&
		typeof replay.timestamp === "number" &&
		replay.moves.every(
			(move: unknown) =>
				move &&
				typeof move === "object" &&
				typeof (move as Record<string, unknown>).tick === "number" &&
				typeof (move as Record<string, unknown>).direction === "string"
		)
	);
}

// Format replay date for display
export function formatReplayDate(timestamp: number): string {
	const date = new Date(timestamp);
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

// Get replay duration estimate (based on moves and speed)
export function estimateReplayDuration(data: ReplayData): number {
	// Rough estimate: average 80ms per tick
	const avgTickMs = 80;
	const lastTick =
		data.moves.length > 0 ? data.moves[data.moves.length - 1].tick : 0;

	return lastTick * avgTickMs;
}
```

```typescript
// ==========================================
// Game Module Exports
// ==========================================

export { GameEngine } from "./engine";
export type { GameEngineCallbacks } from "./engine";
export {
	createSnake,
	moveSnake,
	growSnake,
	checkSelfCollision,
	getSnakePositions,
} from "./snake";
export { spawnFood, manhattanDistance, getEmptyCells } from "./food";
export { InputHandler } from "./input";
export { AudioManager } from "./audio";
export { EffectsManager } from "./effects";
export {
	saveReplay,
	loadReplay,
	hasReplay,
	clearReplay,
	formatReplayDate,
	estimateReplayDuration,
} from "./replay";
```

Game module kompletny. Eksportuje wszystkie elementy silnika.

---

**User**

Teraz potrzebujemy style CSS. Stwórz globals.css z Game Boy stylem.

---

**Cursor**

Tworzę style CSS z paletą Game Boy:

```postcss
@import "tailwindcss";

/* ==========================================
   Game Boy Color Palette
   ========================================== */
:root {
	/* Game Boy Green Palette */
	--gb-darkest: #0f380f;
	--gb-dark: #306230;
	--gb-light: #8bac0f;
	--gb-lightest: #9bbc0f;

	/* Semantic aliases */
	--color-primary: var(--gb-darkest);
	--color-secondary: var(--gb-dark);
	--color-accent: var(--gb-light);
	--color-background: var(--gb-lightest);

	/* High contrast mode (overridden via JS) */
	--hc-foreground: #000000;
	--hc-background: #ffffff;

	/* Spacing */
	--game-border-width: 4px;
	--game-border-radius: 8px;
}

/* ==========================================
   Tailwind Theme Integration
   ========================================== */
@theme inline {
	--color-gb-darkest: var(--gb-darkest);
	--color-gb-dark: var(--gb-dark);
	--color-gb-light: var(--gb-light);
	--color-gb-lightest: var(--gb-lightest);

	--font-pixel: "Press Start 2P", monospace;
	--font-sans: "VT323", system-ui, sans-serif;
}

/* ==========================================
   Base Styles
   ========================================== */
*,
*::before,
*::after {
	box-sizing: border-box;
}

html {
	font-size: 16px;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
}

body {
	margin: 0;
	padding: 0;
	background: var(--color-background);
	color: var(--color-primary);
	font-family: var(--font-sans);
	min-height: 100vh;
	display: flex;
	flex-direction: column;
}

/* ==========================================
   Game Boy Frame Styling
   ========================================== */
.game-frame {
	background: linear-gradient(145deg, #8b8b8b 0%, #6b6b6b 50%, #4a4a4a 100%);
	border-radius: 12px;
	padding: 24px;
	box-shadow:
		inset 0 2px 4px rgba(255, 255, 255, 0.3),
		inset 0 -2px 4px rgba(0, 0, 0, 0.3),
		0 8px 32px rgba(0, 0, 0, 0.4);
}

.game-screen {
	background: var(--color-background);
	border: var(--game-border-width) solid var(--color-primary);
	border-radius: var(--game-border-radius);
	box-shadow:
		inset 0 0 20px rgba(15, 56, 15, 0.3),
		0 0 0 2px var(--gb-dark);
}

/* ==========================================
   Typography
   ========================================== */
.font-pixel {
	font-family: "Press Start 2P", monospace;
	letter-spacing: 0.05em;
}

.font-retro {
	font-family: "VT323", monospace;
	letter-spacing: 0.02em;
}

h1,
h2,
h3 {
	font-family: "Press Start 2P", monospace;
	text-transform: uppercase;
	line-height: 1.4;
}

/* ==========================================
   Button Styles
   ========================================== */
.btn {
	font-family: "Press Start 2P", monospace;
	font-size: 0.75rem;
	padding: 12px 24px;
	border: 3px solid var(--color-primary);
	background: var(--color-accent);
	color: var(--color-primary);
	cursor: pointer;
	text-transform: uppercase;
	transition: all 0.1s ease;
	position: relative;
	box-shadow:
		4px 4px 0 var(--color-primary),
		inset 0 2px 0 rgba(255, 255, 255, 0.2);
}

.btn:hover {
	background: var(--color-background);
	transform: translate(2px, 2px);
	box-shadow:
		2px 2px 0 var(--color-primary),
		inset 0 2px 0 rgba(255, 255, 255, 0.2);
}

.btn:active {
	transform: translate(4px, 4px);
	box-shadow:
		0 0 0 var(--color-primary),
		inset 0 2px 0 rgba(0, 0, 0, 0.1);
}

.btn:disabled {
	opacity: 0.5;
	cursor: not-allowed;
	transform: none;
}

.btn-secondary {
	background: var(--color-background);
}

.btn-small {
	font-size: 0.625rem;
	padding: 8px 16px;
}

/* ==========================================
   Input Styles
   ========================================== */
.input {
	font-family: "VT323", monospace;
	font-size: 1.25rem;
	padding: 12px 16px;
	border: 3px solid var(--color-primary);
	background: var(--color-background);
	color: var(--color-primary);
	outline: none;
	box-shadow:
		inset 2px 2px 0 var(--color-dark),
		inset -2px -2px 0 var(--color-accent);
}

.input:focus {
	box-shadow:
		inset 2px 2px 0 var(--color-dark),
		inset -2px -2px 0 var(--color-accent),
		0 0 0 2px var(--color-accent);
}

.input::placeholder {
	color: var(--color-secondary);
	opacity: 0.7;
}

/* ==========================================
   Card / Panel Styles
   ========================================== */
.card {
	background: var(--color-background);
	border: 3px solid var(--color-primary);
	padding: 20px;
	box-shadow: 4px 4px 0 var(--color-primary);
}

.card-header {
	font-family: "Press Start 2P", monospace;
	font-size: 0.875rem;
	padding-bottom: 12px;
	margin-bottom: 16px;
	border-bottom: 2px solid var(--color-secondary);
	text-transform: uppercase;
}

/* ==========================================
   Leaderboard Table
   ========================================== */
.leaderboard-table {
	width: 100%;
	border-collapse: separate;
	border-spacing: 0;
	font-family: "VT323", monospace;
	font-size: 1.125rem;
}

.leaderboard-table th {
	font-family: "Press Start 2P", monospace;
	font-size: 0.625rem;
	text-align: left;
	padding: 8px 12px;
	background: var(--color-secondary);
	color: var(--color-background);
	text-transform: uppercase;
}

.leaderboard-table td {
	padding: 10px 12px;
	border-bottom: 1px solid var(--color-secondary);
}

.leaderboard-table tr:nth-child(even) td {
	background: rgba(139, 172, 15, 0.2);
}

.leaderboard-table tr:hover td {
	background: rgba(139, 172, 15, 0.4);
}

/* ==========================================
   Screen Transitions
   ========================================== */
.screen-enter {
	opacity: 0;
	transform: scale(0.95);
}

.screen-enter-active {
	opacity: 1;
	transform: scale(1);
	transition:
		opacity 200ms ease-out,
		transform 200ms ease-out;
}

.screen-exit {
	opacity: 1;
	transform: scale(1);
}

.screen-exit-active {
	opacity: 0;
	transform: scale(0.95);
	transition:
		opacity 150ms ease-in,
		transform 150ms ease-in;
}

/* ==========================================
   Animations
   ========================================== */
@keyframes blink {
	0%,
	50% {
		opacity: 1;
	}
	51%,
	100% {
		opacity: 0;
	}
}

@keyframes pulse {
	0%,
	100% {
		transform: scale(1);
		opacity: 1;
	}
	50% {
		transform: scale(1.05);
		opacity: 0.8;
	}
}

@keyframes slideIn {
	from {
		opacity: 0;
		transform: translateY(-10px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.animate-blink {
	animation: blink 1s step-end infinite;
}

.animate-pulse-slow {
	animation: pulse 2s ease-in-out infinite;
}

.animate-slide-in {
	animation: slideIn 0.3s ease-out forwards;
}

/* ==========================================
   Utility Classes
   ========================================== */
.text-shadow-gb {
	text-shadow: 2px 2px 0 var(--color-secondary);
}

.border-gb {
	border: 3px solid var(--color-primary);
}

.shadow-gb {
	box-shadow: 4px 4px 0 var(--color-primary);
}

/* ==========================================
   High Contrast Mode
   ========================================== */
.high-contrast {
	--color-primary: var(--hc-foreground);
	--color-secondary: var(--hc-foreground);
	--color-accent: var(--hc-foreground);
	--color-background: var(--hc-background);
}

.high-contrast .game-screen {
	background: var(--hc-background);
	border-color: var(--hc-foreground);
}

.high-contrast .btn {
	background: var(--hc-background);
	border-color: var(--hc-foreground);
	color: var(--hc-foreground);
	box-shadow: 4px 4px 0 var(--hc-foreground);
}

.high-contrast .input {
	background: var(--hc-background);
	border-color: var(--hc-foreground);
	color: var(--hc-foreground);
}

/* ==========================================
   Game Canvas Container
   ========================================== */
.game-canvas-container {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--color-background);
}

.game-canvas {
	image-rendering: pixelated;
	image-rendering: crisp-edges;
}

/* ==========================================
   Loading States
   ========================================== */
.loading-dots::after {
	content: "";
	animation: dots 1.5s steps(4, end) infinite;
}

@keyframes dots {
	0%,
	20% {
		content: "";
	}
	40% {
		content: ".";
	}
	60% {
		content: "..";
	}
	80%,
	100% {
		content: "...";
	}
}

/* ==========================================
   Scrollbar Styling
   ========================================== */
::-webkit-scrollbar {
	width: 12px;
	height: 12px;
}

::-webkit-scrollbar-track {
	background: var(--color-background);
	border: 2px solid var(--color-secondary);
}

::-webkit-scrollbar-thumb {
	background: var(--color-secondary);
	border: 2px solid var(--color-background);
}

::-webkit-scrollbar-thumb:hover {
	background: var(--color-primary);
}

/* ==========================================
   Focus Visible (Accessibility)
   ========================================== */
:focus-visible {
	outline: 3px dashed var(--color-primary);
	outline-offset: 2px;
}

button:focus-visible,
a:focus-visible,
input:focus-visible {
	outline: 3px dashed var(--color-primary);
	outline-offset: 2px;
}
```

CSS gotowy z Game Boy stylem. Co dalej?

---

**User**

Przejdź do hooków i komponentów UI.

---

**Cursor**

Tworzę hooki React do zarządzania stanem gry:

```typescript
// ==========================================
// useLocalStorage Hook - Persistent state with localStorage
// ==========================================

"use client";

import { useState, useEffect, useCallback } from "react";

export function useLocalStorage<T>(
	key: string,
	initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
	// State to store our value
	const [storedValue, setStoredValue] = useState<T>(initialValue);
	const [isInitialized, setIsInitialized] = useState(false);

	// Load value from localStorage on mount
	useEffect(() => {
		if (typeof window === "undefined") return;

		try {
			const item = window.localStorage.getItem(key);
			if (item) {
				setStoredValue(JSON.parse(item));
			}
		} catch (error) {
			console.warn(`Error reading localStorage key "${key}":`, error);
		}
		setIsInitialized(true);
	}, [key]);

	// Return a wrapped version of useState's setter function that persists to localStorage
	const setValue = useCallback(
		(value: T | ((prev: T) => T)) => {
			try {
				// Allow value to be a function so we have same API as useState
				const valueToStore =
					value instanceof Function ? value(storedValue) : value;

				// Save state
				setStoredValue(valueToStore);

				// Save to localStorage
				if (typeof window !== "undefined") {
					window.localStorage.setItem(key, JSON.stringify(valueToStore));
				}
			} catch (error) {
				console.warn(`Error setting localStorage key "${key}":`, error);
			}
		},
		[key, storedValue]
	);

	// Return initialValue during SSR, actual value after hydration
	return [isInitialized ? storedValue : initialValue, setValue];
}
```

```typescript
// ==========================================
// useGameState Hook - Game state management
// ==========================================

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ScreenType, PlayerSettings, ReplayData } from "@/types";
import { GameEngine } from "@/game/engine";
import { loadReplay, hasReplay } from "@/game/replay";
import { useLocalStorage } from "./useLocalStorage";

const DEFAULT_SETTINGS: PlayerSettings = {
	soundEnabled: true,
	highContrastMode: false,
	foregroundColor: "#000000",
	backgroundColor: "#ffffff",
	nickname: "",
};

export interface GameStateHook {
	// Navigation
	currentScreen: ScreenType;
	setScreen: (screen: ScreenType) => void;

	// Game stats
	score: number;
	snakeLength: number;

	// Player settings
	settings: PlayerSettings;
	updateSettings: (updates: Partial<PlayerSettings>) => void;

	// Game engine
	initEngine: (canvas: HTMLCanvasElement) => Promise<void>;
	startGame: () => void;
	resetGame: () => void;
	destroyEngine: () => void;

	// Replay
	replayData: ReplayData | null;
	hasValidReplay: boolean;
	startReplay: () => void;
	stopReplay: () => void;

	// Final game stats (after game over)
	finalScore: number;
	finalLength: number;
}

export function useGameState(): GameStateHook {
	// Navigation state
	const [currentScreen, setCurrentScreen] = useState<ScreenType>("start");

	// Game stats
	const [score, setScore] = useState(0);
	const [snakeLength, setSnakeLength] = useState(3);
	const [finalScore, setFinalScore] = useState(0);
	const [finalLength, setFinalLength] = useState(3);

	// Replay state
	const [replayData, setReplayData] = useState<ReplayData | null>(null);
	const [hasValidReplay, setHasValidReplay] = useState(false);

	// Settings with localStorage persistence
	const [settings, setSettings] = useLocalStorage<PlayerSettings>(
		"snake_settings",
		DEFAULT_SETTINGS
	);

	// Game engine reference
	const engineRef = useRef<GameEngine | null>(null);

	// Check for valid replay on mount
	useEffect(() => {
		setHasValidReplay(hasReplay());
	}, [currentScreen]);

	// Initialize game engine
	const initEngine = useCallback(
		async (canvas: HTMLCanvasElement) => {
			// Destroy existing engine if any
			if (engineRef.current) {
				engineRef.current.destroy();
			}

			const engine = new GameEngine({
				onScoreChange: setScore,
				onLengthChange: setSnakeLength,
				onGameOver: (score, length) => {
					setFinalScore(score);
					setFinalLength(length);
					setHasValidReplay(true);
				},
				onStateChange: (status) => {
					if (status === "gameover") {
						setCurrentScreen("gameover");
					}
				},
			});

			await engine.init(canvas);
			engine.setMuted(!settings.soundEnabled);
			engineRef.current = engine;
		},
		[settings.soundEnabled]
	);

	// Start new game
	const startGame = useCallback(() => {
		if (!engineRef.current) return;

		setScore(0);
		setSnakeLength(3);
		engineRef.current.reset();
		engineRef.current.start();
		setCurrentScreen("game");
	}, []);

	// Reset game (without starting)
	const resetGame = useCallback(() => {
		if (!engineRef.current) return;
		engineRef.current.reset();
		setScore(0);
		setSnakeLength(3);
	}, []);

	// Destroy engine
	const destroyEngine = useCallback(() => {
		if (engineRef.current) {
			engineRef.current.destroy();
			engineRef.current = null;
		}
	}, []);

	// Start replay
	const startReplay = useCallback(() => {
		if (!engineRef.current) return;

		const replay = loadReplay();
		if (!replay) {
			console.warn("No valid replay data found");
			return;
		}

		setReplayData(replay);
		setScore(0);
		setSnakeLength(3);
		engineRef.current.startReplay(replay);
		setCurrentScreen("replay");
	}, []);

	// Stop replay
	const stopReplay = useCallback(() => {
		if (!engineRef.current) return;

		engineRef.current.stopReplay();
		setReplayData(null);
		setCurrentScreen("start");
	}, []);

	// Update settings
	const updateSettings = useCallback(
		(updates: Partial<PlayerSettings>) => {
			setSettings((prev) => ({ ...prev, ...updates }));

			// Apply sound setting to engine
			if (updates.soundEnabled !== undefined && engineRef.current) {
				engineRef.current.setMuted(!updates.soundEnabled);
			}
		},
		[setSettings]
	);

	// Set screen with proper navigation logic
	const setScreen = useCallback((screen: ScreenType) => {
		setCurrentScreen(screen);
	}, []);

	return {
		currentScreen,
		setScreen,
		score,
		snakeLength,
		settings,
		updateSettings,
		initEngine,
		startGame,
		resetGame,
		destroyEngine,
		replayData,
		hasValidReplay,
		startReplay,
		stopReplay,
		finalScore,
		finalLength,
	};
}
```

```typescript
// ==========================================
// Hooks Module Exports
// ==========================================

export { useLocalStorage } from "./useLocalStorage";
export { useGameState } from "./useGameState";
export type { GameStateHook } from "./useGameState";
```

Hooki gotowe - `useLocalStorage` do persystencji i `useGameState` do całego stanu gry.

---

**User**

Teraz komponenty UI - Button, Input, Card, Toggle, ColorPicker.

---

**Cursor**

Tworzę komponenty UI w stylu Game Boy:

```typescriptreact
// ==========================================
// Button Component - Game Boy styled button
// ==========================================

'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'default' | 'small';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'default', children, ...props }, ref) => {
    const variantClass = variant === 'secondary' ? 'btn-secondary' : '';
    const sizeClass = size === 'small' ? 'btn-small' : '';

    return (
      <button
        ref={ref}
        className={`btn ${variantClass} ${sizeClass} ${className}`.trim()}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

```

```typescriptreact
// ==========================================
// Input Component - Game Boy styled input field
// ==========================================

'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={inputId}
            className="font-pixel text-xs text-gb-darkest uppercase"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`input w-full ${className}`.trim()}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';

```

```typescriptreact
// ==========================================
// Card Component - Game Boy styled container
// ==========================================

'use client';

import type { ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export function Card({ children, title, className = '' }: CardProps) {
  return (
    <div className={`card ${className}`.trim()}>
      {title && <div className="card-header">{title}</div>}
      {children}
    </div>
  );
}

```

```typescriptreact
// ==========================================
// Toggle Component - Game Boy styled switch
// ==========================================

'use client';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
}

export function Toggle({ checked, onChange, label, id }: ToggleProps) {
  const toggleId = id || `toggle-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <label
      htmlFor={toggleId}
      className="flex items-center gap-3 cursor-pointer select-none"
    >
      <div className="relative">
        <input
          type="checkbox"
          id={toggleId}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div
          className={`
            w-14 h-8 border-3 border-gb-darkest
            transition-colors duration-150
            ${checked ? 'bg-gb-light' : 'bg-gb-lightest'}
          `}
        >
          <div
            className={`
              absolute top-1 w-5 h-5 bg-gb-darkest
              transition-transform duration-150
              ${checked ? 'translate-x-7' : 'translate-x-1'}
            `}
          />
        </div>
      </div>
      {label && (
        <span className="font-pixel text-xs text-gb-darkest uppercase">
          {label}
        </span>
      )}
    </label>
  );
}

```

```typescriptreact
// ==========================================
// ColorPicker Component - Simple color input with preview
// ==========================================

'use client';

export interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  id?: string;
}

export function ColorPicker({ value, onChange, label, id }: ColorPickerProps) {
  const pickerId = id || `color-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label
          htmlFor={pickerId}
          className="font-pixel text-xs text-gb-darkest uppercase"
        >
          {label}
        </label>
      )}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 border-3 border-gb-darkest"
          style={{ backgroundColor: value }}
        />
        <input
          type="color"
          id={pickerId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 h-10 border-3 border-gb-darkest cursor-pointer bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input w-28 text-sm"
          pattern="^#[0-9A-Fa-f]{6}$"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

```

```typescript
// ==========================================
// UI Components Module Exports
// ==========================================

export { Button } from "./Button";
export type { ButtonProps } from "./Button";

export { Input } from "./Input";
export type { InputProps } from "./Input";

export { Card } from "./Card";
export type { CardProps } from "./Card";

export { Toggle } from "./Toggle";
export type { ToggleProps } from "./Toggle";

export { ColorPicker } from "./ColorPicker";
export type { ColorPickerProps } from "./ColorPicker";
```

Komponenty UI gotowe. Są reużywalne i trzymają się Game Boy estetyki.

---

**User**

Dodaj jeszcze komponenty GameCanvas, ScoreDisplay i MuteButton, a potem ekrany.

---

**Cursor**

Tworzę komponenty związane z grą:

```typescriptreact
// ==========================================
// GameCanvas Component - PixiJS canvas wrapper
// ==========================================

'use client';

import { useRef, useEffect, useCallback } from 'react';
import { GRID_SIZE } from '@/lib/constants';

export interface GameCanvasProps {
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
  size?: number;
}

export function GameCanvas({ onCanvasReady, size = 400 }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isInitialized = useRef(false);

  const initCanvas = useCallback(() => {
    if (!canvasRef.current || isInitialized.current) return;

    const canvas = canvasRef.current;

    // Set canvas size to match grid perfectly
    const cellSize = Math.floor(size / GRID_SIZE);
    const actualSize = cellSize * GRID_SIZE;

    canvas.width = actualSize;
    canvas.height = actualSize;

    isInitialized.current = true;
    onCanvasReady(canvas);
  }, [onCanvasReady, size]);

  useEffect(() => {
    initCanvas();

    return () => {
      isInitialized.current = false;
    };
  }, [initCanvas]);

  return (
    <div className="game-canvas-container game-screen">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        style={{
          width: size,
          height: size,
        }}
      />
    </div>
  );
}

```

```typescriptreact
// ==========================================
// ScoreDisplay Component - Shows current score and length
// ==========================================

'use client';

export interface ScoreDisplayProps {
  score: number;
  length: number;
}

export function ScoreDisplay({ score, length }: ScoreDisplayProps) {
  return (
    <div className="flex justify-between items-center w-full px-2 py-3">
      <div className="flex flex-col items-start">
        <span className="font-pixel text-[10px] text-gb-dark uppercase opacity-80">
          Score
        </span>
        <span className="font-pixel text-lg text-gb-darkest">
          {score.toString().padStart(5, '0')}
        </span>
      </div>

      <div className="flex flex-col items-end">
        <span className="font-pixel text-[10px] text-gb-dark uppercase opacity-80">
          Length
        </span>
        <span className="font-pixel text-lg text-gb-darkest">
          {length.toString().padStart(3, '0')}
        </span>
      </div>
    </div>
  );
}

```

```typescriptreact
// ==========================================
// MuteButton Component - Toggle sound on/off
// ==========================================

'use client';

export interface MuteButtonProps {
  muted: boolean;
  onToggle: () => void;
}

export function MuteButton({ muted, onToggle }: MuteButtonProps) {
  return (
    <button
      onClick={onToggle}
      className="
        w-10 h-10 flex items-center justify-center
        border-2 border-gb-darkest bg-gb-lightest
        hover:bg-gb-light transition-colors
        focus:outline-none focus-visible:ring-2 focus-visible:ring-gb-darkest
      "
      aria-label={muted ? 'Unmute sound' : 'Mute sound'}
      title={muted ? 'Unmute sound' : 'Mute sound'}
    >
      {muted ? (
        // Muted icon (speaker with X)
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5 text-gb-darkest"
        >
          <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM17.78 9.22a.75.75 0 10-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 001.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 101.06-1.06L20.56 12l1.72-1.72a.75.75 0 00-1.06-1.06l-1.72 1.72-1.72-1.72z" />
        </svg>
      ) : (
        // Sound on icon (speaker with waves)
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5 text-gb-darkest"
        >
          <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 01-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
          <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
        </svg>
      )}
    </button>
  );
}

```

```typescript
// ==========================================
// Game Components Module Exports
// ==========================================

export { GameCanvas } from "./GameCanvas";
export type { GameCanvasProps } from "./GameCanvas";

export { ScoreDisplay } from "./ScoreDisplay";
export type { ScoreDisplayProps } from "./ScoreDisplay";

export { MuteButton } from "./MuteButton";
export type { MuteButtonProps } from "./MuteButton";
```

Komponenty gry gotowe. Teraz możemy przejść do ekranów.

---

**User**

Stwórz ekrany - StartScreen, GameScreen, GameOverScreen i pozostałe.

---

**Cursor**

Tworzę wszystkie ekrany gry:

```typescriptreact
// ==========================================
// StartScreen Component - Main menu
// ==========================================

'use client';

import { useState } from 'react';
import { Button, Input } from '@/components/ui';

export interface StartScreenProps {
  nickname: string;
  onNicknameChange: (nickname: string) => void;
  onStartGame: () => void;
  onOpenSettings: () => void;
  onOpenLeaderboard: () => void;
}

export function StartScreen({
  nickname,
  onNicknameChange,
  onStartGame,
  onOpenSettings,
  onOpenLeaderboard,
}: StartScreenProps) {
  const [localNickname, setLocalNickname] = useState(nickname);

  const handleNicknameChange = (value: string) => {
    const trimmed = value.slice(0, 100);
    setLocalNickname(trimmed);
    onNicknameChange(trimmed);
  };

  return (
    <div className="flex flex-col items-center gap-8 p-8 animate-slide-in">
      {/* Title */}
      <div className="text-center">
        <h1 className="font-pixel text-2xl text-gb-darkest text-shadow-gb mb-2">
          SNAKE
        </h1>
        <p className="font-pixel text-[10px] text-gb-dark">
          GAME BOY EDITION
        </p>
      </div>

      {/* Snake ASCII Art */}
      <div className="font-retro text-xl text-gb-dark leading-none whitespace-pre">
{`  ████████
 █        █
█  ●    ●  █
█          █
 █   ██   █
  ████████`}
      </div>

      {/* Nickname Input */}
      <div className="w-full max-w-xs">
        <Input
          label="Enter your name"
          placeholder="Anonymous"
          value={localNickname}
          onChange={(e) => handleNicknameChange(e.target.value)}
          maxLength={100}
          autoFocus
        />
      </div>

      {/* Menu Buttons */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Button onClick={onStartGame}>
          Start Game
        </Button>

        <Button variant="secondary" onClick={onOpenLeaderboard}>
          Leaderboard
        </Button>

        <Button variant="secondary" onClick={onOpenSettings}>
          Settings
        </Button>
      </div>

      {/* Controls hint */}
      <div className="text-center mt-4">
        <p className="font-pixel text-[8px] text-gb-dark opacity-70">
          USE ARROW KEYS OR WASD TO MOVE
        </p>
      </div>
    </div>
  );
}

```

```typescriptreact
// ==========================================
// GameScreen Component - Active gameplay screen
// ==========================================

'use client';

import { useCallback } from 'react';
import { GameCanvas, ScoreDisplay, MuteButton } from '@/components/game';

export interface GameScreenProps {
  score: number;
  length: number;
  muted: boolean;
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
  onToggleMute: () => void;
}

export function GameScreen({
  score,
  length,
  muted,
  onCanvasReady,
  onToggleMute,
}: GameScreenProps) {
  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    onCanvasReady(canvas);
  }, [onCanvasReady]);

  return (
    <div className="flex flex-col items-center gap-4 p-4 animate-slide-in">
      {/* Header with score and mute */}
      <div className="w-full max-w-[400px] flex items-center justify-between">
        <ScoreDisplay score={score} length={length} />
        <MuteButton muted={muted} onToggle={onToggleMute} />
      </div>

      {/* Game Canvas */}
      <GameCanvas onCanvasReady={handleCanvasReady} size={400} />

      {/* Instructions */}
      <div className="text-center">
        <p className="font-pixel text-[8px] text-gb-dark opacity-60">
          ARROW KEYS / WASD TO MOVE
        </p>
      </div>
    </div>
  );
}

```

```typescriptreact
// ==========================================
// GameOverScreen Component - End game results and actions
// ==========================================

'use client';

import { useState, useCallback } from 'react';
import { Button, Input, Card } from '@/components/ui';

export interface GameOverScreenProps {
  score: number;
  length: number;
  nickname: string;
  hasReplay: boolean;
  onNicknameChange: (nickname: string) => void;
  onSaveScore: () => Promise<{ success: boolean; error?: string }>;
  onPlayAgain: () => void;
  onWatchReplay: () => void;
  onViewLeaderboard: () => void;
  onReturnToMenu: () => void;
}

export function GameOverScreen({
  score,
  length,
  nickname,
  hasReplay,
  onNicknameChange,
  onSaveScore,
  onPlayAgain,
  onWatchReplay,
  onViewLeaderboard,
  onReturnToMenu,
}: GameOverScreenProps) {
  const [localNickname, setLocalNickname] = useState(nickname);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [scoreSaved, setScoreSaved] = useState(false);

  const handleNicknameChange = (value: string) => {
    const trimmed = value.slice(0, 100);
    setLocalNickname(trimmed);
    onNicknameChange(trimmed);
  };

  const handleSaveScore = useCallback(async () => {
    if (scoreSaved || isSaving) return;

    setIsSaving(true);
    setSaveResult(null);

    try {
      const result = await onSaveScore();
      setSaveResult(result);
      if (result.success) {
        setScoreSaved(true);
      }
    } catch {
      setSaveResult({ success: false, error: 'Network error. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  }, [onSaveScore, scoreSaved, isSaving]);

  return (
    <div className="flex flex-col items-center gap-6 p-6 animate-slide-in">
      {/* Game Over Title */}
      <h1 className="font-pixel text-xl text-gb-darkest text-shadow-gb">
        GAME OVER
      </h1>

      {/* Score Card */}
      <Card className="w-full max-w-xs text-center">
        <div className="flex flex-col gap-4">
          <div>
            <p className="font-pixel text-[10px] text-gb-dark uppercase mb-1">
              Final Score
            </p>
            <p className="font-pixel text-3xl text-gb-darkest">
              {score.toString().padStart(5, '0')}
            </p>
          </div>

          <div>
            <p className="font-pixel text-[10px] text-gb-dark uppercase mb-1">
              Snake Length
            </p>
            <p className="font-pixel text-xl text-gb-darkest">
              {length}
            </p>
          </div>
        </div>
      </Card>

      {/* Nickname Input */}
      <div className="w-full max-w-xs">
        <Input
          label="Your Name"
          placeholder="Anonymous"
          value={localNickname}
          onChange={(e) => handleNicknameChange(e.target.value)}
          maxLength={100}
        />
      </div>

      {/* Save Score Result */}
      {saveResult && (
        <div
          className={`
            font-pixel text-[10px] px-4 py-2 border-2
            ${saveResult.success
              ? 'border-gb-dark bg-gb-light text-gb-darkest'
              : 'border-red-600 bg-red-100 text-red-800'
            }
          `}
        >
          {saveResult.success ? 'Score saved!' : saveResult.error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button
          onClick={handleSaveScore}
          disabled={scoreSaved || isSaving}
        >
          {isSaving ? 'Saving...' : scoreSaved ? 'Saved!' : 'Save Score'}
        </Button>

        <Button variant="secondary" onClick={onPlayAgain}>
          Play Again
        </Button>

        <Button
          variant="secondary"
          onClick={onWatchReplay}
          disabled={!hasReplay}
        >
          Watch Replay
        </Button>

        <Button variant="secondary" onClick={onViewLeaderboard}>
          Leaderboard
        </Button>

        <Button variant="secondary" size="small" onClick={onReturnToMenu}>
          Main Menu
        </Button>
      </div>
    </div>
  );
}

```

```typescriptreact
// ==========================================
// SettingsScreen Component - Game settings and accessibility
// ==========================================

'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Toggle, ColorPicker } from '@/components/ui';
import type { PlayerSettings } from '@/types';

export interface SettingsScreenProps {
  settings: PlayerSettings;
  onSave: (settings: PlayerSettings) => void;
  onBack: () => void;
}

export function SettingsScreen({ settings, onSave, onBack }: SettingsScreenProps) {
  const [localSettings, setLocalSettings] = useState<PlayerSettings>(settings);
  const [showSaved, setShowSaved] = useState(false);

  // Sync with prop changes
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSave(localSettings);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const updateSetting = <K extends keyof PlayerSettings>(
    key: K,
    value: PlayerSettings[K]
  ) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    setShowSaved(false);
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 animate-slide-in">
      {/* Title */}
      <h1 className="font-pixel text-xl text-gb-darkest text-shadow-gb">
        SETTINGS
      </h1>

      {/* Settings Cards */}
      <div className="flex flex-col gap-4 w-full max-w-sm">
        {/* Sound Settings */}
        <Card title="Audio">
          <Toggle
            checked={localSettings.soundEnabled}
            onChange={(checked) => updateSetting('soundEnabled', checked)}
            label="Sound Effects"
          />
        </Card>

        {/* Accessibility Settings */}
        <Card title="Accessibility">
          <div className="flex flex-col gap-4">
            <Toggle
              checked={localSettings.highContrastMode}
              onChange={(checked) => updateSetting('highContrastMode', checked)}
              label="High Contrast Mode"
            />

            {localSettings.highContrastMode && (
              <div className="flex flex-col gap-4 pt-4 border-t-2 border-gb-dark">
                <ColorPicker
                  label="Foreground Color"
                  value={localSettings.foregroundColor}
                  onChange={(color) => updateSetting('foregroundColor', color)}
                />

                <ColorPicker
                  label="Background Color"
                  value={localSettings.backgroundColor}
                  onChange={(color) => updateSetting('backgroundColor', color)}
                />

                {/* Preview */}
                <div className="mt-2">
                  <p className="font-pixel text-[10px] text-gb-dark uppercase mb-2">
                    Preview
                  </p>
                  <div
                    className="w-full h-20 border-2 border-gb-darkest flex items-center justify-center"
                    style={{ backgroundColor: localSettings.backgroundColor }}
                  >
                    <div
                      className="w-8 h-8"
                      style={{ backgroundColor: localSettings.foregroundColor }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Save Confirmation */}
      {showSaved && (
        <div className="font-pixel text-[10px] text-gb-darkest bg-gb-light px-4 py-2 border-2 border-gb-dark">
          Settings saved!
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
        <Button onClick={handleSave}>
          Save Settings
        </Button>

        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}

```

```typescriptreact
// ==========================================
// LeaderboardScreen Component - Top 10 scores display
// ==========================================

'use client';

import { useState, useEffect } from 'react';
import { Button, Card } from '@/components/ui';
import type { LeaderboardEntry } from '@/types';

export interface LeaderboardScreenProps {
  onBack: () => void;
}

export function LeaderboardScreen({ onBack }: LeaderboardScreenProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/leaderboard');
        const data = await response.json();

        if (data.success) {
          setEntries(data.data);
        } else {
          setError(data.error || 'Failed to load leaderboard');
        }
      } catch {
        setError('Network error. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 animate-slide-in">
      {/* Title */}
      <h1 className="font-pixel text-xl text-gb-darkest text-shadow-gb">
        LEADERBOARD
      </h1>

      {/* Leaderboard Table */}
      <Card className="w-full max-w-md overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="font-pixel text-sm text-gb-dark">
              Loading<span className="loading-dots"></span>
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <p className="font-pixel text-sm text-red-600">{error}</p>
            <Button size="small" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="font-pixel text-sm text-gb-dark text-center">
              No scores yet.<br />Be the first!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Score</th>
                  <th>Len</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={entry.id}>
                    <td className="font-pixel text-sm">
                      {index + 1}
                    </td>
                    <td className="font-retro text-lg truncate max-w-[120px]">
                      {entry.nick || 'Anonymous'}
                    </td>
                    <td className="font-pixel text-sm text-gb-darkest">
                      {entry.score.toLocaleString()}
                    </td>
                    <td className="font-pixel text-sm">
                      {entry.snakeLength}
                    </td>
                    <td className="font-retro text-sm text-gb-dark">
                      {formatDate(entry.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Back Button */}
      <div className="w-full max-w-xs">
        <Button variant="secondary" onClick={onBack} className="w-full">
          Back
        </Button>
      </div>
    </div>
  );
}

```

```typescriptreact
// ==========================================
// ReplayScreen Component - Replay playback view
// ==========================================

'use client';

import { GameCanvas, ScoreDisplay } from '@/components/game';
import { Button } from '@/components/ui';
import type { ReplayData } from '@/types';

export interface ReplayScreenProps {
  replayData: ReplayData | null;
  score: number;
  length: number;
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
  onCancel: () => void;
}

export function ReplayScreen({
  replayData,
  score,
  length,
  onCanvasReady,
  onCancel,
}: ReplayScreenProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 animate-slide-in">
      {/* Replay Header */}
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        <h2 className="font-pixel text-sm text-gb-darkest">REPLAY</h2>
      </div>

      {/* Replay Info */}
      {replayData && (
        <p className="font-pixel text-[8px] text-gb-dark">
          {formatDate(replayData.timestamp)} • Final: {replayData.finalScore} pts
        </p>
      )}

      {/* Score Display */}
      <div className="w-full max-w-[400px]">
        <ScoreDisplay score={score} length={length} />
      </div>

      {/* Game Canvas */}
      <GameCanvas onCanvasReady={onCanvasReady} size={400} />

      {/* Cancel Button */}
      <Button variant="secondary" size="small" onClick={onCancel}>
        Stop Replay
      </Button>
    </div>
  );
}

```

```typescript
// ==========================================
// Screen Components Module Exports
// ==========================================

export { StartScreen } from "./StartScreen";
export type { StartScreenProps } from "./StartScreen";

export { GameScreen } from "./GameScreen";
export type { GameScreenProps } from "./GameScreen";

export { GameOverScreen } from "./GameOverScreen";
export type { GameOverScreenProps } from "./GameOverScreen";

export { SettingsScreen } from "./SettingsScreen";
export type { SettingsScreenProps } from "./SettingsScreen";

export { LeaderboardScreen } from "./LeaderboardScreen";
export type { LeaderboardScreenProps } from "./LeaderboardScreen";

export { ReplayScreen } from "./ReplayScreen";
export type { ReplayScreenProps } from "./ReplayScreen";
```

```typescript
// ==========================================
// Components Module Exports
// ==========================================

// UI Components
export * from "./ui";

// Game Components
export * from "./game";

// Screen Components
export * from "./screens";
```

Wszystkie ekrany i eksporty gotowe. Mamy kompletną strukturę komponentów.

---

**User**

Stwórz teraz layout.tsx i page.tsx - główne pliki aplikacji.

---

**Cursor**

Tworzę główne pliki Next.js - layout z fontami i page z logiką nawigacji:

```typescriptreact
import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";

// Game Boy pixel font
const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

// Retro terminal font for larger text
const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-retro",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Snake Game - Game Boy Edition",
  description: "Classic Snake game with a nostalgic Game Boy aesthetic. Play, compete on the leaderboard, and watch your replays!",
  keywords: ["snake", "game", "retro", "game boy", "arcade", "classic"],
  authors: [{ name: "Snake Game" }],
  openGraph: {
    title: "Snake Game - Game Boy Edition",
    description: "Classic Snake game with Game Boy aesthetics",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${pressStart2P.variable} ${vt323.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

```

```typescriptreact
// ==========================================
// Main Page - Snake Game Entry Point
// ==========================================

'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import {
  StartScreen,
  GameScreen,
  GameOverScreen,
  SettingsScreen,
  LeaderboardScreen,
  ReplayScreen,
} from '@/components/screens';
import { useGameState } from '@/hooks';
import type { ScreenType } from '@/types';

export default function Home() {
  const {
    currentScreen,
    setScreen,
    score,
    snakeLength,
    settings,
    updateSettings,
    initEngine,
    startGame,
    resetGame,
    destroyEngine,
    replayData,
    hasValidReplay,
    startReplay,
    stopReplay,
    finalScore,
    finalLength,
  } = useGameState();

  // Track previous screen for back navigation
  const previousScreenRef = useRef<ScreenType>('start');
  const [isMounted, setIsMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Track screen changes for back navigation
  useEffect(() => {
    if (currentScreen !== 'settings' && currentScreen !== 'leaderboard') {
      previousScreenRef.current = currentScreen;
    }
  }, [currentScreen]);

  // Canvas ready handler
  const handleCanvasReady = useCallback(async (canvas: HTMLCanvasElement) => {
    await initEngine(canvas);

    // Auto-start for game and replay screens
    if (currentScreen === 'game') {
      startGame();
    }
  }, [initEngine, currentScreen, startGame]);

  // Save score to leaderboard
  const handleSaveScore = useCallback(async () => {
    try {
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nick: settings.nickname || 'Anonymous',
          score: finalScore,
          snakeLength: finalLength,
        }),
      });

      const data = await response.json();
      return data;
    } catch {
      return { success: false, error: 'Network error' };
    }
  }, [settings.nickname, finalScore, finalLength]);

  // Navigation handlers
  const handleStartGame = useCallback(() => {
    setScreen('game');
  }, [setScreen]);

  const handlePlayAgain = useCallback(() => {
    resetGame();
    setScreen('game');
  }, [resetGame, setScreen]);

  const handleWatchReplay = useCallback(() => {
    startReplay();
  }, [startReplay]);

  const handleStopReplay = useCallback(() => {
    stopReplay();
  }, [stopReplay]);

  const handleBackNavigation = useCallback(() => {
    // Return to appropriate screen based on context
    const target = previousScreenRef.current === 'gameover' ? 'gameover' : 'start';
    setScreen(target);
  }, [setScreen]);

  const handleReturnToMenu = useCallback(() => {
    destroyEngine();
    setScreen('start');
  }, [destroyEngine, setScreen]);

  // Toggle mute
  const handleToggleMute = useCallback(() => {
    updateSettings({ soundEnabled: !settings.soundEnabled });
  }, [settings.soundEnabled, updateSettings]);

  // Apply high contrast mode
  const containerClasses = settings.highContrastMode ? 'high-contrast' : '';
  const customStyles = settings.highContrastMode
    ? {
        '--hc-foreground': settings.foregroundColor,
        '--hc-background': settings.backgroundColor,
      } as React.CSSProperties
    : {};

  // Prevent SSR hydration issues
  if (!isMounted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gb-lightest">
        <div className="font-pixel text-gb-darkest">Loading...</div>
      </main>
    );
  }

  return (
    <main
      className={`min-h-screen flex items-center justify-center bg-gb-lightest ${containerClasses}`}
      style={customStyles}
    >
      <div className="game-frame">
        <div className="game-screen min-w-[420px] min-h-[520px] flex items-center justify-center">
          {/* Start Screen */}
          {currentScreen === 'start' && (
            <StartScreen
              nickname={settings.nickname}
              onNicknameChange={(nick) => updateSettings({ nickname: nick })}
              onStartGame={handleStartGame}
              onOpenSettings={() => setScreen('settings')}
              onOpenLeaderboard={() => setScreen('leaderboard')}
            />
          )}

          {/* Game Screen */}
          {currentScreen === 'game' && (
            <GameScreen
              score={score}
              length={snakeLength}
              muted={!settings.soundEnabled}
              onCanvasReady={handleCanvasReady}
              onToggleMute={handleToggleMute}
            />
          )}

          {/* Game Over Screen */}
          {currentScreen === 'gameover' && (
            <GameOverScreen
              score={finalScore}
              length={finalLength}
              nickname={settings.nickname}
              hasReplay={hasValidReplay}
              onNicknameChange={(nick) => updateSettings({ nickname: nick })}
              onSaveScore={handleSaveScore}
              onPlayAgain={handlePlayAgain}
              onWatchReplay={handleWatchReplay}
              onViewLeaderboard={() => setScreen('leaderboard')}
              onReturnToMenu={handleReturnToMenu}
            />
          )}

          {/* Settings Screen */}
          {currentScreen === 'settings' && (
            <SettingsScreen
              settings={settings}
              onSave={(newSettings) => updateSettings(newSettings)}
              onBack={handleBackNavigation}
            />
          )}

          {/* Leaderboard Screen */}
          {currentScreen === 'leaderboard' && (
            <LeaderboardScreen onBack={handleBackNavigation} />
          )}

          {/* Replay Screen */}
          {currentScreen === 'replay' && (
            <ReplayScreen
              replayData={replayData}
              score={score}
              length={snakeLength}
              onCanvasReady={handleCanvasReady}
              onCancel={handleStopReplay}
            />
          )}
        </div>
      </div>
    </main>
  );
}

```

Layout i page gotowe. Sprawdź czy wszystko działa.

---

**User**

Uruchomiłem `npm run dev` i widzę ekran startowy - wygląda super! Ale po kliknięciu "Start Game" gra od razu przechodzi do ekranu "Game Over". Coś jest nie tak.

---

**Cursor**

To wygląda na problem z inicjalizacją silnika gry. Sprawdzę kod:

```typescriptreact
const handleCanvasReady = useCallback(async (canvas: HTMLCanvasElement) => {
  await initEngine(canvas);

  // Auto-start for game and replay screens
  if (currentScreen === 'game') {
    startGame();
  }
}, [initEngine, currentScreen, startGame]);
```

Widzę że gra przeszła bezpośrednio do ekranu "Game Over". To wskazuje na problem z inicjalizacją silnika gry. Sprawdzę logi serwera i naprawię problem:

```typescriptreact
const handleCanvasReady = useCallback(async (canvas: HTMLCanvasElement) => {
  await initEngine(canvas);

  // Auto-start for game and replay screens
  if (currentScreen === 'game') {
    startGame();
  }
}, [initEngine, currentScreen, startGame]);
```

```typescriptreact
const handleStartGame = useCallback(() => {
  setScreen('game');
}, [setScreen]);
```

Widzę problem. W `handleCanvasReady` callback ma zamknięcie (closure) ze starą wartością `currentScreen`. Naprawię to:

```typescriptreact
// ==========================================
// Main Page - Snake Game Entry Point
// ==========================================

'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import {
  StartScreen,
  GameScreen,
  GameOverScreen,
  SettingsScreen,
  LeaderboardScreen,
  ReplayScreen,
} from '@/components/screens';
import { useGameState } from '@/hooks';
import type { ScreenType } from '@/types';

export default function Home() {
  const {
    currentScreen,
    setScreen,
    score,
    snakeLength,
    settings,
    updateSettings,
    initEngine,
    startGame,
    resetGame,
    destroyEngine,
    replayData,
    hasValidReplay,
    startReplay,
    stopReplay,
    finalScore,
    finalLength,
  } = useGameState();

  // Track previous screen for back navigation
  const previousScreenRef = useRef<ScreenType>('start');
  const [isMounted, setIsMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Track screen changes for back navigation
  useEffect(() => {
    if (currentScreen !== 'settings' && currentScreen !== 'leaderboard') {
      previousScreenRef.current = currentScreen;
    }
  }, [currentScreen]);

  // Canvas ready handler - starts game automatically since canvas is only rendered on game/replay screens
  const handleCanvasReady = useCallback(async (canvas: HTMLCanvasElement) => {
    await initEngine(canvas);
    // Engine is initialized, start the game
    startGame();
  }, [initEngine, startGame]);

  // Save score to leaderboard
  const handleSaveScore = useCallback(async () => {
    try {
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nick: settings.nickname || 'Anonymous',
          score: finalScore,
          snakeLength: finalLength,
        }),
      });

      const data = await response.json();
      return data;
    } catch {
      return { success: false, error: 'Network error' };
    }
  }, [settings.nickname, finalScore, finalLength]);

  // Navigation handlers
  const handleStartGame = useCallback(() => {
    setScreen('game');
  }, [setScreen]);

  const handlePlayAgain = useCallback(() => {
    resetGame();
    setScreen('game');
  }, [resetGame, setScreen]);

  const handleWatchReplay = useCallback(() => {
    startReplay();
  }, [startReplay]);

  const handleStopReplay = useCallback(() => {
    stopReplay();
  }, [stopReplay]);

  const handleBackNavigation = useCallback(() => {
    // Return to appropriate screen based on context
    const target = previousScreenRef.current === 'gameover' ? 'gameover' : 'start';
    setScreen(target);
  }, [setScreen]);

  const handleReturnToMenu = useCallback(() => {
    destroyEngine();
    setScreen('start');
  }, [destroyEngine, setScreen]);

  // Toggle mute
  const handleToggleMute = useCallback(() => {
    updateSettings({ soundEnabled: !settings.soundEnabled });
  }, [settings.soundEnabled, updateSettings]);

  // Apply high contrast mode
  const containerClasses = settings.highContrastMode ? 'high-contrast' : '';
  const customStyles = settings.highContrastMode
    ? {
        '--hc-foreground': settings.foregroundColor,
        '--hc-background': settings.backgroundColor,
      } as React.CSSProperties
    : {};

  // Prevent SSR hydration issues
  if (!isMounted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gb-lightest">
        <div className="font-pixel text-gb-darkest">Loading...</div>
      </main>
    );
  }

  return (
    <main
      className={`min-h-screen flex items-center justify-center bg-gb-lightest ${containerClasses}`}
      style={customStyles}
    >
      <div className="game-frame">
        <div className="game-screen min-w-[420px] min-h-[520px] flex items-center justify-center">
          {/* Start Screen */}
          {currentScreen === 'start' && (
            <StartScreen
              nickname={settings.nickname}
              onNicknameChange={(nick) => updateSettings({ nickname: nick })}
              onStartGame={handleStartGame}
              onOpenSettings={() => setScreen('settings')}
              onOpenLeaderboard={() => setScreen('leaderboard')}
            />
          )}

          {/* Game Screen */}
          {currentScreen === 'game' && (
            <GameScreen
              score={score}
              length={snakeLength}
              muted={!settings.soundEnabled}
              onCanvasReady={handleCanvasReady}
              onToggleMute={handleToggleMute}
            />
          )}

          {/* Game Over Screen */}
          {currentScreen === 'gameover' && (
            <GameOverScreen
              score={finalScore}
              length={finalLength}
              nickname={settings.nickname}
              hasReplay={hasValidReplay}
              onNicknameChange={(nick) => updateSettings({ nickname: nick })}
              onSaveScore={handleSaveScore}
              onPlayAgain={handlePlayAgain}
              onWatchReplay={handleWatchReplay}
              onViewLeaderboard={() => setScreen('leaderboard')}
              onReturnToMenu={handleReturnToMenu}
            />
          )}

          {/* Settings Screen */}
          {currentScreen === 'settings' && (
            <SettingsScreen
              settings={settings}
              onSave={(newSettings) => updateSettings(newSettings)}
              onBack={handleBackNavigation}
            />
          )}

          {/* Leaderboard Screen */}
          {currentScreen === 'leaderboard' && (
            <LeaderboardScreen onBack={handleBackNavigation} />
          )}

          {/* Replay Screen */}
          {currentScreen === 'replay' && (
            <ReplayScreen
              replayData={replayData}
              score={score}
              length={snakeLength}
              onCanvasReady={handleCanvasReady}
              onCancel={handleStopReplay}
            />
          )}
        </div>
      </div>
    </main>
  );
}

```

Naprawię również `startGame` w hooku, żeby nie nadpisywał ekranu:

```typescript
// ==========================================
// useGameState Hook - Game state management
// ==========================================

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ScreenType, PlayerSettings, ReplayData } from "@/types";
import { GameEngine } from "@/game/engine";
import { loadReplay, hasReplay } from "@/game/replay";
import { useLocalStorage } from "./useLocalStorage";

const DEFAULT_SETTINGS: PlayerSettings = {
	soundEnabled: true,
	highContrastMode: false,
	foregroundColor: "#000000",
	backgroundColor: "#ffffff",
	nickname: "",
};

export interface GameStateHook {
	// Navigation
	currentScreen: ScreenType;
	setScreen: (screen: ScreenType) => void;

	// Game stats
	score: number;
	snakeLength: number;

	// Player settings
	settings: PlayerSettings;
	updateSettings: (updates: Partial<PlayerSettings>) => void;

	// Game engine
	initEngine: (canvas: HTMLCanvasElement) => Promise<void>;
	startGame: () => void;
	resetGame: () => void;
	destroyEngine: () => void;

	// Replay
	replayData: ReplayData | null;
	hasValidReplay: boolean;
	startReplay: () => void;
	stopReplay: () => void;

	// Final game stats (after game over)
	finalScore: number;
	finalLength: number;
}

export function useGameState(): GameStateHook {
	// Navigation state
	const [currentScreen, setCurrentScreen] = useState<ScreenType>("start");

	// Game stats
	const [score, setScore] = useState(0);
	const [snakeLength, setSnakeLength] = useState(3);
	const [finalScore, setFinalScore] = useState(0);
	const [finalLength, setFinalLength] = useState(3);

	// Replay state
	const [replayData, setReplayData] = useState<ReplayData | null>(null);
	const [hasValidReplay, setHasValidReplay] = useState(false);

	// Settings with localStorage persistence
	const [settings, setSettings] = useLocalStorage<PlayerSettings>(
		"snake_settings",
		DEFAULT_SETTINGS
	);

	// Game engine reference
	const engineRef = useRef<GameEngine | null>(null);

	// Check for valid replay on mount
	useEffect(() => {
		setHasValidReplay(hasReplay());
	}, [currentScreen]);

	// Initialize game engine
	const initEngine = useCallback(
		async (canvas: HTMLCanvasElement) => {
			// Destroy existing engine if any
			if (engineRef.current) {
				engineRef.current.destroy();
			}

			const engine = new GameEngine({
				onScoreChange: setScore,
				onLengthChange: setSnakeLength,
				onGameOver: (score, length) => {
					setFinalScore(score);
					setFinalLength(length);
					setHasValidReplay(true);
				},
				onStateChange: (status) => {
					if (status === "gameover") {
						setCurrentScreen("gameover");
					}
				},
			});

			await engine.init(canvas);
			engine.setMuted(!settings.soundEnabled);
			engineRef.current = engine;
		},
		[settings.soundEnabled]
	);

	// Start new game
	const startGame = useCallback(() => {
		if (!engineRef.current) {
			console.warn("Game engine not initialized");
			return;
		}

		setScore(0);
		setSnakeLength(3);
		engineRef.current.reset();
		engineRef.current.start();
	}, []);

	// Reset game (without starting)
	const resetGame = useCallback(() => {
		if (!engineRef.current) return;
		engineRef.current.reset();
		setScore(0);
		setSnakeLength(3);
	}, []);

	// Destroy engine
	const destroyEngine = useCallback(() => {
		if (engineRef.current) {
			engineRef.current.destroy();
			engineRef.current = null;
		}
	}, []);

	// Start replay
	const startReplay = useCallback(() => {
		if (!engineRef.current) return;

		const replay = loadReplay();
		if (!replay) {
			console.warn("No valid replay data found");
			return;
		}

		setReplayData(replay);
		setScore(0);
		setSnakeLength(3);
		engineRef.current.startReplay(replay);
		setCurrentScreen("replay");
	}, []);

	// Stop replay
	const stopReplay = useCallback(() => {
		if (!engineRef.current) return;

		engineRef.current.stopReplay();
		setReplayData(null);
		setCurrentScreen("start");
	}, []);

	// Update settings
	const updateSettings = useCallback(
		(updates: Partial<PlayerSettings>) => {
			setSettings((prev) => ({ ...prev, ...updates }));

			// Apply sound setting to engine
			if (updates.soundEnabled !== undefined && engineRef.current) {
				engineRef.current.setMuted(!updates.soundEnabled);
			}
		},
		[setSettings]
	);

	// Set screen with proper navigation logic
	const setScreen = useCallback((screen: ScreenType) => {
		setCurrentScreen(screen);
	}, []);

	return {
		currentScreen,
		setScreen,
		score,
		snakeLength,
		settings,
		updateSettings,
		initEngine,
		startGame,
		resetGame,
		destroyEngine,
		replayData,
		hasValidReplay,
		startReplay,
		stopReplay,
		finalScore,
		finalLength,
	};
}
```

Poprawiłem hook. Callback `handleCanvasReady` teraz nie zależy od `currentScreen`.

---

**User**

Przetestowałem - nadal to samo. Gra przechodzi od razu do Game Over.

---

**Cursor**

Dziwne. Sprawdzę kod silnika dokładniej:

```typescriptreact
private update(): void {
  if (this.state.status !== 'playing') return;

  this.tickCount++;

  // Get direction input
  let newDirection: Direction | null = null;
  if (this.isReplay) {
    // ...
  } else {
    newDirection = this.inputHandler.getNextDirection(this.state.snake.direction);
  }

  // Apply direction change
  if (newDirection && newDirection !== OPPOSITE_DIRECTIONS[this.state.snake.direction]) {
    this.state.snake.nextDirection = newDirection;
    // ...
  }

  // Move snake
  const oldHead = { ...this.state.snake.segments[0] };
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
  // ...
}
```

```typescriptreact
export function moveSnake(snake: Snake): Snake {
  const newSegments = [...snake.segments];
  const head = { ...newSegments[0] };

  // Apply direction
  const direction = snake.nextDirection;
  switch (direction) {
    case 'UP':
      head.y -= 1;
      break;
    case 'DOWN':
      head.y += 1;
      break;
    case 'LEFT':
      head.x -= 1;
      break;
    case 'RIGHT':
      head.x += 1;
      break;
  }

  // Add new head at front
  newSegments.unshift(head);
  // Remove tail
  newSegments.pop();

  return {
    ...snake,
    segments: newSegments,
    direction: snake.nextDirection
  };
}
```

Gra natychmiast kończy się na ekranie "Game Over". Problem jest w silniku gry. Dodam logowanie aby zdiagnozować:

```typescript
// ==========================================
// Game Engine - Main game loop and state management
// ==========================================

import { Application, Container } from "pixi.js";
import type {
	GameState,
	GameStatus,
	Direction,
	Position,
	ReplayData,
	ReplayMove,
} from "@/types";
import {
	GRID_SIZE,
	INITIAL_SNAKE_LENGTH,
	POINTS_PER_FOOD,
	calculateSpeed,
} from "@/lib/constants";
import { createSnake, moveSnake, growSnake, checkSelfCollision } from "./snake";
import { spawnFood } from "./food";
import { InputHandler } from "./input";
import { AudioManager } from "./audio";
import { EffectsManager } from "./effects";
import { OPPOSITE_DIRECTIONS } from "@/types";

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
			status: "idle",
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
		if (this.state.status === "playing") return;

		this.state.status = "playing";
		this.callbacks.onStateChange("playing");
		this.inputHandler.start();
		this.startGameLoop();
	}

	stop(): void {
		this.stopGameLoop();
		this.inputHandler.stop();
		this.state.status = "idle";
		this.callbacks.onStateChange("idle");
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
		if (this.state.status !== "playing") return;

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
			newDirection = this.inputHandler.getNextDirection(
				this.state.snake.direction
			);
		}

		// Apply direction change
		if (
			newDirection &&
			newDirection !== OPPOSITE_DIRECTIONS[this.state.snake.direction]
		) {
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
			console.log("Wall collision at:", newHead, "Grid size:", GRID_SIZE);
			this.handleGameOver();
			return;
		}

		// Check self collision
		if (checkSelfCollision(this.state.snake)) {
			console.log("Self collision detected");
			this.handleGameOver();
			return;
		}

		// Check food collision
		if (
			newHead.x === this.state.food.position.x &&
			newHead.y === this.state.food.position.y
		) {
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
		this.audioManager.play("eat");
		this.effectsManager?.spawnParticles(this.state.food.position);
	}

	private handleGameOver(): void {
		this.state.status = "gameover";
		this.stopGameLoop();
		this.inputHandler.stop();

		// Effects
		this.audioManager.play("die");
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
			this.callbacks.onStateChange("gameover");
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
			localStorage.setItem("snake_replay", JSON.stringify(replayData));
		} catch (error) {
			console.error("Failed to save replay data:", error);
		}
	}

	loadReplay(): ReplayData | null {
		try {
			const data = localStorage.getItem("snake_replay");
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

		this.state.status = "playing";
		this.callbacks.onStateChange("replay");
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

		this.effectsManager.render(this.state.snake, this.state.food, GRID_SIZE);
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
```

```typescript
// ==========================================
// Game Engine - Main game loop and state management
// ==========================================

import { Application, Container } from "pixi.js";
import type {
	GameState,
	GameStatus,
	Direction,
	Position,
	ReplayData,
	ReplayMove,
} from "@/types";
import {
	GRID_SIZE,
	INITIAL_SNAKE_LENGTH,
	POINTS_PER_FOOD,
	calculateSpeed,
} from "@/lib/constants";
import { createSnake, moveSnake, growSnake, checkSelfCollision } from "./snake";
import { spawnFood } from "./food";
import { InputHandler } from "./input";
import { AudioManager } from "./audio";
import { EffectsManager } from "./effects";
import { OPPOSITE_DIRECTIONS } from "@/types";

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
			status: "idle",
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
		console.log(
			"GameEngine.init() - Canvas size:",
			canvas.width,
			"x",
			canvas.height
		);

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

		console.log("PixiJS initialized");

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

		console.log(
			"Init complete. Snake:",
			this.state.snake.segments,
			"Food:",
			this.state.food.position
		);
	}

	start(): void {
		console.log("GameEngine.start() - Current status:", this.state.status);
		if (this.state.status === "playing") return;

		this.state.status = "playing";
		this.callbacks.onStateChange("playing");
		this.inputHandler.start();
		this.startGameLoop();
		console.log("Game loop started");
	}

	stop(): void {
		this.stopGameLoop();
		this.inputHandler.stop();
		this.state.status = "idle";
		this.callbacks.onStateChange("idle");
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
		if (this.state.status !== "playing") return;

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
			newDirection = this.inputHandler.getNextDirection(
				this.state.snake.direction
			);
		}

		// Apply direction change
		if (
			newDirection &&
			newDirection !== OPPOSITE_DIRECTIONS[this.state.snake.direction]
		) {
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
			console.log("Wall collision at:", newHead, "Grid size:", GRID_SIZE);
			this.handleGameOver();
			return;
		}

		// Check self collision
		if (checkSelfCollision(this.state.snake)) {
			console.log("Self collision detected");
			this.handleGameOver();
			return;
		}

		// Check food collision
		if (
			newHead.x === this.state.food.position.x &&
			newHead.y === this.state.food.position.y
		) {
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
		this.audioManager.play("eat");
		this.effectsManager?.spawnParticles(this.state.food.position);
	}

	private handleGameOver(): void {
		this.state.status = "gameover";
		this.stopGameLoop();
		this.inputHandler.stop();

		// Effects
		this.audioManager.play("die");
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
			this.callbacks.onStateChange("gameover");
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
			localStorage.setItem("snake_replay", JSON.stringify(replayData));
		} catch (error) {
			console.error("Failed to save replay data:", error);
		}
	}

	loadReplay(): ReplayData | null {
		try {
			const data = localStorage.getItem("snake_replay");
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

		this.state.status = "playing";
		this.callbacks.onStateChange("replay");
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

		this.effectsManager.render(this.state.snake, this.state.food, GRID_SIZE);
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
```

```typescript
// ==========================================
// Game Engine - Main game loop and state management
// ==========================================

import { Application, Container } from "pixi.js";
import type {
	GameState,
	GameStatus,
	Direction,
	Position,
	ReplayData,
	ReplayMove,
} from "@/types";
import {
	GRID_SIZE,
	INITIAL_SNAKE_LENGTH,
	POINTS_PER_FOOD,
	calculateSpeed,
} from "@/lib/constants";
import { createSnake, moveSnake, growSnake, checkSelfCollision } from "./snake";
import { spawnFood } from "./food";
import { InputHandler } from "./input";
import { AudioManager } from "./audio";
import { EffectsManager } from "./effects";
import { OPPOSITE_DIRECTIONS } from "@/types";

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
			status: "idle",
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
		console.log(
			"GameEngine.init() - Canvas size:",
			canvas.width,
			"x",
			canvas.height
		);

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

		console.log("PixiJS initialized");

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

		console.log(
			"Init complete. Snake:",
			this.state.snake.segments,
			"Food:",
			this.state.food.position
		);
	}

	start(): void {
		console.log("GameEngine.start() - Current status:", this.state.status);
		if (this.state.status === "playing") return;

		this.state.status = "playing";
		this.callbacks.onStateChange("playing");
		this.inputHandler.start();
		this.startGameLoop();
		console.log("Game loop started");
	}

	stop(): void {
		this.stopGameLoop();
		this.inputHandler.stop();
		this.state.status = "idle";
		this.callbacks.onStateChange("idle");
	}

	reset(): void {
		console.log("GameEngine.reset() called");
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

		console.log("Reset complete. Snake:", this.state.snake.segments);
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
		if (this.state.status !== "playing") return;

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
			newDirection = this.inputHandler.getNextDirection(
				this.state.snake.direction
			);
		}

		// Apply direction change
		if (
			newDirection &&
			newDirection !== OPPOSITE_DIRECTIONS[this.state.snake.direction]
		) {
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
			console.log("Wall collision at:", newHead, "Grid size:", GRID_SIZE);
			this.handleGameOver();
			return;
		}

		// Check self collision
		if (checkSelfCollision(this.state.snake)) {
			console.log("Self collision detected");
			this.handleGameOver();
			return;
		}

		// Check food collision
		if (
			newHead.x === this.state.food.position.x &&
			newHead.y === this.state.food.position.y
		) {
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
		this.audioManager.play("eat");
		this.effectsManager?.spawnParticles(this.state.food.position);
	}

	private handleGameOver(): void {
		this.state.status = "gameover";
		this.stopGameLoop();
		this.inputHandler.stop();

		// Effects
		this.audioManager.play("die");
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
			this.callbacks.onStateChange("gameover");
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
			localStorage.setItem("snake_replay", JSON.stringify(replayData));
		} catch (error) {
			console.error("Failed to save replay data:", error);
		}
	}

	loadReplay(): ReplayData | null {
		try {
			const data = localStorage.getItem("snake_replay");
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

		this.state.status = "playing";
		this.callbacks.onStateChange("replay");
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

		this.effectsManager.render(this.state.snake, this.state.food, GRID_SIZE);
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
```

```typescriptreact
const initEngine = useCallback(async (canvas: HTMLCanvasElement) => {
  // Destroy existing engine if any  if (engineRef.current) {
    engineRef.current.destroy();


```

---

**User**

Otworzyłem console w przeglądarce i widzę że `GameEngine.init()` jest wywoływane dwa razy! Coś z React Strict Mode?

---

**Cursor**

Tak! To jest problem z React Strict Mode - podwójnie wywołuje komponenty w development. `GameEngine.init()` jest wywoływane DWUKROTNIE, co tworzy dwa silniki gry i dwa pętle gry jednocześnie. Naprawię to dodając ochronę przed podwójną inicjalizacją:

```typescript
// ==========================================
// useGameState Hook - Game state management
// ==========================================

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ScreenType, PlayerSettings, ReplayData } from "@/types";
import { GameEngine } from "@/game/engine";
import { loadReplay, hasReplay } from "@/game/replay";
import { useLocalStorage } from "./useLocalStorage";

const DEFAULT_SETTINGS: PlayerSettings = {
	soundEnabled: true,
	highContrastMode: false,
	foregroundColor: "#000000",
	backgroundColor: "#ffffff",
	nickname: "",
};

export interface GameStateHook {
	// Navigation
	currentScreen: ScreenType;
	setScreen: (screen: ScreenType) => void;

	// Game stats
	score: number;
	snakeLength: number;

	// Player settings
	settings: PlayerSettings;
	updateSettings: (updates: Partial<PlayerSettings>) => void;

	// Game engine
	initEngine: (canvas: HTMLCanvasElement) => Promise<void>;
	startGame: () => void;
	resetGame: () => void;
	destroyEngine: () => void;

	// Replay
	replayData: ReplayData | null;
	hasValidReplay: boolean;
	startReplay: () => void;
	stopReplay: () => void;

	// Final game stats (after game over)
	finalScore: number;
	finalLength: number;
}

export function useGameState(): GameStateHook {
	// Navigation state
	const [currentScreen, setCurrentScreen] = useState<ScreenType>("start");

	// Game stats
	const [score, setScore] = useState(0);
	const [snakeLength, setSnakeLength] = useState(3);
	const [finalScore, setFinalScore] = useState(0);
	const [finalLength, setFinalLength] = useState(3);

	// Replay state
	const [replayData, setReplayData] = useState<ReplayData | null>(null);
	const [hasValidReplay, setHasValidReplay] = useState(false);

	// Settings with localStorage persistence
	const [settings, setSettings] = useLocalStorage<PlayerSettings>(
		"snake_settings",
		DEFAULT_SETTINGS
	);

	// Game engine reference
	const engineRef = useRef<GameEngine | null>(null);
	const isInitializingRef = useRef(false);

	// Check for valid replay on mount
	useEffect(() => {
		setHasValidReplay(hasReplay());
	}, [currentScreen]);

	// Initialize game engine
	const initEngine = useCallback(
		async (canvas: HTMLCanvasElement) => {
			// Destroy existing engine if any
			if (engineRef.current) {
				engineRef.current.destroy();
			}

			const engine = new GameEngine({
				onScoreChange: setScore,
				onLengthChange: setSnakeLength,
				onGameOver: (score, length) => {
					setFinalScore(score);
					setFinalLength(length);
					setHasValidReplay(true);
				},
				onStateChange: (status) => {
					if (status === "gameover") {
						setCurrentScreen("gameover");
					}
				},
			});

			await engine.init(canvas);
			engine.setMuted(!settings.soundEnabled);
			engineRef.current = engine;
		},
		[settings.soundEnabled]
	);

	// Start new game
	const startGame = useCallback(() => {
		if (!engineRef.current) {
			console.warn("Game engine not initialized");
			return;
		}

		setScore(0);
		setSnakeLength(3);
		engineRef.current.reset();
		engineRef.current.start();
	}, []);

	// Reset game (without starting)
	const resetGame = useCallback(() => {
		if (!engineRef.current) return;
		engineRef.current.reset();
		setScore(0);
		setSnakeLength(3);
	}, []);

	// Destroy engine
	const destroyEngine = useCallback(() => {
		if (engineRef.current) {
			engineRef.current.destroy();
			engineRef.current = null;
		}
	}, []);

	// Start replay
	const startReplay = useCallback(() => {
		if (!engineRef.current) return;

		const replay = loadReplay();
		if (!replay) {
			console.warn("No valid replay data found");
			return;
		}

		setReplayData(replay);
		setScore(0);
		setSnakeLength(3);
		engineRef.current.startReplay(replay);
		setCurrentScreen("replay");
	}, []);

	// Stop replay
	const stopReplay = useCallback(() => {
		if (!engineRef.current) return;

		engineRef.current.stopReplay();
		setReplayData(null);
		setCurrentScreen("start");
	}, []);

	// Update settings
	const updateSettings = useCallback(
		(updates: Partial<PlayerSettings>) => {
			setSettings((prev) => ({ ...prev, ...updates }));

			// Apply sound setting to engine
			if (updates.soundEnabled !== undefined && engineRef.current) {
				engineRef.current.setMuted(!updates.soundEnabled);
			}
		},
		[setSettings]
	);

	// Set screen with proper navigation logic
	const setScreen = useCallback((screen: ScreenType) => {
		setCurrentScreen(screen);
	}, []);

	return {
		currentScreen,
		setScreen,
		score,
		snakeLength,
		settings,
		updateSettings,
		initEngine,
		startGame,
		resetGame,
		destroyEngine,
		replayData,
		hasValidReplay,
		startReplay,
		stopReplay,
		finalScore,
		finalLength,
	};
}
```

```typescript
// ==========================================
// useGameState Hook - Game state management
// ==========================================

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ScreenType, PlayerSettings, ReplayData } from "@/types";
import { GameEngine } from "@/game/engine";
import { loadReplay, hasReplay } from "@/game/replay";
import { useLocalStorage } from "./useLocalStorage";

const DEFAULT_SETTINGS: PlayerSettings = {
	soundEnabled: true,
	highContrastMode: false,
	foregroundColor: "#000000",
	backgroundColor: "#ffffff",
	nickname: "",
};

export interface GameStateHook {
	// Navigation
	currentScreen: ScreenType;
	setScreen: (screen: ScreenType) => void;

	// Game stats
	score: number;
	snakeLength: number;

	// Player settings
	settings: PlayerSettings;
	updateSettings: (updates: Partial<PlayerSettings>) => void;

	// Game engine
	initEngine: (canvas: HTMLCanvasElement) => Promise<void>;
	startGame: () => void;
	resetGame: () => void;
	destroyEngine: () => void;

	// Replay
	replayData: ReplayData | null;
	hasValidReplay: boolean;
	startReplay: () => void;
	stopReplay: () => void;

	// Final game stats (after game over)
	finalScore: number;
	finalLength: number;
}

export function useGameState(): GameStateHook {
	// Navigation state
	const [currentScreen, setCurrentScreen] = useState<ScreenType>("start");

	// Game stats
	const [score, setScore] = useState(0);
	const [snakeLength, setSnakeLength] = useState(3);
	const [finalScore, setFinalScore] = useState(0);
	const [finalLength, setFinalLength] = useState(3);

	// Replay state
	const [replayData, setReplayData] = useState<ReplayData | null>(null);
	const [hasValidReplay, setHasValidReplay] = useState(false);

	// Settings with localStorage persistence
	const [settings, setSettings] = useLocalStorage<PlayerSettings>(
		"snake_settings",
		DEFAULT_SETTINGS
	);

	// Game engine reference
	const engineRef = useRef<GameEngine | null>(null);
	const isInitializingRef = useRef(false);

	// Check for valid replay on mount
	useEffect(() => {
		setHasValidReplay(hasReplay());
	}, [currentScreen]);

	// Initialize game engine
	const initEngine = useCallback(
		async (canvas: HTMLCanvasElement) => {
			// Prevent double initialization (React Strict Mode)
			if (isInitializingRef.current) {
				console.log("Already initializing, skipping...");
				return;
			}
			isInitializingRef.current = true;

			// Destroy existing engine if any
			if (engineRef.current) {
				engineRef.current.destroy();
				engineRef.current = null;
			}

			const engine = new GameEngine({
				onScoreChange: setScore,
				onLengthChange: setSnakeLength,
				onGameOver: (score, length) => {
					setFinalScore(score);
					setFinalLength(length);
					setHasValidReplay(true);
				},
				onStateChange: (status) => {
					if (status === "gameover") {
						setCurrentScreen("gameover");
					}
				},
			});

			await engine.init(canvas);
			engine.setMuted(!settings.soundEnabled);
			engineRef.current = engine;
			isInitializingRef.current = false;
		},
		[settings.soundEnabled]
	);

	// Start new game
	const startGame = useCallback(() => {
		if (!engineRef.current) {
			console.warn("Game engine not initialized");
			return;
		}

		setScore(0);
		setSnakeLength(3);
		engineRef.current.reset();
		engineRef.current.start();
	}, []);

	// Reset game (without starting)
	const resetGame = useCallback(() => {
		if (!engineRef.current) return;
		engineRef.current.reset();
		setScore(0);
		setSnakeLength(3);
	}, []);

	// Destroy engine
	const destroyEngine = useCallback(() => {
		if (engineRef.current) {
			engineRef.current.destroy();
			engineRef.current = null;
		}
	}, []);

	// Start replay
	const startReplay = useCallback(() => {
		if (!engineRef.current) return;

		const replay = loadReplay();
		if (!replay) {
			console.warn("No valid replay data found");
			return;
		}

		setReplayData(replay);
		setScore(0);
		setSnakeLength(3);
		engineRef.current.startReplay(replay);
		setCurrentScreen("replay");
	}, []);

	// Stop replay
	const stopReplay = useCallback(() => {
		if (!engineRef.current) return;

		engineRef.current.stopReplay();
		setReplayData(null);
		setCurrentScreen("start");
	}, []);

	// Update settings
	const updateSettings = useCallback(
		(updates: Partial<PlayerSettings>) => {
			setSettings((prev) => ({ ...prev, ...updates }));

			// Apply sound setting to engine
			if (updates.soundEnabled !== undefined && engineRef.current) {
				engineRef.current.setMuted(!updates.soundEnabled);
			}
		},
		[setSettings]
	);

	// Set screen with proper navigation logic
	const setScreen = useCallback((screen: ScreenType) => {
		setCurrentScreen(screen);
	}, []);

	return {
		currentScreen,
		setScreen,
		score,
		snakeLength,
		settings,
		updateSettings,
		initEngine,
		startGame,
		resetGame,
		destroyEngine,
		replayData,
		hasValidReplay,
		startReplay,
		stopReplay,
		finalScore,
		finalLength,
	};
}
```

```typescript
// ==========================================
// useGameState Hook - Game state management
// ==========================================

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ScreenType, PlayerSettings, ReplayData } from "@/types";
import { GameEngine } from "@/game/engine";
import { loadReplay, hasReplay } from "@/game/replay";
import { useLocalStorage } from "./useLocalStorage";

const DEFAULT_SETTINGS: PlayerSettings = {
	soundEnabled: true,
	highContrastMode: false,
	foregroundColor: "#000000",
	backgroundColor: "#ffffff",
	nickname: "",
};

export interface GameStateHook {
	// Navigation
	currentScreen: ScreenType;
	setScreen: (screen: ScreenType) => void;

	// Game stats
	score: number;
	snakeLength: number;

	// Player settings
	settings: PlayerSettings;
	updateSettings: (updates: Partial<PlayerSettings>) => void;

	// Game engine
	initEngine: (canvas: HTMLCanvasElement) => Promise<void>;
	startGame: () => void;
	resetGame: () => void;
	destroyEngine: () => void;

	// Replay
	replayData: ReplayData | null;
	hasValidReplay: boolean;
	startReplay: () => void;
	stopReplay: () => void;

	// Final game stats (after game over)
	finalScore: number;
	finalLength: number;
}

export function useGameState(): GameStateHook {
	// Navigation state
	const [currentScreen, setCurrentScreen] = useState<ScreenType>("start");

	// Game stats
	const [score, setScore] = useState(0);
	const [snakeLength, setSnakeLength] = useState(3);
	const [finalScore, setFinalScore] = useState(0);
	const [finalLength, setFinalLength] = useState(3);

	// Replay state
	const [replayData, setReplayData] = useState<ReplayData | null>(null);
	const [hasValidReplay, setHasValidReplay] = useState(false);

	// Settings with localStorage persistence
	const [settings, setSettings] = useLocalStorage<PlayerSettings>(
		"snake_settings",
		DEFAULT_SETTINGS
	);

	// Game engine reference
	const engineRef = useRef<GameEngine | null>(null);
	const isInitializingRef = useRef(false);

	// Check for valid replay on mount
	useEffect(() => {
		setHasValidReplay(hasReplay());
	}, [currentScreen]);

	// Initialize game engine
	const initEngine = useCallback(
		async (canvas: HTMLCanvasElement) => {
			// Prevent double initialization (React Strict Mode)
			if (isInitializingRef.current) {
				console.log("Already initializing, skipping...");
				return;
			}
			isInitializingRef.current = true;

			// Destroy existing engine if any
			if (engineRef.current) {
				engineRef.current.destroy();
				engineRef.current = null;
			}

			const engine = new GameEngine({
				onScoreChange: setScore,
				onLengthChange: setSnakeLength,
				onGameOver: (score, length) => {
					setFinalScore(score);
					setFinalLength(length);
					setHasValidReplay(true);
				},
				onStateChange: (status) => {
					if (status === "gameover") {
						setCurrentScreen("gameover");
					}
				},
			});

			await engine.init(canvas);
			engine.setMuted(!settings.soundEnabled);
			engineRef.current = engine;
			isInitializingRef.current = false;
		},
		[settings.soundEnabled]
	);

	// Start new game
	const startGame = useCallback(() => {
		if (!engineRef.current || isInitializingRef.current) {
			console.warn("Game engine not ready");
			return;
		}

		setScore(0);
		setSnakeLength(3);
		engineRef.current.reset();
		engineRef.current.start();
	}, []);

	// Reset game (without starting)
	const resetGame = useCallback(() => {
		if (!engineRef.current) return;
		engineRef.current.reset();
		setScore(0);
		setSnakeLength(3);
	}, []);

	// Destroy engine
	const destroyEngine = useCallback(() => {
		if (engineRef.current) {
			engineRef.current.destroy();
			engineRef.current = null;
		}
	}, []);

	// Start replay
	const startReplay = useCallback(() => {
		if (!engineRef.current) return;

		const replay = loadReplay();
		if (!replay) {
			console.warn("No valid replay data found");
			return;
		}

		setReplayData(replay);
		setScore(0);
		setSnakeLength(3);
		engineRef.current.startReplay(replay);
		setCurrentScreen("replay");
	}, []);

	// Stop replay
	const stopReplay = useCallback(() => {
		if (!engineRef.current) return;

		engineRef.current.stopReplay();
		setReplayData(null);
		setCurrentScreen("start");
	}, []);

	// Update settings
	const updateSettings = useCallback(
		(updates: Partial<PlayerSettings>) => {
			setSettings((prev) => ({ ...prev, ...updates }));

			// Apply sound setting to engine
			if (updates.soundEnabled !== undefined && engineRef.current) {
				engineRef.current.setMuted(!updates.soundEnabled);
			}
		},
		[setSettings]
	);

	// Set screen with proper navigation logic
	const setScreen = useCallback((screen: ScreenType) => {
		setCurrentScreen(screen);
	}, []);

	return {
		currentScreen,
		setScreen,
		score,
		snakeLength,
		settings,
		updateSettings,
		initEngine,
		startGame,
		resetGame,
		destroyEngine,
		replayData,
		hasValidReplay,
		startReplay,
		stopReplay,
		finalScore,
		finalLength,
	};
}
```

```typescriptreact
const handleCanvasReady = useCallback(async (canvas: HTMLCanvasElement) => {
  await initEngine(canvas);
  // Engine is initialized, start the game
  startGame();
}, [initEngine, startGame]); should work correctly because await initEngine waits for the engine to be ready before calling startGame(). But the issue is if handleCanvasReady is called twice (due to Strict Mode), both calls would try to initEngine and then startGame.

With my fix, the second initEngine call will return early, but then startGame() would still be called with the first engine. Let me update handleCanvasReady to also handle this case.Actually, a cleaner solution is to have initEngine return a boolean indicating success, and only call startGame if it succeeded.
```

Naprawię również `handleCanvasReady` aby lepiej obsługiwało przypadek podwójnej inicjalizacji:

```typescript
// ==========================================
// useGameState Hook - Game state management
// ==========================================

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ScreenType, PlayerSettings, ReplayData } from "@/types";
import { GameEngine } from "@/game/engine";
import { loadReplay, hasReplay } from "@/game/replay";
import { useLocalStorage } from "./useLocalStorage";

const DEFAULT_SETTINGS: PlayerSettings = {
	soundEnabled: true,
	highContrastMode: false,
	foregroundColor: "#000000",
	backgroundColor: "#ffffff",
	nickname: "",
};

export interface GameStateHook {
	// Navigation
	currentScreen: ScreenType;
	setScreen: (screen: ScreenType) => void;

	// Game stats
	score: number;
	snakeLength: number;

	// Player settings
	settings: PlayerSettings;
	updateSettings: (updates: Partial<PlayerSettings>) => void;

	// Game engine
	initEngine: (canvas: HTMLCanvasElement) => Promise<void>;
	startGame: () => void;
	resetGame: () => void;
	destroyEngine: () => void;

	// Replay
	replayData: ReplayData | null;
	hasValidReplay: boolean;
	startReplay: () => void;
	stopReplay: () => void;

	// Final game stats (after game over)
	finalScore: number;
	finalLength: number;
}

export function useGameState(): GameStateHook {
	// Navigation state
	const [currentScreen, setCurrentScreen] = useState<ScreenType>("start");

	// Game stats
	const [score, setScore] = useState(0);
	const [snakeLength, setSnakeLength] = useState(3);
	const [finalScore, setFinalScore] = useState(0);
	const [finalLength, setFinalLength] = useState(3);

	// Replay state
	const [replayData, setReplayData] = useState<ReplayData | null>(null);
	const [hasValidReplay, setHasValidReplay] = useState(false);

	// Settings with localStorage persistence
	const [settings, setSettings] = useLocalStorage<PlayerSettings>(
		"snake_settings",
		DEFAULT_SETTINGS
	);

	// Game engine reference
	const engineRef = useRef<GameEngine | null>(null);
	const isInitializingRef = useRef(false);

	// Check for valid replay on mount
	useEffect(() => {
		setHasValidReplay(hasReplay());
	}, [currentScreen]);

	// Initialize game engine - returns true if initialization was performed
	const initEngine = useCallback(
		async (canvas: HTMLCanvasElement): Promise<boolean> => {
			// Prevent double initialization (React Strict Mode)
			if (isInitializingRef.current) {
				console.log("Already initializing, skipping...");
				return false;
			}
			isInitializingRef.current = true;

			// Destroy existing engine if any
			if (engineRef.current) {
				engineRef.current.destroy();
				engineRef.current = null;
			}

			const engine = new GameEngine({
				onScoreChange: setScore,
				onLengthChange: setSnakeLength,
				onGameOver: (score, length) => {
					setFinalScore(score);
					setFinalLength(length);
					setHasValidReplay(true);
				},
				onStateChange: (status) => {
					if (status === "gameover") {
						setCurrentScreen("gameover");
					}
				},
			});

			await engine.init(canvas);
			engine.setMuted(!settings.soundEnabled);
			engineRef.current = engine;
			isInitializingRef.current = false;
			return true;
		},
		[settings.soundEnabled]
	);

	// Start new game
	const startGame = useCallback(() => {
		if (!engineRef.current || isInitializingRef.current) {
			console.warn("Game engine not ready");
			return;
		}

		setScore(0);
		setSnakeLength(3);
		engineRef.current.reset();
		engineRef.current.start();
	}, []);

	// Reset game (without starting)
	const resetGame = useCallback(() => {
		if (!engineRef.current) return;
		engineRef.current.reset();
		setScore(0);
		setSnakeLength(3);
	}, []);

	// Destroy engine
	const destroyEngine = useCallback(() => {
		if (engineRef.current) {
			engineRef.current.destroy();
			engineRef.current = null;
		}
	}, []);

	// Start replay
	const startReplay = useCallback(() => {
		if (!engineRef.current) return;

		const replay = loadReplay();
		if (!replay) {
			console.warn("No valid replay data found");
			return;
		}

		setReplayData(replay);
		setScore(0);
		setSnakeLength(3);
		engineRef.current.startReplay(replay);
		setCurrentScreen("replay");
	}, []);

	// Stop replay
	const stopReplay = useCallback(() => {
		if (!engineRef.current) return;

		engineRef.current.stopReplay();
		setReplayData(null);
		setCurrentScreen("start");
	}, []);

	// Update settings
	const updateSettings = useCallback(
		(updates: Partial<PlayerSettings>) => {
			setSettings((prev) => ({ ...prev, ...updates }));

			// Apply sound setting to engine
			if (updates.soundEnabled !== undefined && engineRef.current) {
				engineRef.current.setMuted(!updates.soundEnabled);
			}
		},
		[setSettings]
	);

	// Set screen with proper navigation logic
	const setScreen = useCallback((screen: ScreenType) => {
		setCurrentScreen(screen);
	}, []);

	return {
		currentScreen,
		setScreen,
		score,
		snakeLength,
		settings,
		updateSettings,
		initEngine,
		startGame,
		resetGame,
		destroyEngine,
		replayData,
		hasValidReplay,
		startReplay,
		stopReplay,
		finalScore,
		finalLength,
	};
}
```

```typescriptreact
// ==========================================
// Main Page - Snake Game Entry Point
// ==========================================

'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import {
  StartScreen,
  GameScreen,
  GameOverScreen,
  SettingsScreen,
  LeaderboardScreen,
  ReplayScreen,
} from '@/components/screens';
import { useGameState } from '@/hooks';
import type { ScreenType } from '@/types';

export default function Home() {
  const {
    currentScreen,
    setScreen,
    score,
    snakeLength,
    settings,
    updateSettings,
    initEngine,
    startGame,
    resetGame,
    destroyEngine,
    replayData,
    hasValidReplay,
    startReplay,
    stopReplay,
    finalScore,
    finalLength,
  } = useGameState();

  // Track previous screen for back navigation
  const previousScreenRef = useRef<ScreenType>('start');
  const [isMounted, setIsMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Track screen changes for back navigation
  useEffect(() => {
    if (currentScreen !== 'settings' && currentScreen !== 'leaderboard') {
      previousScreenRef.current = currentScreen;
    }
  }, [currentScreen]);

  // Canvas ready handler - starts game automatically since canvas is only rendered on game/replay screens
  const handleCanvasReady = useCallback(async (canvas: HTMLCanvasElement) => {
    const initialized = await initEngine(canvas);
    // Only start game if this call actually initialized the engine
    if (initialized) {
      startGame();
    }
  }, [initEngine, startGame]);

  // Save score to leaderboard
  const handleSaveScore = useCallback(async () => {
    try {
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nick: settings.nickname || 'Anonymous',
          score: finalScore,
          snakeLength: finalLength,
        }),
      });

      const data = await response.json();
      return data;
    } catch {
      return { success: false, error: 'Network error' };
    }
  }, [settings.nickname, finalScore, finalLength]);

  // Navigation handlers
  const handleStartGame = useCallback(() => {
    setScreen('game');
  }, [setScreen]);

  const handlePlayAgain = useCallback(() => {
    resetGame();
    setScreen('game');
  }, [resetGame, setScreen]);

  const handleWatchReplay = useCallback(() => {
    startReplay();
  }, [startReplay]);

  const handleStopReplay = useCallback(() => {
    stopReplay();
  }, [stopReplay]);

  const handleBackNavigation = useCallback(() => {
    // Return to appropriate screen based on context
    const target = previousScreenRef.current === 'gameover' ? 'gameover' : 'start';
    setScreen(target);
  }, [setScreen]);

  const handleReturnToMenu = useCallback(() => {
    destroyEngine();
    setScreen('start');
  }, [destroyEngine, setScreen]);

  // Toggle mute
  const handleToggleMute = useCallback(() => {
    updateSettings({ soundEnabled: !settings.soundEnabled });
  }, [settings.soundEnabled, updateSettings]);

  // Apply high contrast mode
  const containerClasses = settings.highContrastMode ? 'high-contrast' : '';
  const customStyles = settings.highContrastMode
    ? {
        '--hc-foreground': settings.foregroundColor,
        '--hc-background': settings.backgroundColor,
      } as React.CSSProperties
    : {};

  // Prevent SSR hydration issues
  if (!isMounted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gb-lightest">
        <div className="font-pixel text-gb-darkest">Loading...</div>
      </main>
    );
  }

  return (
    <main
      className={`min-h-screen flex items-center justify-center bg-gb-lightest ${containerClasses}`}
      style={customStyles}
    >
      <div className="game-frame">
        <div className="game-screen min-w-[420px] min-h-[520px] flex items-center justify-center">
          {/* Start Screen */}
          {currentScreen === 'start' && (
            <StartScreen
              nickname={settings.nickname}
              onNicknameChange={(nick) => updateSettings({ nickname: nick })}
              onStartGame={handleStartGame}
              onOpenSettings={() => setScreen('settings')}
              onOpenLeaderboard={() => setScreen('leaderboard')}
            />
          )}

          {/* Game Screen */}
          {currentScreen === 'game' && (
            <GameScreen
              score={score}
              length={snakeLength}
              muted={!settings.soundEnabled}
              onCanvasReady={handleCanvasReady}
              onToggleMute={handleToggleMute}
            />
          )}

          {/* Game Over Screen */}
          {currentScreen === 'gameover' && (
            <GameOverScreen
              score={finalScore}
              length={finalLength}
              nickname={settings.nickname}
              hasReplay={hasValidReplay}
              onNicknameChange={(nick) => updateSettings({ nickname: nick })}
              onSaveScore={handleSaveScore}
              onPlayAgain={handlePlayAgain}
              onWatchReplay={handleWatchReplay}
              onViewLeaderboard={() => setScreen('leaderboard')}
              onReturnToMenu={handleReturnToMenu}
            />
          )}

          {/* Settings Screen */}
          {currentScreen === 'settings' && (
            <SettingsScreen
              settings={settings}
              onSave={(newSettings) => updateSettings(newSettings)}
              onBack={handleBackNavigation}
            />
          )}

          {/* Leaderboard Screen */}
          {currentScreen === 'leaderboard' && (
            <LeaderboardScreen onBack={handleBackNavigation} />
          )}

          {/* Replay Screen */}
          {currentScreen === 'replay' && (
            <ReplayScreen
              replayData={replayData}
              score={score}
              length={snakeLength}
              onCanvasReady={handleCanvasReady}
              onCancel={handleStopReplay}
            />
          )}
        </div>
      </div>
    </main>
  );
}

```

```typescript
// ==========================================
// Game Engine - Main game loop and state management
// ==========================================

import { Application, Container } from "pixi.js";
import type {
	GameState,
	GameStatus,
	Direction,
	Position,
	ReplayData,
	ReplayMove,
} from "@/types";
import {
	GRID_SIZE,
	INITIAL_SNAKE_LENGTH,
	POINTS_PER_FOOD,
	calculateSpeed,
} from "@/lib/constants";
import { createSnake, moveSnake, growSnake, checkSelfCollision } from "./snake";
import { spawnFood } from "./food";
import { InputHandler } from "./input";
import { AudioManager } from "./audio";
import { EffectsManager } from "./effects";
import { OPPOSITE_DIRECTIONS } from "@/types";

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
			status: "idle",
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
		console.log(
			"GameEngine.init() - Canvas size:",
			canvas.width,
			"x",
			canvas.height
		);

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

		console.log("PixiJS initialized");

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

		console.log(
			"Init complete. Snake:",
			this.state.snake.segments,
			"Food:",
			this.state.food.position
		);
	}

	start(): void {
		console.log("GameEngine.start() - Current status:", this.state.status);
		if (this.state.status === "playing") return;

		this.state.status = "playing";
		this.callbacks.onStateChange("playing");
		this.inputHandler.start();
		this.startGameLoop();
		console.log("Game loop started");
	}

	stop(): void {
		this.stopGameLoop();
		this.inputHandler.stop();
		this.state.status = "idle";
		this.callbacks.onStateChange("idle");
	}

	reset(): void {
		console.log("GameEngine.reset() called");
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

		console.log("Reset complete. Snake:", this.state.snake.segments);
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
		if (this.state.status !== "playing") return;

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
			newDirection = this.inputHandler.getNextDirection(
				this.state.snake.direction
			);
		}

		// Apply direction change
		if (
			newDirection &&
			newDirection !== OPPOSITE_DIRECTIONS[this.state.snake.direction]
		) {
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
			console.log(
				"Wall collision at:",
				JSON.stringify(newHead),
				"Grid size:",
				GRID_SIZE
			);
			this.handleGameOver();
			return;
		}

		// Check self collision
		if (checkSelfCollision(this.state.snake)) {
			console.log("Self collision detected");
			this.handleGameOver();
			return;
		}

		// Check food collision
		if (
			newHead.x === this.state.food.position.x &&
			newHead.y === this.state.food.position.y
		) {
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
		this.audioManager.play("eat");
		this.effectsManager?.spawnParticles(this.state.food.position);
	}

	private handleGameOver(): void {
		this.state.status = "gameover";
		this.stopGameLoop();
		this.inputHandler.stop();

		// Effects
		this.audioManager.play("die");
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
			this.callbacks.onStateChange("gameover");
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
			localStorage.setItem("snake_replay", JSON.stringify(replayData));
		} catch (error) {
			console.error("Failed to save replay data:", error);
		}
	}

	loadReplay(): ReplayData | null {
		try {
			const data = localStorage.getItem("snake_replay");
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

		this.state.status = "playing";
		this.callbacks.onStateChange("replay");
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

		this.effectsManager.render(this.state.snake, this.state.food, GRID_SIZE);
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
```

Poprawiłem ochronę przed podwójną inicjalizacją.

---

**User**

Przetestowałem - teraz gra się uruchamia! Ale wąż sam jedzie w prawo i po chwili uderza w ścianę. Czy to tak ma być?

---

**Cursor**

Tak! Gra działa poprawnie - wąż startuje na środku ekranu idąc w prawo. Bez sterowania dochodzi do krawędzi po ~1 sekundzie. Ale dla lepszego UX zmienię początkową pozycję żeby było więcej czasu na reakcję:

- Wąż startuje na (10, 10) idąc w PRAWO
- Po 10 ruchach (każdy ~100ms) dochodzi do krawędzi (x=20 jest poza siatką 20x20)
- Gra kończy się po ~1 sekundzie bez sterowania

To normalne zachowanie - wąż wymaga sterowania! Ale dla lepszego UX, ustawię początkowy kierunek na dół (więcej miejsca do ściany) i dodam dłuższy czas przed pierwszym ruchem:

```typescript
// ==========================================
// Snake Logic - Movement and collision detection
// ==========================================

import type { Snake, Position, Direction } from "@/types";

// Create initial snake at center of grid
export function createSnake(gridSize: number, initialLength: number): Snake {
	const centerX = Math.floor(gridSize / 2);
	// Start higher up so snake has more room to move down
	const startY = Math.floor(gridSize / 4);

	// Snake starts vertical, moving down (more room before wall)
	const segments: Position[] = [];
	for (let i = 0; i < initialLength; i++) {
		segments.push({
			x: centerX,
			y: startY + i, // Body extends upward
		});
	}

	return {
		segments,
		direction: "DOWN",
		nextDirection: "DOWN",
		bufferedDirection: null,
	};
}

// Move snake in current direction
export function moveSnake(snake: Snake): Snake {
	const newSegments = [...snake.segments];
	const head = { ...newSegments[0] };

	// Apply direction
	const direction = snake.nextDirection;
	switch (direction) {
		case "UP":
			head.y -= 1;
			break;
		case "DOWN":
			head.y += 1;
			break;
		case "LEFT":
			head.x -= 1;
			break;
		case "RIGHT":
			head.x += 1;
			break;
	}

	// Add new head at front
	newSegments.unshift(head);
	// Remove tail (snake doesn't grow on move, only on eat)
	newSegments.pop();

	return {
		...snake,
		segments: newSegments,
		direction: direction,
		nextDirection: direction,
		// Process buffered direction
		bufferedDirection: null,
	};
}

// Grow snake by adding segment at tail
export function growSnake(snake: Snake): Snake {
	const tail = snake.segments[snake.segments.length - 1];
	const secondToLast = snake.segments[snake.segments.length - 2];

	// Determine direction of tail growth
	let newTail: Position;
	if (secondToLast) {
		// Extend in opposite direction of tail movement
		const dx = tail.x - secondToLast.x;
		const dy = tail.y - secondToLast.y;
		newTail = {
			x: tail.x + dx,
			y: tail.y + dy,
		};
	} else {
		// Fallback: just duplicate tail
		newTail = { ...tail };
	}

	return {
		...snake,
		segments: [...snake.segments, newTail],
	};
}

// Check if snake head collides with body
export function checkSelfCollision(snake: Snake): boolean {
	const head = snake.segments[0];

	// Check against all body segments (skip head at index 0)
	for (let i = 1; i < snake.segments.length; i++) {
		if (head.x === snake.segments[i].x && head.y === snake.segments[i].y) {
			return true;
		}
	}

	return false;
}

// Get all positions occupied by snake
export function getSnakePositions(snake: Snake): Set<string> {
	const positions = new Set<string>();
	for (const segment of snake.segments) {
		positions.add(`${segment.x},${segment.y}`);
	}
	return positions;
}
```

```typescript
// ==========================================
// Snake Logic - Movement and collision detection
// ==========================================

import type { Snake, Position, Direction } from "@/types";

// Create initial snake at center of grid
export function createSnake(gridSize: number, initialLength: number): Snake {
	const centerX = Math.floor(gridSize / 2);
	// Start higher up so snake has more room to move down
	const startY = Math.floor(gridSize / 4);

	// Snake starts vertical, moving down - head at bottom, body extends upward
	const segments: Position[] = [];
	for (let i = 0; i < initialLength; i++) {
		segments.push({
			x: centerX,
			y: startY - i, // Head at startY, body above
		});
	}

	return {
		segments,
		direction: "DOWN",
		nextDirection: "DOWN",
		bufferedDirection: null,
	};
}

// Move snake in current direction
export function moveSnake(snake: Snake): Snake {
	const newSegments = [...snake.segments];
	const head = { ...newSegments[0] };

	// Apply direction
	const direction = snake.nextDirection;
	switch (direction) {
		case "UP":
			head.y -= 1;
			break;
		case "DOWN":
			head.y += 1;
			break;
		case "LEFT":
			head.x -= 1;
			break;
		case "RIGHT":
			head.x += 1;
			break;
	}

	// Add new head at front
	newSegments.unshift(head);
	// Remove tail (snake doesn't grow on move, only on eat)
	newSegments.pop();

	return {
		...snake,
		segments: newSegments,
		direction: direction,
		nextDirection: direction,
		// Process buffered direction
		bufferedDirection: null,
	};
}

// Grow snake by adding segment at tail
export function growSnake(snake: Snake): Snake {
	const tail = snake.segments[snake.segments.length - 1];
	const secondToLast = snake.segments[snake.segments.length - 2];

	// Determine direction of tail growth
	let newTail: Position;
	if (secondToLast) {
		// Extend in opposite direction of tail movement
		const dx = tail.x - secondToLast.x;
		const dy = tail.y - secondToLast.y;
		newTail = {
			x: tail.x + dx,
			y: tail.y + dy,
		};
	} else {
		// Fallback: just duplicate tail
		newTail = { ...tail };
	}

	return {
		...snake,
		segments: [...snake.segments, newTail],
	};
}

// Check if snake head collides with body
export function checkSelfCollision(snake: Snake): boolean {
	const head = snake.segments[0];

	// Check against all body segments (skip head at index 0)
	for (let i = 1; i < snake.segments.length; i++) {
		if (head.x === snake.segments[i].x && head.y === snake.segments[i].y) {
			return true;
		}
	}

	return false;
}

// Get all positions occupied by snake
export function getSnakePositions(snake: Snake): Set<string> {
	const positions = new Set<string>();
	for (const segment of snake.segments) {
		positions.add(`${segment.x},${segment.y}`);
	}
	return positions;
}
```

Usunę logi debugowania z silnika gry:

```typescript
// ==========================================
// Game Engine - Main game loop and state management
// ==========================================

import { Application, Container } from "pixi.js";
import type {
	GameState,
	GameStatus,
	Direction,
	Position,
	ReplayData,
	ReplayMove,
} from "@/types";
import {
	GRID_SIZE,
	INITIAL_SNAKE_LENGTH,
	POINTS_PER_FOOD,
	calculateSpeed,
} from "@/lib/constants";
import { createSnake, moveSnake, growSnake, checkSelfCollision } from "./snake";
import { spawnFood } from "./food";
import { InputHandler } from "./input";
import { AudioManager } from "./audio";
import { EffectsManager } from "./effects";
import { OPPOSITE_DIRECTIONS } from "@/types";

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
			status: "idle",
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
		if (this.state.status === "playing") return;

		this.state.status = "playing";
		this.callbacks.onStateChange("playing");
		this.inputHandler.start();
		this.startGameLoop();
	}

	stop(): void {
		this.stopGameLoop();
		this.inputHandler.stop();
		this.state.status = "idle";
		this.callbacks.onStateChange("idle");
	}

	reset(): void {
		console.log("GameEngine.reset() called");
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

		console.log("Reset complete. Snake:", this.state.snake.segments);
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
		if (this.state.status !== "playing") return;

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
			newDirection = this.inputHandler.getNextDirection(
				this.state.snake.direction
			);
		}

		// Apply direction change
		if (
			newDirection &&
			newDirection !== OPPOSITE_DIRECTIONS[this.state.snake.direction]
		) {
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
			console.log(
				"Wall collision at:",
				JSON.stringify(newHead),
				"Grid size:",
				GRID_SIZE
			);
			this.handleGameOver();
			return;
		}

		// Check self collision
		if (checkSelfCollision(this.state.snake)) {
			console.log("Self collision detected");
			this.handleGameOver();
			return;
		}

		// Check food collision
		if (
			newHead.x === this.state.food.position.x &&
			newHead.y === this.state.food.position.y
		) {
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
		this.audioManager.play("eat");
		this.effectsManager?.spawnParticles(this.state.food.position);
	}

	private handleGameOver(): void {
		this.state.status = "gameover";
		this.stopGameLoop();
		this.inputHandler.stop();

		// Effects
		this.audioManager.play("die");
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
			this.callbacks.onStateChange("gameover");
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
			localStorage.setItem("snake_replay", JSON.stringify(replayData));
		} catch (error) {
			console.error("Failed to save replay data:", error);
		}
	}

	loadReplay(): ReplayData | null {
		try {
			const data = localStorage.getItem("snake_replay");
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

		this.state.status = "playing";
		this.callbacks.onStateChange("replay");
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

		this.effectsManager.render(this.state.snake, this.state.food, GRID_SIZE);
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
```

```typescript
// ==========================================
// Game Engine - Main game loop and state management
// ==========================================

import { Application, Container } from "pixi.js";
import type {
	GameState,
	GameStatus,
	Direction,
	Position,
	ReplayData,
	ReplayMove,
} from "@/types";
import {
	GRID_SIZE,
	INITIAL_SNAKE_LENGTH,
	POINTS_PER_FOOD,
	calculateSpeed,
} from "@/lib/constants";
import { createSnake, moveSnake, growSnake, checkSelfCollision } from "./snake";
import { spawnFood } from "./food";
import { InputHandler } from "./input";
import { AudioManager } from "./audio";
import { EffectsManager } from "./effects";
import { OPPOSITE_DIRECTIONS } from "@/types";

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
			status: "idle",
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
		if (this.state.status === "playing") return;

		this.state.status = "playing";
		this.callbacks.onStateChange("playing");
		this.inputHandler.start();
		this.startGameLoop();
	}

	stop(): void {
		this.stopGameLoop();
		this.inputHandler.stop();
		this.state.status = "idle";
		this.callbacks.onStateChange("idle");
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
		if (this.state.status !== "playing") return;

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
			newDirection = this.inputHandler.getNextDirection(
				this.state.snake.direction
			);
		}

		// Apply direction change
		if (
			newDirection &&
			newDirection !== OPPOSITE_DIRECTIONS[this.state.snake.direction]
		) {
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
			console.log(
				"Wall collision at:",
				JSON.stringify(newHead),
				"Grid size:",
				GRID_SIZE
			);
			this.handleGameOver();
			return;
		}

		// Check self collision
		if (checkSelfCollision(this.state.snake)) {
			console.log("Self collision detected");
			this.handleGameOver();
			return;
		}

		// Check food collision
		if (
			newHead.x === this.state.food.position.x &&
			newHead.y === this.state.food.position.y
		) {
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
		this.audioManager.play("eat");
		this.effectsManager?.spawnParticles(this.state.food.position);
	}

	private handleGameOver(): void {
		this.state.status = "gameover";
		this.stopGameLoop();
		this.inputHandler.stop();

		// Effects
		this.audioManager.play("die");
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
			this.callbacks.onStateChange("gameover");
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
			localStorage.setItem("snake_replay", JSON.stringify(replayData));
		} catch (error) {
			console.error("Failed to save replay data:", error);
		}
	}

	loadReplay(): ReplayData | null {
		try {
			const data = localStorage.getItem("snake_replay");
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

		this.state.status = "playing";
		this.callbacks.onStateChange("replay");
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

		this.effectsManager.render(this.state.snake, this.state.food, GRID_SIZE);
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
```

```typescript
// ==========================================
// Game Engine - Main game loop and state management
// ==========================================

import { Application, Container } from "pixi.js";
import type {
	GameState,
	GameStatus,
	Direction,
	Position,
	ReplayData,
	ReplayMove,
} from "@/types";
import {
	GRID_SIZE,
	INITIAL_SNAKE_LENGTH,
	POINTS_PER_FOOD,
	calculateSpeed,
} from "@/lib/constants";
import { createSnake, moveSnake, growSnake, checkSelfCollision } from "./snake";
import { spawnFood } from "./food";
import { InputHandler } from "./input";
import { AudioManager } from "./audio";
import { EffectsManager } from "./effects";
import { OPPOSITE_DIRECTIONS } from "@/types";

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
			status: "idle",
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
		if (this.state.status === "playing") return;

		this.state.status = "playing";
		this.callbacks.onStateChange("playing");
		this.inputHandler.start();
		this.startGameLoop();
	}

	stop(): void {
		this.stopGameLoop();
		this.inputHandler.stop();
		this.state.status = "idle";
		this.callbacks.onStateChange("idle");
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
		if (this.state.status !== "playing") return;

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
			newDirection = this.inputHandler.getNextDirection(
				this.state.snake.direction
			);
		}

		// Apply direction change
		if (
			newDirection &&
			newDirection !== OPPOSITE_DIRECTIONS[this.state.snake.direction]
		) {
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
		if (
			newHead.x === this.state.food.position.x &&
			newHead.y === this.state.food.position.y
		) {
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
		this.audioManager.play("eat");
		this.effectsManager?.spawnParticles(this.state.food.position);
	}

	private handleGameOver(): void {
		this.state.status = "gameover";
		this.stopGameLoop();
		this.inputHandler.stop();

		// Effects
		this.audioManager.play("die");
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
			this.callbacks.onStateChange("gameover");
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
			localStorage.setItem("snake_replay", JSON.stringify(replayData));
		} catch (error) {
			console.error("Failed to save replay data:", error);
		}
	}

	loadReplay(): ReplayData | null {
		try {
			const data = localStorage.getItem("snake_replay");
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

		this.state.status = "playing";
		this.callbacks.onStateChange("replay");
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

		this.effectsManager.render(this.state.snake, this.state.food, GRID_SIZE);
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
```

```typescript
// ==========================================
// useGameState Hook - Game state management
// ==========================================

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ScreenType, PlayerSettings, ReplayData } from "@/types";
import { GameEngine } from "@/game/engine";
import { loadReplay, hasReplay } from "@/game/replay";
import { useLocalStorage } from "./useLocalStorage";

const DEFAULT_SETTINGS: PlayerSettings = {
	soundEnabled: true,
	highContrastMode: false,
	foregroundColor: "#000000",
	backgroundColor: "#ffffff",
	nickname: "",
};

export interface GameStateHook {
	// Navigation
	currentScreen: ScreenType;
	setScreen: (screen: ScreenType) => void;

	// Game stats
	score: number;
	snakeLength: number;

	// Player settings
	settings: PlayerSettings;
	updateSettings: (updates: Partial<PlayerSettings>) => void;

	// Game engine
	initEngine: (canvas: HTMLCanvasElement) => Promise<void>;
	startGame: () => void;
	resetGame: () => void;
	destroyEngine: () => void;

	// Replay
	replayData: ReplayData | null;
	hasValidReplay: boolean;
	startReplay: () => void;
	stopReplay: () => void;

	// Final game stats (after game over)
	finalScore: number;
	finalLength: number;
}

export function useGameState(): GameStateHook {
	// Navigation state
	const [currentScreen, setCurrentScreen] = useState<ScreenType>("start");

	// Game stats
	const [score, setScore] = useState(0);
	const [snakeLength, setSnakeLength] = useState(3);
	const [finalScore, setFinalScore] = useState(0);
	const [finalLength, setFinalLength] = useState(3);

	// Replay state
	const [replayData, setReplayData] = useState<ReplayData | null>(null);
	const [hasValidReplay, setHasValidReplay] = useState(false);

	// Settings with localStorage persistence
	const [settings, setSettings] = useLocalStorage<PlayerSettings>(
		"snake_settings",
		DEFAULT_SETTINGS
	);

	// Game engine reference
	const engineRef = useRef<GameEngine | null>(null);
	const isInitializingRef = useRef(false);

	// Check for valid replay on mount
	useEffect(() => {
		setHasValidReplay(hasReplay());
	}, [currentScreen]);

	// Initialize game engine - returns true if initialization was performed
	const initEngine = useCallback(
		async (canvas: HTMLCanvasElement): Promise<boolean> => {
			// Prevent double initialization (React Strict Mode)
			if (isInitializingRef.current) {
				return false;
			}
			isInitializingRef.current = true;

			// Destroy existing engine if any
			if (engineRef.current) {
				engineRef.current.destroy();
				engineRef.current = null;
			}

			const engine = new GameEngine({
				onScoreChange: setScore,
				onLengthChange: setSnakeLength,
				onGameOver: (score, length) => {
					setFinalScore(score);
					setFinalLength(length);
					setHasValidReplay(true);
				},
				onStateChange: (status) => {
					if (status === "gameover") {
						setCurrentScreen("gameover");
					}
				},
			});

			await engine.init(canvas);
			engine.setMuted(!settings.soundEnabled);
			engineRef.current = engine;
			isInitializingRef.current = false;
			return true;
		},
		[settings.soundEnabled]
	);

	// Start new game
	const startGame = useCallback(() => {
		if (!engineRef.current || isInitializingRef.current) {
			console.warn("Game engine not ready");
			return;
		}

		setScore(0);
		setSnakeLength(3);
		engineRef.current.reset();
		engineRef.current.start();
	}, []);

	// Reset game (without starting)
	const resetGame = useCallback(() => {
		if (!engineRef.current) return;
		engineRef.current.reset();
		setScore(0);
		setSnakeLength(3);
	}, []);

	// Destroy engine
	const destroyEngine = useCallback(() => {
		if (engineRef.current) {
			engineRef.current.destroy();
			engineRef.current = null;
		}
	}, []);

	// Start replay
	const startReplay = useCallback(() => {
		if (!engineRef.current) return;

		const replay = loadReplay();
		if (!replay) {
			console.warn("No valid replay data found");
			return;
		}

		setReplayData(replay);
		setScore(0);
		setSnakeLength(3);
		engineRef.current.startReplay(replay);
		setCurrentScreen("replay");
	}, []);

	// Stop replay
	const stopReplay = useCallback(() => {
		if (!engineRef.current) return;

		engineRef.current.stopReplay();
		setReplayData(null);
		setCurrentScreen("start");
	}, []);

	// Update settings
	const updateSettings = useCallback(
		(updates: Partial<PlayerSettings>) => {
			setSettings((prev) => ({ ...prev, ...updates }));

			// Apply sound setting to engine
			if (updates.soundEnabled !== undefined && engineRef.current) {
				engineRef.current.setMuted(!updates.soundEnabled);
			}
		},
		[setSettings]
	);

	// Set screen with proper navigation logic
	const setScreen = useCallback((screen: ScreenType) => {
		setCurrentScreen(screen);
	}, []);

	return {
		currentScreen,
		setScreen,
		score,
		snakeLength,
		settings,
		updateSettings,
		initEngine,
		startGame,
		resetGame,
		destroyEngine,
		replayData,
		hasValidReplay,
		startReplay,
		stopReplay,
		finalScore,
		finalLength,
	};
}
```

```typescript
// ==========================================
// useGameState Hook - Game state management
// ==========================================

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ScreenType, PlayerSettings, ReplayData } from "@/types";
import { GameEngine } from "@/game/engine";
import { loadReplay, hasReplay } from "@/game/replay";
import { useLocalStorage } from "./useLocalStorage";

const DEFAULT_SETTINGS: PlayerSettings = {
	soundEnabled: true,
	highContrastMode: false,
	foregroundColor: "#000000",
	backgroundColor: "#ffffff",
	nickname: "",
};

export interface GameStateHook {
	// Navigation
	currentScreen: ScreenType;
	setScreen: (screen: ScreenType) => void;

	// Game stats
	score: number;
	snakeLength: number;

	// Player settings
	settings: PlayerSettings;
	updateSettings: (updates: Partial<PlayerSettings>) => void;

	// Game engine
	initEngine: (canvas: HTMLCanvasElement) => Promise<void>;
	startGame: () => void;
	resetGame: () => void;
	destroyEngine: () => void;

	// Replay
	replayData: ReplayData | null;
	hasValidReplay: boolean;
	startReplay: () => void;
	stopReplay: () => void;

	// Final game stats (after game over)
	finalScore: number;
	finalLength: number;
}

export function useGameState(): GameStateHook {
	// Navigation state
	const [currentScreen, setCurrentScreen] = useState<ScreenType>("start");

	// Game stats
	const [score, setScore] = useState(0);
	const [snakeLength, setSnakeLength] = useState(3);
	const [finalScore, setFinalScore] = useState(0);
	const [finalLength, setFinalLength] = useState(3);

	// Replay state
	const [replayData, setReplayData] = useState<ReplayData | null>(null);
	const [hasValidReplay, setHasValidReplay] = useState(false);

	// Settings with localStorage persistence
	const [settings, setSettings] = useLocalStorage<PlayerSettings>(
		"snake_settings",
		DEFAULT_SETTINGS
	);

	// Game engine reference
	const engineRef = useRef<GameEngine | null>(null);
	const isInitializingRef = useRef(false);

	// Check for valid replay on mount
	useEffect(() => {
		setHasValidReplay(hasReplay());
	}, [currentScreen]);

	// Initialize game engine - returns true if initialization was performed
	const initEngine = useCallback(
		async (canvas: HTMLCanvasElement): Promise<boolean> => {
			// Prevent double initialization (React Strict Mode)
			if (isInitializingRef.current) {
				return false;
			}
			isInitializingRef.current = true;

			// Destroy existing engine if any
			if (engineRef.current) {
				engineRef.current.destroy();
				engineRef.current = null;
			}

			const engine = new GameEngine({
				onScoreChange: setScore,
				onLengthChange: setSnakeLength,
				onGameOver: (score, length) => {
					setFinalScore(score);
					setFinalLength(length);
					setHasValidReplay(true);
				},
				onStateChange: (status) => {
					if (status === "gameover") {
						setCurrentScreen("gameover");
					}
				},
			});

			await engine.init(canvas);
			engine.setMuted(!settings.soundEnabled);
			engineRef.current = engine;
			isInitializingRef.current = false;
			return true;
		},
		[settings.soundEnabled]
	);

	// Start new game
	const startGame = useCallback(() => {
		if (!engineRef.current || isInitializingRef.current) {
			return;
		}

		setScore(0);
		setSnakeLength(3);
		engineRef.current.reset();
		engineRef.current.start();
	}, []);

	// Reset game (without starting)
	const resetGame = useCallback(() => {
		if (!engineRef.current) return;
		engineRef.current.reset();
		setScore(0);
		setSnakeLength(3);
	}, []);

	// Destroy engine
	const destroyEngine = useCallback(() => {
		if (engineRef.current) {
			engineRef.current.destroy();
			engineRef.current = null;
		}
	}, []);

	// Start replay
	const startReplay = useCallback(() => {
		if (!engineRef.current) return;

		const replay = loadReplay();
		if (!replay) {
			console.warn("No valid replay data found");
			return;
		}

		setReplayData(replay);
		setScore(0);
		setSnakeLength(3);
		engineRef.current.startReplay(replay);
		setCurrentScreen("replay");
	}, []);

	// Stop replay
	const stopReplay = useCallback(() => {
		if (!engineRef.current) return;

		engineRef.current.stopReplay();
		setReplayData(null);
		setCurrentScreen("start");
	}, []);

	// Update settings
	const updateSettings = useCallback(
		(updates: Partial<PlayerSettings>) => {
			setSettings((prev) => ({ ...prev, ...updates }));

			// Apply sound setting to engine
			if (updates.soundEnabled !== undefined && engineRef.current) {
				engineRef.current.setMuted(!updates.soundEnabled);
			}
		},
		[setSettings]
	);

	// Set screen with proper navigation logic
	const setScreen = useCallback((screen: ScreenType) => {
		setCurrentScreen(screen);
	}, []);

	return {
		currentScreen,
		setScreen,
		score,
		snakeLength,
		settings,
		updateSettings,
		initEngine,
		startGame,
		resetGame,
		destroyEngine,
		replayData,
		hasValidReplay,
		startReplay,
		stopReplay,
		finalScore,
		finalLength,
	};
}
```

---

**User**

Przetestowałem - teraz działa znacznie lepiej! Wąż startuje wyżej i idzie w dół, więc mam więcej czasu na reakcję. Sprawdziłem też Leaderboard - ładuje się poprawnie. Settings też działa.

---

**Cursor**

Świetnie! Gra działa poprawnie. Podsumujmy co zostało stworzone:

Projekt ma teraz pełną strukturę FE skeleton. Sprawdzę jeszcze obecną wersję package.json:

Szkielet FE Snake Game jest **kompletny**! Oto podsumowanie:

## ✅ Struktura Projektu

```
snake-game/src/
├── app/                         # Next.js App Router
│   ├── api/leaderboard/route.ts # REST API
│   ├── globals.css              # Game Boy CSS theme
│   ├── layout.tsx               # Root layout z fontami
│   └── page.tsx                 # Główna strona z zarządzaniem ekranami
├── components/
│   ├── ui/                      # Button, Input, Card, Toggle, ColorPicker
│   ├── screens/                 # Start, Game, GameOver, Settings, Leaderboard, Replay
│   └── game/                    # GameCanvas, ScoreDisplay, MuteButton
├── game/                        # Silnik gry (PixiJS)
│   ├── engine.ts                # Główna pętla gry
│   ├── snake.ts                 # Logika węża
│   ├── food.ts                  # Spawn jedzenia (Manhattan distance)
│   ├── input.ts                 # 2-frame input buffer
│   ├── audio.ts                 # Web Audio API (8-bit sounds)
│   ├── effects.ts               # PixiJS rendering + efekty
│   └── replay.ts                # System replay
├── hooks/                       # useGameState, useLocalStorage
├── types/                       # TypeScript types
└── lib/                         # Constants, validation, DB
```

## 📦 Zainstalowane Zależności

| Package      | Wersja | Cel             |
| ------------ | ------ | --------------- |
| Next.js      | 16.0.6 | Framework       |
| React        | 19.2.0 | UI              |
| PixiJS       | 8.14.3 | Rendering WebGL |
| Tailwind CSS | 4      | Styling         |
| Drizzle ORM  | 0.44.7 | Database        |
| Zod          | 4.1.13 | Validation      |

## 🎮 Zaimplementowane Funkcje

- ✅ **Ekran startowy** - tytuł, input nickname, menu
- ✅ **Ekran gry** - canvas PixiJS, score/length display, mute button
- ✅ **Ekran Game Over** - wynik, save score, replay, leaderboard
- ✅ **Leaderboard** - top 10 scores z API
- ✅ **Settings** - toggle sound, high contrast mode
- ✅ **Game Boy aesthetic** - 4-color palette, pixel fonts, retro UI
- ✅ **Silnik gry** - ruch węża, kolizje, spawning jedzenia
- ✅ **Audio** - 8-bit sounds via Web Audio API
- ✅ **Input** - Arrow keys + WASD z bufferem

Gra działa - wąż porusza się, reaguje na kolizje i zapisuje wyniki. Sterowanie klawiaturą wymaga interakcji użytkownika w prawdziwej przeglądarce (nie przez automatyczne testy).

```plaintext
snake-game/src/
├── app/                         # Next.js App Router
│   ├── api/leaderboard/route.ts # REST API
│   ├── globals.css              # Game Boy CSS theme
│   ├── layout.tsx               # Root layout z fontami
│   └── page.tsx                 # Główna strona z zarządzaniem ekranami
├── components/
│   ├── ui/                      # Button, Input, Card, Toggle, ColorPicker
│   ├── screens/                 # Start, Game, GameOver, Settings, Leaderboard, Replay
│   └── game/                    # GameCanvas, ScoreDisplay, MuteButton
├── game/                        # Silnik gry (PixiJS)
│   ├── engine.ts                # Główna pętla gry
│   ├── snake.ts                 # Logika węża
│   ├── food.ts                  # Spawn jedzenia (Manhattan distance)
│   ├── input.ts                 # 2-frame input buffer
│   ├── audio.ts                 # Web Audio API (8-bit sounds)
│   ├── effects.ts               # PixiJS rendering + efekty
│   └── replay.ts                # System replay
├── hooks/                       # useGameState, useLocalStorage
├── types/                       # TypeScript types
└── lib/                         # Constants, validation, DB
```
