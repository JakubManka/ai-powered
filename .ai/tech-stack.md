# Tech Stack - Snake Game

## Overview

Full-stack Next.js application with Game Boy aesthetic Snake game.

---

## Frontend

| Technology | Version | Purpose |
| ---------- | ------- | ------- |
| Next.js | 14+ | React framework with App Router and server components |
| React | 18 | UI components and state management |
| TypeScript | 5+ | Type safety and developer experience |
| Tailwind CSS | 3+ | Utility-first styling for UI screens |
| PixiJS | 8 | WebGL 2D renderer for game canvas and animations |
| Web Audio API | native | Programmatic 8-bit sound synthesis |

---

## Backend

| Technology | Version | Purpose |
| ---------- | ------- | ------- |
| Next.js API Routes | 14+ | REST API endpoints (/api/leaderboard) |
| Zod | 3+ | Request/response validation and type inference |

---

## Database

| Technology | Version | Purpose |
| ---------- | ------- | ------- |
| SQLite | 3 | Lightweight file-based database |
| Drizzle ORM | latest | Type-safe database queries and migrations |

---

## Development Tools

| Technology | Purpose |
| ---------- | ------- |
| pnpm | Fast, disk-efficient package manager |
| ESLint | Code linting and quality |
| Prettier | Code formatting |
| TypeScript | Static type checking |

---

## Project Structure

```
snake-game/
├── .ai/                    # AI documentation
│   ├── prd.md
│   └── tech-stack.md
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── api/
│   │   │   └── leaderboard/
│   │   │       └── route.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/         # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── screens/        # Screen components
│   │   └── game/           # Game-specific components
│   ├── game/               # Game engine (PixiJS)
│   │   ├── engine.ts       # Main game loop
│   │   ├── snake.ts        # Snake logic
│   │   ├── food.ts         # Food spawning
│   │   ├── input.ts        # Input handling
│   │   ├── audio.ts        # Sound effects
│   │   ├── effects.ts      # Visual effects
│   │   └── replay.ts       # Replay system
│   ├── lib/                # Utilities
│   │   ├── db/             # Database (Drizzle)
│   │   │   ├── schema.ts
│   │   │   └── index.ts
│   │   ├── validation.ts   # Zod schemas
│   │   └── constants.ts    # Game constants
│   ├── hooks/              # Custom React hooks
│   └── types/              # TypeScript types
├── drizzle/                # Drizzle migrations
├── public/                 # Static assets
├── drizzle.config.ts
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Key Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "pixi.js": "^8.0.0",
    "drizzle-orm": "^0.29.0",
    "better-sqlite3": "^9.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "drizzle-kit": "^0.20.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/better-sqlite3": "^7.6.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    "prettier": "^3.1.0"
  }
}
```

---

## API Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| GET | /api/leaderboard | Retrieve top 10 scores |
| POST | /api/leaderboard | Submit new score |

---

## Database Schema

```sql
CREATE TABLE leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nick VARCHAR(100) NOT NULL,
  score INTEGER NOT NULL,
  snake_length INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leaderboard_score ON leaderboard(score DESC);
```

---

## Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"

# Optional: Production database path
# DATABASE_URL="file:/data/snake.db"
```

---

## Browser Support

| Browser | Minimum Version |
| ------- | --------------- |
| Chrome | 90+ |
| Firefox | 90+ |
| Safari | 14+ |
| Edge | 90+ |

---

## Performance Targets

| Metric | Target |
| ------ | ------ |
| Frame rate | 60 FPS stable |
| Input latency | < 16ms |
| Initial load | < 2 seconds |
| API response | < 500ms |

