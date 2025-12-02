# Problem z odtwarzaniem replay w grze

_Exported on 12/2/2025 at 12:20:40 GMT+1 from Cursor (2.1.42)_

---

**User**

jak klikam watch replay to włącza sie gra gdzie moge sterować zamiast pokazywać aktualny replay.

Przanalizuj dokładnie gdzie jest błąd

---

**Cursor**

Przeanalizuję kod związany z funkcją replay, żeby znaleźć błąd.

```javascript
const handleCanvasReady = async (canvas: HTMLCanvasElement) => {
    const initialized = await initEngine(canvas);
    // Only start game if this call actually initialized the engine
    if (initialized) {
      startGame();
    }
  }, [initEngine, startGame]);
```

Widzę potencjalny problem. Sprawdzę dokładniej `ReplayScreen` i `handleCanvasReady`:

```javascript
const handleWatchReplay = useCallback(() => {
	startReplay();
}, [startReplay]);
```

```javascript
const startReplay = useCallback(() => {
	if (!engineRef.current) return; // <--- TUTAJ JEST PROBLEM!

	const replay = loadReplay();
	if (!replay) {
		console.warn("No valid replay data found");
		return;
	}

	setReplayData(replay);
	setScore(0);
	setSnakeLength(3);
	engineRef.current.startReplay(replay);
	setCurrentScreen("replay");
}, []);
```

```javascript
const handleCanvasReady = async (canvas: HTMLCanvasElement) => {
    const initialized = await initEngine(canvas);
    // Only start game if this call actually initialized the engine
    if (initialized) {
      startGame();  // <--- TO URUCHAMIA NORMALNĄ GRĘ, NIE REPLAY!
    }
  };
```

Teraz widzę problem! Sprawdzę jak `page.tsx` przekazuje callback do `ReplayScreen`:

```javascript
const handleWatchReplay = useCallback(() => {
	startReplay();
}, [startReplay]);
```

```javascript
const startReplay = useCallback(() => {
	if (!engineRef.current) return; // <-- Problem #1: engineRef.current to stary engine

	const replay = loadReplay();
	if (!replay) {
		console.warn("No valid replay data found");
		return;
	}

	setReplayData(replay);
	setScore(0);
	setSnakeLength(3);
	engineRef.current.startReplay(replay); // <-- Zaczyna replay na STARYM engine
	setCurrentScreen("replay"); // <-- Zmienia ekran na 'replay'
}, []);
```

```javascript
     const handleCanvasReady = useCallback(async (canvas: HTMLCanvasElement) => {
       const initialized = await initEngine(canvas);  // <-- Tworzy NOWY engine!
       if (initialized) {
         startGame();  // <-- I uruchamia normalną grę!!!
       }
     }, [initEngine, startGame]);
```

Znalazłem **DOKŁADNY BUG**! Problem jest w sekwencji zdarzeń:

## Analiza problemu

### Obecny (wadliwy) flow gdy klikasz "Watch Replay":

1. **`handleWatchReplay()`** wywołuje `startReplay()`
2. **`startReplay()`** w `useGameState.ts`:
   - Wywołuje `engineRef.current.startReplay(replay)` na **STARYM engine** (który jest podpięty do starego canvasu z `GameOverScreen`)
   - Ustawia `setCurrentScreen('replay')`
3. React re-renderuje → `ReplayScreen` montuje **NOWY canvas**
4. **Nowy canvas wywołuje `onCanvasReady`** → `handleCanvasReady`
5. **`handleCanvasReady`**:
   - Tworzy **NOWY engine** dla nowego canvasu
   - Wywołuje **`startGame()`** ← **TO JEST BUG!**

### Rezultat:

- Replay był uruchomiony na starym engine (niewidoczny canvas)
- Na nowym canvasie startuje **normalna gra** z możliwością sterowania

## Rozwiązanie

Muszę zmienić flow tak, aby:

1. `startReplay()` tylko przygotowywał dane i zmieniał ekran (bez uruchamiania replay)
2. `handleCanvasReady` rozróżniał czy to ekran gry czy replay i odpowiednio reagował

