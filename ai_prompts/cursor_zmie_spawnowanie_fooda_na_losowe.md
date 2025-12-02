# Zmień spawnowanie fooda na losowe miejsce
_Exported on 12/2/2025 at 12:20:23 GMT+1 from Cursor (2.1.42)_

---

**User**

zmień @snake-game/src/game/food.ts spawnowanie fooda na losowe miejsce na mapie  a nie najbardziej oddalone 

---

**Cursor**

```typescript
// ==========================================
// Food Logic - Spawning algorithm with Manhattan distance
// ==========================================

import type { Position } from '@/types';

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


```

Gotowe! Zmieniłem logikę spawnowania jedzenia z wybierania najbardziej oddalonej pozycji na losowy wybór spośród wszystkich pustych komórek na mapie.

Funkcja `manhattanDistance` została zachowana na wypadek gdyby była używana w innym miejscu projektu, ale jeśli chcesz mogę ją usunąć.

