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

