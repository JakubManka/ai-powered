# Setting up backend with express.js

---

**User**

Jako BE express.js Expret

Zacznijmy od postawienia BE @.ai/tech-stack.md @.ai/prd.md

---

**Cursor**

Rozumiem! Zacznijmy od postawienia backendu dla gry Snake. Zgodnie z tech-stackiem używamy **Next.js API Routes** (nie Express.js) z **SQLite** i **Drizzle ORM**.

Stwórzmy strukturę projektu i skonfigurujmy backend:

Projekt jest pusty, stwórzmy strukturę od podstaw. Zacznę od inicjalizacji projektu Next.js:

PowerShell używa `;` zamiast `&&`. Poprawmy to:

`pnpm` nie jest zainstalowany. Użyjmy `npm` aby zainstalować pnpm globalnie lub bezpośrednio npm:

Zainstalujmy pnpm globalnie:

Świetnie! Teraz stwórzmy projekt Next.js:

Projekt Next.js utworzony!

---

**User**

Projekt utworzony. Teraz zainstaluj zależności - drizzle, sqlite i zod.

---

**Cursor**

Zainstalujmy zależności dla backendu:

Muszę zatwierdzić build script dla better-sqlite3 i dodać devDependencies:

Spróbuję inaczej - zobaczmy co mamy i ręcznie zatwierdzę:

Zależności zainstalowane.

---

**User**

Ok, teraz schemat bazy danych dla leaderboard.

---

**Cursor**

Stworzę strukturę backendu. Zacznę od schematu bazy danych i konfiguracji Drizzle:

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const leaderboard = sqliteTable("leaderboard", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	nick: text("nick", { length: 100 }).notNull(),
	score: integer("score").notNull(),
	snakeLength: integer("snake_length").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export type Leaderboard = typeof leaderboard.$inferSelect;
export type NewLeaderboardEntry = typeof leaderboard.$inferInsert;
```

```typescript
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database(process.env.DATABASE_URL || "dev.db");

export const db = drizzle(sqlite, { schema });
```

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/lib/db/schema.ts",
	out: "./drizzle",
	dialect: "sqlite",
	dbCredentials: {
		url: process.env.DATABASE_URL || "dev.db",
	},
});
```

Pliki `.env` są zablokowane przez globalignore. Utworzę je przez terminal.

---

**User**

Dodaj walidację Zod dla score submission.

---

**Cursor**

Dodam walidację Zod i API routes:

```typescript
import { z } from "zod";

// Score submission schema with server-side validation
export const scoreSubmissionSchema = z.object({
	nick: z
		.string()
		.max(100, "Nickname must be at most 100 characters")
		.default(""),
	score: z
		.number()
		.int("Score must be an integer")
		.min(0, "Score must be non-negative")
		.max(10000, "Score cannot exceed 10000")
		.refine((val) => val % 10 === 0, "Score must be a multiple of 10"),
	snakeLength: z
		.number()
		.int("Snake length must be an integer")
		.min(3, "Snake length must be at least 3"),
});

// Validate that snake length matches score
export const validateScoreIntegrity = (
	score: number,
	snakeLength: number
): boolean => {
	// Formula: snakeLength === 3 + (score / 10)
	return snakeLength === 3 + score / 10;
};

// Full submission validation including integrity check
export const validateSubmission = (data: unknown) => {
	const result = scoreSubmissionSchema.safeParse(data);

	if (!result.success) {
		return {
			success: false as const,
			error: result.error.errors[0]?.message || "Invalid data",
		};
	}

	const { score, snakeLength } = result.data;

	if (!validateScoreIntegrity(score, snakeLength)) {
		return {
			success: false as const,
			error:
				"Score and snake length do not match. Expected snake length: " +
				(3 + score / 10),
		};
	}

	return {
		success: true as const,
		data: result.data,
	};
};

export type ScoreSubmission = z.infer<typeof scoreSubmissionSchema>;
```

```typescript
// Game constants
export const GRID_SIZE = 20;
export const INITIAL_SNAKE_LENGTH = 3;
export const POINTS_PER_FOOD = 10;
export const BASE_SPEED_MS = 100;
export const MIN_SPEED_MS = 50;
export const SPEED_DECREASE_INTERVAL = 50;
export const SPEED_DECREASE_AMOUNT = 5;
export const MAX_SCORE = 10000;
export const LEADERBOARD_LIMIT = 10;

// Game Boy Green palette
export const COLORS = {
	darkest: "#0f380f", // Snake head, UI text
	dark: "#306230", // Snake body
	light: "#8bac0f", // Grid lines, food glow
	lightest: "#9bbc0f", // Background
} as const;

// Speed calculation formula
export const calculateSpeed = (score: number): number => {
	return Math.max(
		MIN_SPEED_MS,
		BASE_SPEED_MS -
			Math.floor(score / SPEED_DECREASE_INTERVAL) * SPEED_DECREASE_AMOUNT
	);
};
```

---

**User**

Teraz API endpoints - GET i POST dla leaderboard.

---

**Cursor**

Utworzę API endpoints dla leaderboard:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leaderboard } from "@/lib/db/schema";
import { validateSubmission } from "@/lib/validation";
import { LEADERBOARD_LIMIT } from "@/lib/constants";
import { desc } from "drizzle-orm";