```typescript
// ==========================================
// useGameState Hook - Game state management
// ==========================================

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ScreenType, PlayerSettings, ReplayData } from "@/types";
import { GameEngine } from "@/game/engine";
import { loadReplay, hasReplay } from "@/game/replay";
import { useLocalStorage } from "./useLocalStorage";

const DEFAULT_SETTINGS: PlayerSettings = {
	soundEnabled: true,
	highContrastMode: false,
	foregroundColor: "#000000",
	backgroundColor: "#ffffff",
	nickname: "",
};

export interface GameStateHook {
	// Navigation
	currentScreen: ScreenType;
	setScreen: (screen: ScreenType) => void;

	// Game stats
	score: number;
	snakeLength: number;

	// Player settings
	settings: PlayerSettings;
	updateSettings: (updates: Partial<PlayerSettings>) => void;

	// Game engine
	initEngine: (canvas: HTMLCanvasElement) => Promise<void>;
	startGame: () => void;
	resetGame: () => void;
	destroyEngine: () => void;

	// Replay
	replayData: ReplayData | null;
	hasValidReplay: boolean;
	startReplay: () => void;
	stopReplay: () => void;

	// Final game stats (after game over)
	finalScore: number;
	finalLength: number;
}

export function useGameState(): GameStateHook {
	// Navigation state
	const [currentScreen, setCurrentScreen] = useState<ScreenType>("start");

	// Game stats
	const [score, setScore] = useState(0);
	const [snakeLength, setSnakeLength] = useState(3);
	const [finalScore, setFinalScore] = useState(0);
	const [finalLength, setFinalLength] = useState(3);

	// Replay state
	const [replayData, setReplayData] = useState<ReplayData | null>(null);
	const [hasValidReplay, setHasValidReplay] = useState(false);

	// Settings with localStorage persistence
	const [settings, setSettings] = useLocalStorage<PlayerSettings>(
		"snake_settings",
		DEFAULT_SETTINGS
	);

	// Game engine reference
	const engineRef = useRef<GameEngine | null>(null);
	const isInitializingRef = useRef(false);

	// Check for valid replay on mount
	useEffect(() => {
		setHasValidReplay(hasReplay());
	}, [currentScreen]);

	// Initialize game engine - returns true if initialization was performed
	const initEngine = useCallback(
		async (canvas: HTMLCanvasElement): Promise<boolean> => {
			// Prevent double initialization (React Strict Mode)
			if (isInitializingRef.current) {
				return false;
			}
			isInitializingRef.current = true;

			// Destroy existing engine if any
			if (engineRef.current) {
				engineRef.current.destroy();
				engineRef.current = null;
			}

			const engine = new GameEngine({
				onScoreChange: setScore,
				onLengthChange: setSnakeLength,
				onGameOver: (score, length) => {
					setFinalScore(score);
					setFinalLength(length);
					setHasValidReplay(true);
				},
				onStateChange: (status) => {
					if (status === "gameover") {
						setCurrentScreen("gameover");
					}
				},
			});

			await engine.init(canvas);
			engine.setMuted(!settings.soundEnabled);
			engineRef.current = engine;
			isInitializingRef.current = false;
			return true;
		},
		[settings.soundEnabled]
	);

	// Start new game
	const startGame = useCallback(() => {
		if (!engineRef.current || isInitializingRef.current) {
			return;
		}

		setScore(0);
		setSnakeLength(3);
		engineRef.current.reset();
		engineRef.current.start();
	}, []);

	// Reset game (without starting)
	const resetGame = useCallback(() => {
		if (!engineRef.current) return;
		engineRef.current.reset();
		setScore(0);
		setSnakeLength(3);
	}, []);

	// Destroy engine
	const destroyEngine = useCallback(() => {
		if (engineRef.current) {
			engineRef.current.destroy();
			engineRef.current = null;
		}
	}, []);

	// Prepare replay - loads data and changes screen (engine will be initialized when canvas is ready)
	const startReplay = useCallback(() => {
		const replay = loadReplay();
		if (!replay) {
			console.warn("No valid replay data found");
			return;
		}

		// Destroy existing engine - new one will be created for replay canvas
		if (engineRef.current) {
			engineRef.current.destroy();
			engineRef.current = null;
		}
		isInitializingRef.current = false;

		setReplayData(replay);
		setScore(0);
		setSnakeLength(3);
		setCurrentScreen("replay");
		// Note: engine.startReplay() will be called by runReplayEngine() after canvas is ready
	}, []);

	// Run replay on initialized engine
	const runReplayEngine = useCallback(() => {
		if (!engineRef.current || !replayData) return;
		engineRef.current.startReplay(replayData);
	}, [replayData]);

	// Stop replay
	const stopReplay = useCallback(() => {
		if (!engineRef.current) return;

		engineRef.current.stopReplay();
		setReplayData(null);
		setCurrentScreen("start");
	}, []);

	// Update settings
	const updateSettings = useCallback(
		(updates: Partial<PlayerSettings>) => {
			setSettings((prev) => ({ ...prev, ...updates }));

			// Apply sound setting to engine
			if (updates.soundEnabled !== undefined && engineRef.current) {
				engineRef.current.setMuted(!updates.soundEnabled);
			}
		},
		[setSettings]
	);

	// Set screen with proper navigation logic
	const setScreen = useCallback((screen: ScreenType) => {
		setCurrentScreen(screen);
	}, []);

	return {
		currentScreen,
		setScreen,
		score,
		snakeLength,
		settings,
		updateSettings,
		initEngine,
		startGame,
		resetGame,
		destroyEngine,
		replayData,
		hasValidReplay,
		startReplay,
		stopReplay,
		finalScore,
		finalLength,
	};
}
```

Muszę dodać `runReplayEngine` do interfejsu i return statement:

