// ==========================================
// LeaderboardScreen Component - Top 10 scores display
// ==========================================

'use client';

import { useState, useEffect } from 'react';
import { Button, Card } from '@/components/ui';
import type { LeaderboardEntry } from '@/types';

export interface LeaderboardScreenProps {
  onBack: () => void;
}

export function LeaderboardScreen({ onBack }: LeaderboardScreenProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/leaderboard');
        const data = await response.json();

        if (data.success) {
          setEntries(data.data);
        } else {
          setError(data.error || 'Failed to load leaderboard');
        }
      } catch {
        setError('Network error. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 animate-slide-in">
      {/* Title */}
      <h1 className="font-pixel text-xl text-gb-darkest text-shadow-gb">
        LEADERBOARD
      </h1>

      {/* Leaderboard Table */}
      <Card className="w-full max-w-md overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="font-pixel text-sm text-gb-dark">
              Loading<span className="loading-dots"></span>
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <p className="font-pixel text-sm text-red-600">{error}</p>
            <Button size="small" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="font-pixel text-sm text-gb-dark text-center">
              No scores yet.<br />Be the first!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Score</th>
                  <th>Len</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={entry.id}>
                    <td className="font-pixel text-sm">
                      {index + 1}
                    </td>
                    <td className="font-retro text-lg truncate max-w-[120px]">
                      {entry.nick || 'Anonymous'}
                    </td>
                    <td className="font-pixel text-sm text-gb-darkest">
                      {entry.score.toLocaleString()}
                    </td>
                    <td className="font-pixel text-sm">
                      {entry.snakeLength}
                    </td>
                    <td className="font-retro text-sm text-gb-dark">
                      {formatDate(entry.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Back Button */}
      <div className="w-full max-w-xs">
        <Button variant="secondary" onClick={onBack} className="w-full">
          Back
        </Button>
      </div>
    </div>
  );
}

