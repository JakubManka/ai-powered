// ==========================================
// Main Page - Snake Game Entry Point
// ==========================================

"use client";

import { useCallback, useRef, useEffect, useState } from "react";
import {
	StartScreen,
	GameScreen,
	GameOverScreen,
	SettingsScreen,
	LeaderboardScreen,
	ReplayScreen,
} from "@/components/screens";
import { useGameState } from "@/hooks";
import type { ScreenType } from "@/types";

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
	const previousScreenRef = useRef<ScreenType>("start");
	const [isMounted, setIsMounted] = useState(false);

	// Handle client-side mounting
	useEffect(() => {
		setIsMounted(true);
	}, []);

	// Track screen changes for back navigation
	useEffect(() => {
		if (currentScreen !== "settings" && currentScreen !== "leaderboard") {
			previousScreenRef.current = currentScreen;
		}
	}, [currentScreen]);

	// Canvas ready handler - starts game automatically
	const handleCanvasReady = useCallback(
		async (canvas: HTMLCanvasElement) => {
			const initialized = await initEngine(canvas);
			// Only start game if this call actually initialized the engine
			if (initialized) {
				startGame();
			}
		},
		[initEngine, startGame]
	);

	// Replay canvas ready handler - initializes engine and starts replay playback
	const handleReplayCanvasReady = useCallback(
		async (canvas: HTMLCanvasElement) => {
			const initialized = await initEngine(canvas);
			// Only start replay if this call actually initialized the engine
			if (initialized) {
				runReplayEngine();
			}
		},
		[initEngine, runReplayEngine]
	);

	// Save score to leaderboard
	const handleSaveScore = useCallback(async () => {
		try {
			const response = await fetch("/api/leaderboard", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					nick: settings.nickname || "Anonymous",
					score: finalScore,
					snakeLength: finalLength,
				}),
			});

			const data = await response.json();
			return data;
		} catch {
			return { success: false, error: "Network error" };
		}
	}, [settings.nickname, finalScore, finalLength]);

	// Navigation handlers
	const handleStartGame = useCallback(() => {
		setScreen("game");
	}, [setScreen]);

	const handlePlayAgain = useCallback(() => {
		resetGame();
		setScreen("game");
	}, [resetGame, setScreen]);

	const handleWatchReplay = useCallback(() => {
		startReplay();
	}, [startReplay]);

	const handleStopReplay = useCallback(() => {
		stopReplay();
	}, [stopReplay]);

	const handleBackNavigation = useCallback(() => {
		// Return to appropriate screen based on context
		const target =
			previousScreenRef.current === "gameover" ? "gameover" : "start";
		setScreen(target);
	}, [setScreen]);

	const handleReturnToMenu = useCallback(() => {
		destroyEngine();
		setScreen("start");
	}, [destroyEngine, setScreen]);

	// Toggle mute
	const handleToggleMute = useCallback(() => {
		updateSettings({ soundEnabled: !settings.soundEnabled });
	}, [settings.soundEnabled, updateSettings]);

	// Apply high contrast mode
	const containerClasses = settings.highContrastMode ? "high-contrast" : "";
	const customStyles = settings.highContrastMode
		? ({
				"--hc-foreground": settings.foregroundColor,
				"--hc-background": settings.backgroundColor,
			} as React.CSSProperties)
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
					{currentScreen === "start" && (
						<StartScreen
							nickname={settings.nickname}
							onNicknameChange={(nick) => updateSettings({ nickname: nick })}
							onStartGame={handleStartGame}
							onOpenSettings={() => setScreen("settings")}
							onOpenLeaderboard={() => setScreen("leaderboard")}
						/>
					)}

					{/* Game Screen */}
					{currentScreen === "game" && (
						<GameScreen
							score={score}
							length={snakeLength}
							muted={!settings.soundEnabled}
							onCanvasReady={handleCanvasReady}
							onToggleMute={handleToggleMute}
						/>
					)}

					{/* Game Over Screen */}
					{currentScreen === "gameover" && (
						<GameOverScreen
							score={finalScore}
							length={finalLength}
							nickname={settings.nickname}
							hasReplay={hasValidReplay}
							onNicknameChange={(nick) => updateSettings({ nickname: nick })}
							onSaveScore={handleSaveScore}
							onPlayAgain={handlePlayAgain}
							onWatchReplay={handleWatchReplay}
							onViewLeaderboard={() => setScreen("leaderboard")}
							onReturnToMenu={handleReturnToMenu}
						/>
					)}

					{/* Settings Screen */}
					{currentScreen === "settings" && (
						<SettingsScreen
							settings={settings}
							onSave={(newSettings) => updateSettings(newSettings)}
							onBack={handleBackNavigation}
						/>
					)}

					{/* Leaderboard Screen */}
					{currentScreen === "leaderboard" && (
						<LeaderboardScreen onBack={handleBackNavigation} />
					)}

					{/* Replay Screen */}
					{currentScreen === "replay" && (
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