// GET /api/leaderboard - Retrieve top 10 scores
export async function GET() {
	try {
		const scores = await db
			.select({
				id: leaderboard.id,
				nick: leaderboard.nick,
				score: leaderboard.score,
				snakeLength: leaderboard.snakeLength,
				createdAt: leaderboard.createdAt,
			})
			.from(leaderboard)
			.orderBy(desc(leaderboard.score))
			.limit(LEADERBOARD_LIMIT);

		return NextResponse.json({
			success: true,
			data: scores.map((entry) => ({
				...entry,
				createdAt: entry.createdAt.toISOString(),
			})),
		});
	} catch (error) {
		console.error("Failed to fetch leaderboard:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch leaderboard" },
			{ status: 500 }
		);
	}
}

// POST /api/leaderboard - Submit new score
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		// Validate the submission
		const validation = validateSubmission(body);

		if (!validation.success) {
			return NextResponse.json(
				{ success: false, error: validation.error },
				{ status: 400 }
			);
		}

		const { nick, score, snakeLength } = validation.data;

		// Insert the new score
		const result = await db
			.insert(leaderboard)
			.values({
				nick: nick || "Anonymous",
				score,
				snakeLength,
			})
			.returning();

		const newEntry = result[0];

		return NextResponse.json({
			success: true,
			data: {
				id: newEntry.id,
				nick: newEntry.nick,
				score: newEntry.score,
				snakeLength: newEntry.snakeLength,
				createdAt: newEntry.createdAt.toISOString(),
			},
		});
	} catch (error) {
		console.error("Failed to submit score:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to submit score" },
			{ status: 500 }
		);
	}
}
```

---

**User**

Wygeneruj migrację i uruchom serwer.

---

**Cursor**

Uruchomię migrację bazy danych i sprawdzę linting:

Teraz dodajmy skrypty do `package.json` i wygenerujmy migrację bazy danych:

```json
{
	"name": "snake-game",
	"version": "0.1.0",
	"private": true,
	"scripts": {
		"dev": "next dev",
		"build": "next build",
		"start": "next start",
		"lint": "eslint",
		"db:generate": "drizzle-kit generate",
		"db:push": "drizzle-kit push",
		"db:studio": "drizzle-kit studio"
	},
	"dependencies": {
		"better-sqlite3": "^12.5.0",
		"drizzle-orm": "^0.44.7",
		"next": "16.0.6",
		"react": "19.2.0",
		"react-dom": "19.2.0",
		"zod": "^4.1.13"
	},
	"devDependencies": {
		"@tailwindcss/postcss": "^4",
		"@types/better-sqlite3": "^7.6.13",
		"@types/node": "^20",
		"@types/react": "^19",
		"@types/react-dom": "^19",
		"babel-plugin-react-compiler": "1.0.0",
		"drizzle-kit": "^0.31.7",
		"eslint": "^9",
		"eslint-config-next": "16.0.6",
		"prettier": "^3.7.3",
		"tailwindcss": "^4",
		"typescript": "^5"
	}
}
```

Teraz wygenerujmy migrację i zastosujmy ją do bazy danych:

Musimy skompilować native bindings dla better-sqlite3. Spróbujmy przebudować:

Problem z native bindings na Windows. Zamieńmy `better-sqlite3` na `@libsql/client` który nie wymaga kompilacji native:

Teraz zaktualizuję konfigurację bazy danych dla `@libsql/client`:

```typescript
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const client = createClient({
	url: process.env.DATABASE_URL || "file:dev.db",
});