```typescript
// ==========================================
// useGameState Hook - Game state management
// ==========================================

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ScreenType, PlayerSettings, ReplayData } from "@/types";
import { GameEngine } from "@/game/engine";
import { loadReplay, hasReplay } from "@/game/replay";
import { useLocalStorage } from "./useLocalStorage";

const DEFAULT_SETTINGS: PlayerSettings = {
	soundEnabled: true,
	highContrastMode: false,
	foregroundColor: "#000000",
	backgroundColor: "#ffffff",
	nickname: "",
};

export interface GameStateHook {
	// Navigation
	currentScreen: ScreenType;
	setScreen: (screen: ScreenType) => void;

	// Game stats
	score: number;
	snakeLength: number;

	// Player settings
	settings: PlayerSettings;
	updateSettings: (updates: Partial<PlayerSettings>) => void;

	// Game engine
	initEngine: (canvas: HTMLCanvasElement) => Promise<void>;
	startGame: () => void;
	resetGame: () => void;
	destroyEngine: () => void;

	// Replay
	replayData: ReplayData | null;
	hasValidReplay: boolean;
	startReplay: () => void;
	runReplayEngine: () => void;
	stopReplay: () => void;

	// Final game stats (after game over)
	finalScore: number;
	finalLength: number;
}

export function useGameState(): GameStateHook {
	// Navigation state
	const [currentScreen, setCurrentScreen] = useState<ScreenType>("start");

	// Game stats
	const [score, setScore] = useState(0);
	const [snakeLength, setSnakeLength] = useState(3);
	const [finalScore, setFinalScore] = useState(0);
	const [finalLength, setFinalLength] = useState(3);

	// Replay state
	const [replayData, setReplayData] = useState<ReplayData | null>(null);
	const [hasValidReplay, setHasValidReplay] = useState(false);

	// Settings with localStorage persistence
	const [settings, setSettings] = useLocalStorage<PlayerSettings>(
		"snake_settings",
		DEFAULT_SETTINGS
	);

	// Game engine reference
	const engineRef = useRef<GameEngine | null>(null);
	const isInitializingRef = useRef(false);

	// Check for valid replay on mount
	useEffect(() => {
		setHasValidReplay(hasReplay());
	}, [currentScreen]);

	// Initialize game engine - returns true if initialization was performed
	const initEngine = useCallback(
		async (canvas: HTMLCanvasElement): Promise<boolean> => {
			// Prevent double initialization (React Strict Mode)
			if (isInitializingRef.current) {
				return false;
			}
			isInitializingRef.current = true;

			// Destroy existing engine if any
			if (engineRef.current) {
				engineRef.current.destroy();
				engineRef.current = null;
			}

			const engine = new GameEngine({
				onScoreChange: setScore,
				onLengthChange: setSnakeLength,
				onGameOver: (score, length) => {
					setFinalScore(score);
					setFinalLength(length);
					setHasValidReplay(true);
				},
				onStateChange: (status) => {
					if (status === "gameover") {
						setCurrentScreen("gameover");
					}
				},
			});

			await engine.init(canvas);
			engine.setMuted(!settings.soundEnabled);
			engineRef.current = engine;
			isInitializingRef.current = false;
			return true;
		},
		[settings.soundEnabled]
	);

	// Start new game
	const startGame = useCallback(() => {
		if (!engineRef.current || isInitializingRef.current) {
			return;
		}

		setScore(0);
		setSnakeLength(3);
		engineRef.current.reset();
		engineRef.current.start();
	}, []);

	// Reset game (without starting)
	const resetGame = useCallback(() => {
		if (!engineRef.current) return;
		engineRef.current.reset();
		setScore(0);
		setSnakeLength(3);
	}, []);

	// Destroy engine
	const destroyEngine = useCallback(() => {
		if (engineRef.current) {
			engineRef.current.destroy();
			engineRef.current = null;
		}
	}, []);

	// Prepare replay - loads data and changes screen (engine will be initialized when canvas is ready)
	const startReplay = useCallback(() => {
		const replay = loadReplay();
		if (!replay) {
			console.warn("No valid replay data found");
			return;
		}

		// Destroy existing engine - new one will be created for replay canvas
		if (engineRef.current) {
			engineRef.current.destroy();
			engineRef.current = null;
		}
		isInitializingRef.current = false;

		setReplayData(replay);
		setScore(0);
		setSnakeLength(3);
		setCurrentScreen("replay");
		// Note: engine.startReplay() will be called by runReplayEngine() after canvas is ready
	}, []);

	// Run replay on initialized engine
	const runReplayEngine = useCallback(() => {
		if (!engineRef.current || !replayData) return;
		engineRef.current.startReplay(replayData);
	}, [replayData]);

	// Stop replay
	const stopReplay = useCallback(() => {
		if (!engineRef.current) return;

		engineRef.current.stopReplay();
		setReplayData(null);
		setCurrentScreen("start");
	}, []);

	// Update settings
	const updateSettings = useCallback(
		(updates: Partial<PlayerSettings>) => {
			setSettings((prev) => ({ ...prev, ...updates }));

			// Apply sound setting to engine
			if (updates.soundEnabled !== undefined && engineRef.current) {
				engineRef.current.setMuted(!updates.soundEnabled);
			}
		},
		[setSettings]
	);

	// Set screen with proper navigation logic
	const setScreen = useCallback((screen: ScreenType) => {
		setCurrentScreen(screen);
	}, []);

	return {
		currentScreen,
		setScreen,
		score,
		snakeLength,
		settings,
		updateSettings,
		initEngine,
		startGame,
		resetGame,
		destroyEngine,
		replayData,
		hasValidReplay,
		startReplay,
		stopReplay,
		finalScore,
		finalLength,
	};
}
```

