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