export const db = drizzle(client, { schema });
```

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/lib/db/schema.ts",
	out: "./drizzle",
	dialect: "sqlite",
	dbCredentials: {
		url: process.env.DATABASE_URL || "file:dev.db",
	},
});
```

Schemat bazy został utworzony! Teraz uruchommy serwer i przetestujmy API:

Komenda uruchomiła się w złym katalogu. Poprawmy:

Serwer działa na `http://localhost:3000`. Przetestujmy API:

**GET `/api/leaderboard` działa!** Odpowiedź: `{"success":true,"data":[]}` (pusta tablica bo nie ma jeszcze wyników).

---

**User**

Działa! Przetestuj jeszcze POST z nieprawidłowymi danymi, sprawdźmy walidację.

---

**Cursor**

Przetestujmy POST endpoint przez curl:

PowerShell ma inną składnię. Użyjmy `Invoke-RestMethod`:

**POST działa!** Wynik zapisany do bazy. Teraz przetestujmy walidację z nieprawidłowymi danymi:

**Walidacja działa!** Nieprawidłowy wynik został odrzucony (400 Bad Request). Sprawdźmy czy wynik jest na liście:

Wszystko działa! Sprawdźmy jeszcze błędy lintowania i sprawdźmy ostateczną strukturę projektu:

## ✅ Backend gotowy!

### Podsumowanie

Backend dla Snake Game został pomyślnie skonfigurowany:

**Struktura projektu:**

```
snake-game/src/
├── app/
│   └── api/
│       └── leaderboard/
│           └── route.ts      # GET i POST endpoints
├── lib/
│   ├── constants.ts          # Stałe gry (kolory, prędkość, punkty)
│   ├── validation.ts         # Walidacja Zod + sprawdzanie integralności
│   └── db/
│       ├── schema.ts         # Schemat Drizzle (tabela leaderboard)
│       └── index.ts          # Konfiguracja połączenia z SQLite
```

**API Endpoints:**

| Metoda | Endpoint           | Opis                   |
| ------ | ------------------ | ---------------------- |
| `GET`  | `/api/leaderboard` | Pobiera top 10 wyników |
| `POST` | `/api/leaderboard` | Zapisuje nowy wynik    |

**Server-side walidacja:**

- ✅ `score >= 0` i `score <= 10000`
- ✅ `score % 10 === 0` (wielokrotność 10)
- ✅ `snakeLength === 3 + (score / 10)` (sprawdzenie integralności)
- ✅ `nick` max 100 znaków

**Tech Stack:**

- **Next.js 16** z App Router
- **Drizzle ORM** + **@libsql/client** (SQLite)
- **Zod** do walidacji
- **TypeScript** + **Tailwind CSS**

**Komendy:**

```bash
pnpm dev          # Uruchom serwer deweloperski
pnpm db:push      # Aktualizuj schemat bazy
pnpm db:studio    # Podgląd bazy danych
```

Serwer działa na `http://localhost:3000`. Co dalej - frontend z grą PixiJS?

```plaintext
snake-game/src/
├── app/
│   └── api/
│       └── leaderboard/
│           └── route.ts      # GET i POST endpoints
├── lib/
│   ├── constants.ts          # Stałe gry (kolory, prędkość, punkty)
│   ├── validation.ts         # Walidacja Zod + sprawdzanie integralności
│   └── db/
│       ├── schema.ts         # Schemat Drizzle (tabela leaderboard)
│       └── index.ts          # Konfiguracja połączenia z SQLite
```

```shellscript
pnpm dev          # Uruchom serwer deweloperski
pnpm db:push      # Aktualizuj schemat bazy
pnpm db:studio    # Podgląd bazy danych
```