```typescript
// ==========================================
// useGameState Hook - Game state management
// ==========================================

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ScreenType, PlayerSettings, ReplayData } from "@/types";
import { GameEngine } from "@/game/engine";
import { loadReplay, hasReplay } from "@/game/replay";
import { useLocalStorage } from "./useLocalStorage";

const DEFAULT_SETTINGS: PlayerSettings = {
	soundEnabled: true,
	highContrastMode: false,
	foregroundColor: "#000000",
	backgroundColor: "#ffffff",
	nickname: "",
};

export interface GameStateHook {
	// Navigation
	currentScreen: ScreenType;
	setScreen: (screen: ScreenType) => void;

	// Game stats
	score: number;
	snakeLength: number;

	// Player settings
	settings: PlayerSettings;
	updateSettings: (updates: Partial<PlayerSettings>) => void;

	// Game engine
	initEngine: (canvas: HTMLCanvasElement) => Promise<void>;
	startGame: () => void;
	resetGame: () => void;
	destroyEngine: () => void;

	// Replay
	replayData: ReplayData | null;
	hasValidReplay: boolean;
	startReplay: () => void;
	runReplayEngine: () => void;
	stopReplay: () => void;

	// Final game stats (after game over)
	finalScore: number;
	finalLength: number;
}

export function useGameState(): GameStateHook {
	// Navigation state
	const [currentScreen, setCurrentScreen] = useState<ScreenType>("start");

	// Game stats
	const [score, setScore] = useState(0);
	const [snakeLength, setSnakeLength] = useState(3);
	const [finalScore, setFinalScore] = useState(0);
	const [finalLength, setFinalLength] = useState(3);

	// Replay state
	const [replayData, setReplayData] = useState<ReplayData | null>(null);
	const [hasValidReplay, setHasValidReplay] = useState(false);

	// Settings with localStorage persistence
	const [settings, setSettings] = useLocalStorage<PlayerSettings>(
		"snake_settings",
		DEFAULT_SETTINGS
	);

	// Game engine reference
	const engineRef = useRef<GameEngine | null>(null);
	const isInitializingRef = useRef(false);

	// Check for valid replay on mount
	useEffect(() => {
		setHasValidReplay(hasReplay());
	}, [currentScreen]);

	// Initialize game engine - returns true if initialization was performed
	const initEngine = useCallback(
		async (canvas: HTMLCanvasElement): Promise<boolean> => {
			// Prevent double initialization (React Strict Mode)
			if (isInitializingRef.current) {
				return false;
			}
			isInitializingRef.current = true;

			// Destroy existing engine if any
			if (engineRef.current) {
				engineRef.current.destroy();
				engineRef.current = null;
			}

			const engine = new GameEngine({
				onScoreChange: setScore,
				onLengthChange: setSnakeLength,
				onGameOver: (score, length) => {
					setFinalScore(score);
					setFinalLength(length);
					setHasValidReplay(true);
				},
				onStateChange: (status) => {
					if (status === "gameover") {
						setCurrentScreen("gameover");
					}
				},
			});

			await engine.init(canvas);
			engine.setMuted(!settings.soundEnabled);
			engineRef.current = engine;
			isInitializingRef.current = false;
			return true;
		},
		[settings.soundEnabled]
	);

	// Start new game
	const startGame = useCallback(() => {
		if (!engineRef.current || isInitializingRef.current) {
			return;
		}

		setScore(0);
		setSnakeLength(3);
		engineRef.current.reset();
		engineRef.current.start();
	}, []);

	// Reset game (without starting)
	const resetGame = useCallback(() => {
		if (!engineRef.current) return;
		engineRef.current.reset();
		setScore(0);
		setSnakeLength(3);
	}, []);

	// Destroy engine
	const destroyEngine = useCallback(() => {
		if (engineRef.current) {
			engineRef.current.destroy();
			engineRef.current = null;
		}
	}, []);

	// Prepare replay - loads data and changes screen (engine will be initialized when canvas is ready)
	const startReplay = useCallback(() => {
		const replay = loadReplay();
		if (!replay) {
			console.warn("No valid replay data found");
			return;
		}

		// Destroy existing engine - new one will be created for replay canvas
		if (engineRef.current) {
			engineRef.current.destroy();
			engineRef.current = null;
		}
		isInitializingRef.current = false;

		setReplayData(replay);
		setScore(0);
		setSnakeLength(3);
		setCurrentScreen("replay");
		// Note: engine.startReplay() will be called by runReplayEngine() after canvas is ready
	}, []);

	// Run replay on initialized engine
	const runReplayEngine = useCallback(() => {
		if (!engineRef.current || !replayData) return;
		engineRef.current.startReplay(replayData);
	}, [replayData]);

	// Stop replay
	const stopReplay = useCallback(() => {
		if (!engineRef.current) return;

		engineRef.current.stopReplay();
		setReplayData(null);
		setCurrentScreen("start");
	}, []);

	// Update settings
	const updateSettings = useCallback(
		(updates: Partial<PlayerSettings>) => {
			setSettings((prev) => ({ ...prev, ...updates }));

			// Apply sound setting to engine
			if (updates.soundEnabled !== undefined && engineRef.current) {
				engineRef.current.setMuted(!updates.soundEnabled);
			}
		},
		[setSettings]
	);

	// Set screen with proper navigation logic
	const setScreen = useCallback((screen: ScreenType) => {
		setCurrentScreen(screen);
	}, []);

	return {
		currentScreen,
		setScreen,
		score,
		snakeLength,
		settings,
		updateSettings,
		initEngine,
		startGame,
		resetGame,
		destroyEngine,
		replayData,
		hasValidReplay,
		startReplay,
		runReplayEngine,
		stopReplay,
		finalScore,
		finalLength,
	};
}
```

Teraz zaktualizuję `page.tsx` - dodam osobny callback dla replay:

