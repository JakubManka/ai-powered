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
