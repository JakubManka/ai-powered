// ==========================================
// ScoreDisplay Component - Shows current score and length
// ==========================================

'use client';

export interface ScoreDisplayProps {
  score: number;
  length: number;
}

export function ScoreDisplay({ score, length }: ScoreDisplayProps) {
  return (
    <div className="flex justify-between items-center w-full px-2 py-3">
      <div className="flex flex-col items-start">
        <span className="font-pixel text-[10px] text-gb-dark uppercase opacity-80">
          Score
        </span>
        <span className="font-pixel text-lg text-gb-darkest">
          {score.toString().padStart(5, '0')}
        </span>
      </div>
      
      <div className="flex flex-col items-end">
        <span className="font-pixel text-[10px] text-gb-dark uppercase opacity-80">
          Length
        </span>
        <span className="font-pixel text-lg text-gb-darkest">
          {length.toString().padStart(3, '0')}
        </span>
      </div>
    </div>
  );
}