```typescriptreact
// ==========================================
// Main Page - Snake Game Entry Point
// ==========================================

'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import {
  StartScreen,
  GameScreen,
  GameOverScreen,
  SettingsScreen,
  LeaderboardScreen,
  ReplayScreen,
} from '@/components/screens';
import { useGameState } from '@/hooks';
import type { ScreenType } from '@/types';

export default function Home() {
  const {
    currentScreen,
    setScreen,
    score,
    snakeLength,
    settings,
    updateSettings,
    initEngine,
    startGame,
    resetGame,
    destroyEngine,
    replayData,
    hasValidReplay,
    startReplay,
    runReplayEngine,
    stopReplay,
    finalScore,
    finalLength,
  } = useGameState();

  // Track previous screen for back navigation
  const previousScreenRef = useRef<ScreenType>('start');
  const [isMounted, setIsMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Track screen changes for back navigation
  useEffect(() => {
    if (currentScreen !== 'settings' && currentScreen !== 'leaderboard') {
      previousScreenRef.current = currentScreen;
    }
  }, [currentScreen]);

  // Canvas ready handler - starts game automatically since canvas is only rendered on game/replay screens
  const handleCanvasReady = useCallback(async (canvas: HTMLCanvasElement) => {
    const initialized = await initEngine(canvas);
    // Only start game if this call actually initialized the engine
    if (initialized) {
      startGame();
    }
  }, [initEngine, startGame]);

  // Save score to leaderboard
  const handleSaveScore = useCallback(async () => {
    try {
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nick: settings.nickname || 'Anonymous',
          score: finalScore,
          snakeLength: finalLength,
        }),
      });

      const data = await response.json();
      return data;
    } catch {
      return { success: false, error: 'Network error' };
    }
  }, [settings.nickname, finalScore, finalLength]);

  // Navigation handlers
  const handleStartGame = useCallback(() => {
    setScreen('game');
  }, [setScreen]);

  const handlePlayAgain = useCallback(() => {
    resetGame();
    setScreen('game');
  }, [resetGame, setScreen]);

  const handleWatchReplay = useCallback(() => {
    startReplay();
  }, [startReplay]);

  const handleStopReplay = useCallback(() => {
    stopReplay();
  }, [stopReplay]);

  const handleBackNavigation = useCallback(() => {
    // Return to appropriate screen based on context
    const target = previousScreenRef.current === 'gameover' ? 'gameover' : 'start';
    setScreen(target);
  }, [setScreen]);

  const handleReturnToMenu = useCallback(() => {
    destroyEngine();
    setScreen('start');
  }, [destroyEngine, setScreen]);

  // Toggle mute
  const handleToggleMute = useCallback(() => {
    updateSettings({ soundEnabled: !settings.soundEnabled });
  }, [settings.soundEnabled, updateSettings]);

  // Apply high contrast mode
  const containerClasses = settings.highContrastMode ? 'high-contrast' : '';
  const customStyles = settings.highContrastMode
    ? {
        '--hc-foreground': settings.foregroundColor,
        '--hc-background': settings.backgroundColor,
      } as React.CSSProperties
    : {};

  // Prevent SSR hydration issues
  if (!isMounted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gb-lightest">
        <div className="font-pixel text-gb-darkest">Loading...</div>
      </main>
    );
  }

  return (
    <main
      className={`min-h-screen flex items-center justify-center bg-gb-lightest ${containerClasses}`}
      style={customStyles}
    >
      <div className="game-frame">
        <div className="game-screen min-w-[420px] min-h-[520px] flex items-center justify-center">
          {/* Start Screen */}
          {currentScreen === 'start' && (
            <StartScreen
              nickname={settings.nickname}
              onNicknameChange={(nick) => updateSettings({ nickname: nick })}
              onStartGame={handleStartGame}
              onOpenSettings={() => setScreen('settings')}
              onOpenLeaderboard={() => setScreen('leaderboard')}
            />
          )}

          {/* Game Screen */}
          {currentScreen === 'game' && (
            <GameScreen
              score={score}
              length={snakeLength}
              muted={!settings.soundEnabled}
              onCanvasReady={handleCanvasReady}
              onToggleMute={handleToggleMute}
            />
          )}

          {/* Game Over Screen */}
          {currentScreen === 'gameover' && (
            <GameOverScreen
              score={finalScore}
              length={finalLength}
              nickname={settings.nickname}
              hasReplay={hasValidReplay}
              onNicknameChange={(nick) => updateSettings({ nickname: nick })}
              onSaveScore={handleSaveScore}
              onPlayAgain={handlePlayAgain}
              onWatchReplay={handleWatchReplay}
              onViewLeaderboard={() => setScreen('leaderboard')}
              onReturnToMenu={handleReturnToMenu}
            />
          )}

          {/* Settings Screen */}
          {currentScreen === 'settings' && (
            <SettingsScreen
              settings={settings}
              onSave={(newSettings) => updateSettings(newSettings)}
              onBack={handleBackNavigation}
            />
          )}

          {/* Leaderboard Screen */}
          {currentScreen === 'leaderboard' && (
            <LeaderboardScreen onBack={handleBackNavigation} />
          )}

          {/* Replay Screen */}
          {currentScreen === 'replay' && (
            <ReplayScreen
              replayData={replayData}
              score={score}
              length={snakeLength}
              onCanvasReady={handleCanvasReady}
              onCancel={handleStopReplay}
            />
          )}
        </div>
      </div>
    </main>
  );
}

```

