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

