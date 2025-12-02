// Game constants
export const GRID_SIZE = 20;
export const INITIAL_SNAKE_LENGTH = 3;
export const POINTS_PER_FOOD = 10;
export const BASE_SPEED_MS = 100;
export const MIN_SPEED_MS = 50;
export const SPEED_DECREASE_INTERVAL = 50;
export const SPEED_DECREASE_AMOUNT = 5;
export const MAX_SCORE = 10000;
export const LEADERBOARD_LIMIT = 10;

// Game Boy Green palette
export const COLORS = {
  darkest: "#0f380f", // Snake head, UI text
  dark: "#306230",    // Snake body
  light: "#8bac0f",   // Grid lines, food glow
  lightest: "#9bbc0f", // Background
} as const;

// Speed calculation formula
export const calculateSpeed = (score: number): number => {
  return Math.max(
    MIN_SPEED_MS,
    BASE_SPEED_MS - Math.floor(score / SPEED_DECREASE_INTERVAL) * SPEED_DECREASE_AMOUNT
  );
};