```typescriptreact
// ==========================================
// Main Page - Snake Game Entry Point
// ==========================================

'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import {
  StartScreen,
  GameScreen,
  GameOverScreen,
  SettingsScreen,
  LeaderboardScreen,
  ReplayScreen,
} from '@/components/screens';
import { useGameState } from '@/hooks';
import type { ScreenType } from '@/types';

export default function Home() {
  const {
    currentScreen,
    setScreen,
    score,
    snakeLength,
    settings,
    updateSettings,
    initEngine,
    startGame,
    resetGame,
    destroyEngine,
    replayData,
    hasValidReplay,
    startReplay,
    runReplayEngine,
    stopReplay,
    finalScore,
    finalLength,
  } = useGameState();

  // Track previous screen for back navigation
  const previousScreenRef = useRef<ScreenType>('start');
  const [isMounted, setIsMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Track screen changes for back navigation
  useEffect(() => {
    if (currentScreen !== 'settings' && currentScreen !== 'leaderboard') {
      previousScreenRef.current = currentScreen;
    }
  }, [currentScreen]);

  // Canvas ready handler - starts game automatically
  const handleCanvasReady = useCallback(async (canvas: HTMLCanvasElement) => {
    const initialized = await initEngine(canvas);
    // Only start game if this call actually initialized the engine
    if (initialized) {
      startGame();
    }
  }, [initEngine, startGame]);

  // Replay canvas ready handler - initializes engine and starts replay playback
  const handleReplayCanvasReady = useCallback(async (canvas: HTMLCanvasElement) => {
    const initialized = await initEngine(canvas);
    // Only start replay if this call actually initialized the engine
    if (initialized) {
      runReplayEngine();
    }
  }, [initEngine, runReplayEngine]);

  // Save score to leaderboard
  const handleSaveScore = useCallback(async () => {
    try {
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nick: settings.nickname || 'Anonymous',
          score: finalScore,
          snakeLength: finalLength,
        }),
      });

      const data = await response.json();
      return data;
    } catch {
      return { success: false, error: 'Network error' };
    }
  }, [settings.nickname, finalScore, finalLength]);

  // Navigation handlers
  const handleStartGame = useCallback(() => {
    setScreen('game');
  }, [setScreen]);

  const handlePlayAgain = useCallback(() => {
    resetGame();
    setScreen('game');
  }, [resetGame, setScreen]);

  const handleWatchReplay = useCallback(() => {
    startReplay();
  }, [startReplay]);

  const handleStopReplay = useCallback(() => {
    stopReplay();
  }, [stopReplay]);

  const handleBackNavigation = useCallback(() => {
    // Return to appropriate screen based on context
    const target = previousScreenRef.current === 'gameover' ? 'gameover' : 'start';
    setScreen(target);
  }, [setScreen]);

  const handleReturnToMenu = useCallback(() => {
    destroyEngine();
    setScreen('start');
  }, [destroyEngine, setScreen]);

  // Toggle mute
  const handleToggleMute = useCallback(() => {
    updateSettings({ soundEnabled: !settings.soundEnabled });
  }, [settings.soundEnabled, updateSettings]);

  // Apply high contrast mode
  const containerClasses = settings.highContrastMode ? 'high-contrast' : '';
  const customStyles = settings.highContrastMode
    ? {
        '--hc-foreground': settings.foregroundColor,
        '--hc-background': settings.backgroundColor,
      } as React.CSSProperties
    : {};

  // Prevent SSR hydration issues
  if (!isMounted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gb-lightest">
        <div className="font-pixel text-gb-darkest">Loading...</div>
      </main>
    );
  }

  return (
    <main
      className={`min-h-screen flex items-center justify-center bg-gb-lightest ${containerClasses}`}
      style={customStyles}
    >
      <div className="game-frame">
        <div className="game-screen min-w-[420px] min-h-[520px] flex items-center justify-center">
          {/* Start Screen */}
          {currentScreen === 'start' && (
            <StartScreen
              nickname={settings.nickname}
              onNicknameChange={(nick) => updateSettings({ nickname: nick })}
              onStartGame={handleStartGame}
              onOpenSettings={() => setScreen('settings')}
              onOpenLeaderboard={() => setScreen('leaderboard')}
            />
          )}

          {/* Game Screen */}
          {currentScreen === 'game' && (
            <GameScreen
              score={score}
              length={snakeLength}
              muted={!settings.soundEnabled}
              onCanvasReady={handleCanvasReady}
              onToggleMute={handleToggleMute}
            />
          )}

          {/* Game Over Screen */}
          {currentScreen === 'gameover' && (
            <GameOverScreen
              score={finalScore}
              length={finalLength}
              nickname={settings.nickname}
              hasReplay={hasValidReplay}
              onNicknameChange={(nick) => updateSettings({ nickname: nick })}
              onSaveScore={handleSaveScore}
              onPlayAgain={handlePlayAgain}
              onWatchReplay={handleWatchReplay}
              onViewLeaderboard={() => setScreen('leaderboard')}
              onReturnToMenu={handleReturnToMenu}
            />
          )}

          {/* Settings Screen */}
          {currentScreen === 'settings' && (
            <SettingsScreen
              settings={settings}
              onSave={(newSettings) => updateSettings(newSettings)}
              onBack={handleBackNavigation}
            />
          )}

          {/* Leaderboard Screen */}
          {currentScreen === 'leaderboard' && (
            <LeaderboardScreen onBack={handleBackNavigation} />
          )}

          {/* Replay Screen */}
          {currentScreen === 'replay' && (
            <ReplayScreen
              replayData={replayData}
              score={score}
              length={snakeLength}
              onCanvasReady={handleCanvasReady}
              onCancel={handleStopReplay}
            />
          )}
        </div>
      </div>
    </main>
  );
}

```

