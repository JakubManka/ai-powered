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

