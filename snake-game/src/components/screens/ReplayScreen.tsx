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