```typescriptreact
// ==========================================
// Main Page - Snake Game Entry Point
// ==========================================

'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import {
  StartScreen,
  GameScreen,
  GameOverScreen,
  SettingsScreen,
  LeaderboardScreen,
  ReplayScreen,
} from '@/components/screens';
import { useGameState } from '@/hooks';
import type { ScreenType } from '@/types';

export default function Home() {
  const {
    currentScreen,
    setScreen,
    score,
    snakeLength,
    settings,
    updateSettings,
    initEngine,
    startGame,
    resetGame,
    destroyEngine,
    replayData,
    hasValidReplay,
    startReplay,
    runReplayEngine,
    stopReplay,
    finalScore,
    finalLength,
  } = useGameState();

  // Track previous screen for back navigation
  const previousScreenRef = useRef<ScreenType>('start');
  const [isMounted, setIsMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Track screen changes for back navigation
  useEffect(() => {
    if (currentScreen !== 'settings' && currentScreen !== 'leaderboard') {
      previousScreenRef.current = currentScreen;
    }
  }, [currentScreen]);

  // Canvas ready handler - starts game automatically
  const handleCanvasReady = useCallback(async (canvas: HTMLCanvasElement) => {
    const initialized = await initEngine(canvas);
    // Only start game if this call actually initialized the engine
    if (initialized) {
      startGame();
    }
  }, [initEngine, startGame]);

  // Replay canvas ready handler - initializes engine and starts replay playback
  const handleReplayCanvasReady = useCallback(async (canvas: HTMLCanvasElement) => {
    const initialized = await initEngine(canvas);
    // Only start replay if this call actually initialized the engine
    if (initialized) {
      runReplayEngine();
    }
  }, [initEngine, runReplayEngine]);

  // Save score to leaderboard
  const handleSaveScore = useCallback(async () => {
    try {
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nick: settings.nickname || 'Anonymous',
          score: finalScore,
          snakeLength: finalLength,
        }),
      });

      const data = await response.json();
      return data;
    } catch {
      return { success: false, error: 'Network error' };
    }
  }, [settings.nickname, finalScore, finalLength]);

  // Navigation handlers
  const handleStartGame = useCallback(() => {
    setScreen('game');
  }, [setScreen]);

  const handlePlayAgain = useCallback(() => {
    resetGame();
    setScreen('game');
  }, [resetGame, setScreen]);

  const handleWatchReplay = useCallback(() => {
    startReplay();
  }, [startReplay]);

  const handleStopReplay = useCallback(() => {
    stopReplay();
  }, [stopReplay]);

  const handleBackNavigation = useCallback(() => {
    // Return to appropriate screen based on context
    const target = previousScreenRef.current === 'gameover' ? 'gameover' : 'start';
    setScreen(target);
  }, [setScreen]);

  const handleReturnToMenu = useCallback(() => {
    destroyEngine();
    setScreen('start');
  }, [destroyEngine, setScreen]);

  // Toggle mute
  const handleToggleMute = useCallback(() => {
    updateSettings({ soundEnabled: !settings.soundEnabled });
  }, [settings.soundEnabled, updateSettings]);

  // Apply high contrast mode
  const containerClasses = settings.highContrastMode ? 'high-contrast' : '';
  const customStyles = settings.highContrastMode
    ? {
        '--hc-foreground': settings.foregroundColor,
        '--hc-background': settings.backgroundColor,
      } as React.CSSProperties
    : {};

  // Prevent SSR hydration issues
  if (!isMounted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gb-lightest">
        <div className="font-pixel text-gb-darkest">Loading...</div>
      </main>
    );
  }

  return (
    <main
      className={`min-h-screen flex items-center justify-center bg-gb-lightest ${containerClasses}`}
      style={customStyles}
    >
      <div className="game-frame">
        <div className="game-screen min-w-[420px] min-h-[520px] flex items-center justify-center">
          {/* Start Screen */}
          {currentScreen === 'start' && (
            <StartScreen
              nickname={settings.nickname}
              onNicknameChange={(nick) => updateSettings({ nickname: nick })}
              onStartGame={handleStartGame}
              onOpenSettings={() => setScreen('settings')}
              onOpenLeaderboard={() => setScreen('leaderboard')}
            />
          )}

          {/* Game Screen */}
          {currentScreen === 'game' && (
            <GameScreen
              score={score}
              length={snakeLength}
              muted={!settings.soundEnabled}
              onCanvasReady={handleCanvasReady}
              onToggleMute={handleToggleMute}
            />
          )}

          {/* Game Over Screen */}
          {currentScreen === 'gameover' && (
            <GameOverScreen
              score={finalScore}
              length={finalLength}
              nickname={settings.nickname}
              hasReplay={hasValidReplay}
              onNicknameChange={(nick) => updateSettings({ nickname: nick })}
              onSaveScore={handleSaveScore}
              onPlayAgain={handlePlayAgain}
              onWatchReplay={handleWatchReplay}
              onViewLeaderboard={() => setScreen('leaderboard')}
              onReturnToMenu={handleReturnToMenu}
            />
          )}

          {/* Settings Screen */}
          {currentScreen === 'settings' && (
            <SettingsScreen
              settings={settings}
              onSave={(newSettings) => updateSettings(newSettings)}
              onBack={handleBackNavigation}
            />
          )}

          {/* Leaderboard Screen */}
          {currentScreen === 'leaderboard' && (
            <LeaderboardScreen onBack={handleBackNavigation} />
          )}

          {/* Replay Screen */}
          {currentScreen === 'replay' && (
            <ReplayScreen
              replayData={replayData}
              score={score}
              length={snakeLength}
              onCanvasReady={handleReplayCanvasReady}
              onCancel={handleStopReplay}
            />
          )}
        </div>
      </div>
    </main>
  );
}

```

Sprawdzę błędy lintowania:

Muszę naprawić typ w interfejsie - `initEngine` zwraca `Promise<boolean>`:

