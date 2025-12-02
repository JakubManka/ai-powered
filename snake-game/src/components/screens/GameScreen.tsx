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

