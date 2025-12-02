// ==========================================
// Snake Logic - Movement and collision detection
// ==========================================

import type { Snake, Position, Direction } from '@/types';

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
    direction: 'DOWN',
    nextDirection: 'DOWN',
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