```typescript
// ==========================================
// useGameState Hook - Game state management
// ==========================================

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { ScreenType, PlayerSettings, ReplayData } from "@/types";
import { GameEngine } from "@/game/engine";
import { loadReplay, hasReplay } from "@/game/replay";
import { useLocalStorage } from "./useLocalStorage";

const DEFAULT_SETTINGS: PlayerSettings = {
	soundEnabled: true,
	highContrastMode: false,
	foregroundColor: "#000000",
	backgroundColor: "#ffffff",
	nickname: "",
};

export interface GameStateHook {
	// Navigation
	currentScreen: ScreenType;
	setScreen: (screen: ScreenType) => void;

	// Game stats
	score: number;
	snakeLength: number;

	// Player settings
	settings: PlayerSettings;
	updateSettings: (updates: Partial<PlayerSettings>) => void;

	// Game engine
	initEngine: (canvas: HTMLCanvasElement) => Promise<boolean>;
	startGame: () => void;
	resetGame: () => void;
	destroyEngine: () => void;

	// Replay
	replayData: ReplayData | null;
	hasValidReplay: boolean;
	startReplay: () => void;
	runReplayEngine: () => void;
	stopReplay: () => void;

	// Final game stats (after game over)
	finalScore: number;
	finalLength: number;
}

export function useGameState(): GameStateHook {
	// Navigation state
	const [currentScreen, setCurrentScreen] = useState<ScreenType>("start");

	// Game stats
	const [score, setScore] = useState(0);
	const [snakeLength, setSnakeLength] = useState(3);
	const [finalScore, setFinalScore] = useState(0);
	const [finalLength, setFinalLength] = useState(3);

	// Replay state
	const [replayData, setReplayData] = useState<ReplayData | null>(null);
	const [hasValidReplay, setHasValidReplay] = useState(false);

	// Settings with localStorage persistence
	const [settings, setSettings] = useLocalStorage<PlayerSettings>(
		"snake_settings",
		DEFAULT_SETTINGS
	);

	// Game engine reference
	const engineRef = useRef<GameEngine | null>(null);
	const isInitializingRef = useRef(false);

	// Check for valid replay on mount
	useEffect(() => {
		setHasValidReplay(hasReplay());
	}, [currentScreen]);

	// Initialize game engine - returns true if initialization was performed
	const initEngine = useCallback(
		async (canvas: HTMLCanvasElement): Promise<boolean> => {
			// Prevent double initialization (React Strict Mode)
			if (isInitializingRef.current) {
				return false;
			}
			isInitializingRef.current = true;

			// Destroy existing engine if any
			if (engineRef.current) {
				engineRef.current.destroy();
				engineRef.current = null;
			}

			const engine = new GameEngine({
				onScoreChange: setScore,
				onLengthChange: setSnakeLength,
				onGameOver: (score, length) => {
					setFinalScore(score);
					setFinalLength(length);
					setHasValidReplay(true);
				},
				onStateChange: (status) => {
					if (status === "gameover") {
						setCurrentScreen("gameover");
					}
				},
			});

			await engine.init(canvas);
			engine.setMuted(!settings.soundEnabled);
			engineRef.current = engine;
			isInitializingRef.current = false;
			return true;
		},
		[settings.soundEnabled]
	);

	// Start new game
	const startGame = useCallback(() => {
		if (!engineRef.current || isInitializingRef.current) {
			return;
		}

		setScore(0);
		setSnakeLength(3);
		engineRef.current.reset();
		engineRef.current.start();
	}, []);

	// Reset game (without starting)
	const resetGame = useCallback(() => {
		if (!engineRef.current) return;
		engineRef.current.reset();
		setScore(0);
		setSnakeLength(3);
	}, []);

	// Destroy engine
	const destroyEngine = useCallback(() => {
		if (engineRef.current) {
			engineRef.current.destroy();
			engineRef.current = null;
		}
	}, []);

	// Prepare replay - loads data and changes screen (engine will be initialized when canvas is ready)
	const startReplay = useCallback(() => {
		const replay = loadReplay();
		if (!replay) {
			console.warn("No valid replay data found");
			return;
		}

		// Destroy existing engine - new one will be created for replay canvas
		if (engineRef.current) {
			engineRef.current.destroy();
			engineRef.current = null;
		}
		isInitializingRef.current = false;

		setReplayData(replay);
		setScore(0);
		setSnakeLength(3);
		setCurrentScreen("replay");
		// Note: engine.startReplay() will be called by runReplayEngine() after canvas is ready
	}, []);

	// Run replay on initialized engine
	const runReplayEngine = useCallback(() => {
		if (!engineRef.current || !replayData) return;
		engineRef.current.startReplay(replayData);
	}, [replayData]);

	// Stop replay
	const stopReplay = useCallback(() => {
		if (!engineRef.current) return;

		engineRef.current.stopReplay();
		setReplayData(null);
		setCurrentScreen("start");
	}, []);

	// Update settings
	const updateSettings = useCallback(
		(updates: Partial<PlayerSettings>) => {
			setSettings((prev) => ({ ...prev, ...updates }));

			// Apply sound setting to engine
			if (updates.soundEnabled !== undefined && engineRef.current) {
				engineRef.current.setMuted(!updates.soundEnabled);
			}
		},
		[setSettings]
	);

	// Set screen with proper navigation logic
	const setScreen = useCallback((screen: ScreenType) => {
		setCurrentScreen(screen);
	}, []);

	return {
		currentScreen,
		setScreen,
		score,
		snakeLength,
		settings,
		updateSettings,
		initEngine,
		startGame,
		resetGame,
		destroyEngine,
		replayData,
		hasValidReplay,
		startReplay,
		runReplayEngine,
		stopReplay,
		finalScore,
		finalLength,
	};
}
```

```javascript
startReplay(replayData: ReplayData): void {
  this.isReplay = true;
  this.replayMoves = replayData.moves;
  this.replayMoveIndex = 0;
  this.tickCount = 0;

  // Reset with replay seed
  this.rngState = replayData.seed;
  this.state.seed = replayData.seed;

  const snake = createSnake(GRID_SIZE, INITIAL_SNAKE_LENGTH);
  this.state.snake = snake;
  this.state.score = 0;
  this.state.speed = calculateSpeed(0);

  // Spawn food with same seed
  this.state.food.position = spawnFood(
    this.state.snake.segments,
    GRID_SIZE,
    () => this.seededRandom()
  );

  this.callbacks.onScoreChange(0);
  this.callbacks.onLengthChange(INITIAL_SNAKE_LENGTH);

  this.state.status = 'playing';
  this.callbacks.onStateChange('replay');
  this.startGameLoop();
}
```

Dobrze, błędy naprawione. Powinno już działać!
