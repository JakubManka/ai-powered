import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";

// Game Boy pixel font
const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

// Retro terminal font for larger text
const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-retro",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Snake Game - Game Boy Edition",
  description: "Classic Snake game with a nostalgic Game Boy aesthetic. Play, compete on the leaderboard, and watch your replays!",
  keywords: ["snake", "game", "retro", "game boy", "arcade", "classic"],
  authors: [{ name: "Snake Game" }],
  openGraph: {
    title: "Snake Game - Game Boy Edition",
    description: "Classic Snake game with Game Boy aesthetics",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${pressStart2P.variable} ${vt323.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
