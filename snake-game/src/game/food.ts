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

// Spawn food at random empty location on the map
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

	// Pick a random empty cell
	const randomIndex = Math.floor(randomFn() * emptyCells.length);
	return emptyCells[randomIndex];
}
