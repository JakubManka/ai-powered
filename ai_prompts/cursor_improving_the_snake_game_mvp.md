# Improving the snake game MVP

---

**User**

You will be acting as an expert in MVP (Minimum Viable Product) creation for snake games. Your role is to conduct a planning session to improve and challenge an existing MVP implementation.

Here is the MVP code you will be analyzing:

<mvp_code>

{{MVP_CODE}}

</mvp_code>

Your task has two phases:

**PHASE 1 - INITIAL ANALYSIS:**

When the conversation begins, you should:

1. Carefully analyze the provided MVP code

2. Generate exactly 10 critical questions about the MVP that challenge assumptions, identify gaps, or explore improvement opportunities

3. Generate exactly 10 concrete proposals for changes or improvements to the MVP

Format your initial response as follows:

- Use <analysis> tags to briefly note your observations about the MVP@MVP.md

- Use <questions> tags to list your 10 questions, numbered 1-10

- Use <proposals> tags to list your 10 proposals for change, numbered 1-10

Your questions should cover areas such as:

- Game mechanics and features

- Code architecture and structure

- User experience

- Performance and optimization

- Scalability

- Missing functionality

- Edge cases and bugs

Your proposals should be specific, actionable suggestions that could improve the MVP.

**PHASE 2 - ONGOING PLANNING SESSION:**

After providing your initial analysis, questions, and proposals, you will enter an interactive planning session mode. In this mode:

- Engage in discussion with the user about any of the questions or proposals

- Answer follow-up questions about your suggestions

- Provide deeper analysis when requested

- Discuss implementation details

- Evaluate trade-offs between different approaches

- Generate additional questions or proposals if the conversation naturally leads there

- Be collaborative and help refine ideas through dialogue

Continue the planning session until the user explicitly asks you to "summarize" or "summarize the planning session" (or similar phrasing).

**WHEN ASKED TO SUMMARIZE:**

When the user requests a summary, provide a comprehensive summary inside <summary> tags that includes:

- Key issues identified with the current MVP

- Main proposals discussed and their priorities

- Decisions or consensus reached during the session

- Recommended next steps

- Any open questions that remain

Important guidelines:

- Be constructive and specific in your feedback

- Focus on practical improvements that enhance the snake game MVP

- Consider both technical and user experience aspects

- Maintain a collaborative, helpful tone throughout the planning session

- Stay focused on the snake game domain

Begin by providing your initial analysis with 10 questions and 10 proposals.Snak

---

**Cursor**

# Snake Game MVP - Planning Session

<analysis>

## Initial Observations

After reviewing the `MVP.md` specification document, I can see this is a well-structured planning document for a classic Snake game with modern features. Key observations:

**Strengths:**

- Clear game mechanics definition (movement, food, collision)
- Well-defined database schema for leaderboard
- Comprehensive UI flow (start → game → game over)
- Sensible tech stack options proposed
- All MVP features are checked as planned ✅

**Areas of Concern:**

- The document is a specification, not implementation code - no actual game code exists yet
- Missing technical details (grid size, game speed, tick rate)
- No mobile/responsive considerations mentioned
- No offline/error handling scenarios addressed
- Security considerations for leaderboard are absent
- No animations or visual feedback defined
- Accessibility not addressed

</analysis>

---

<questions>

## 10 Critical Questions About the MVP

1. **Grid Size & Dimensions** - What are the exact dimensions of the game board (e.g., 20x20 cells)? Is this fixed or should it adapt to screen size? This fundamentally affects difficulty and gameplay feel.

2. **Game Speed & Difficulty** - The document mentions "optional difficulty (snake speed)" - what are the actual tick rates? (e.g., Easy: 150ms, Medium: 100ms, Hard: 60ms per move). How does speed progression work - does it increase as the snake grows?

3. **Input Handling & Buffering** - How should the game handle rapid input changes? If a player presses UP then RIGHT within the same game tick, should the second input be buffered or ignored? This is crucial for responsive controls.

4. **Food Spawn Algorithm** - How do we guarantee food never spawns on the snake's body? As the snake grows longer, the naive "random until valid" approach becomes increasingly inefficient. What's the performance threshold?

5. **Leaderboard Security** - How do we prevent score manipulation? The current design seems vulnerable to API abuse where anyone could POST fake high scores. Is server-side validation or game session tokens needed?

6. **Mobile & Touch Support** - The controls mention only keyboard (arrows/WASD). Is mobile support in scope for MVP? If so, how will touch controls work (swipe gestures, on-screen buttons)?

7. **Offline Resilience** - What happens when the backend/database is unavailable? Should scores be queued in localStorage and synced later? Can the game still be played offline?

8. **Nick Validation Rules** - What are the exact validation rules for player nicknames? (min/max length, allowed characters, profanity filter, uniqueness requirements)

9. **Pause Functionality** - The UI mentions a pause button, but what are the exact behaviors? Can you pause at any moment? Is there a countdown before resuming? Can you change direction while paused?

10. **Visual Identity** - What's the aesthetic direction? Retro pixel art? Modern minimalist? Neon cyberpunk? This significantly impacts development time and asset requirements.

</questions>

---

<proposals>

## 10 Concrete Improvement Proposals

### 1. **Add Progressive Speed System**

Instead of fixed difficulty levels, implement gradual speed increase based on score/length:

```
baseSpeed = 120ms
currentSpeed = max(50ms, baseSpeed - (snakeLength * 2))
```

This creates natural difficulty progression and rewards skilled play.

### 2. **Implement Input Queue/Buffer (2-frame buffer)**

Store the last 1-2 inputs in a queue to prevent "swallowed" inputs during fast play. When the snake moves, pop from queue instead of reading current key state. This dramatically improves perceived responsiveness.

### 3. **Add Visual Feedback & Juice**

- Screen shake on collision/death (subtle, 100-200ms)
- Food glow/pulse animation
- Snake head distinct from body
- Particle effects when eating food
- Smooth interpolation between grid positions

### 4. **Implement Offline-First Architecture**

- Game logic runs entirely client-side
- Scores saved to `localStorage` immediately
- Background sync to server when online
- Queue failed submissions with retry logic
- Show "pending sync" indicator for unsynced scores

### 5. **Add Touch Controls for Mobile**

- Swipe gestures for direction (with deadzone threshold)
- Optional on-screen D-pad overlay
- Responsive canvas that scales to viewport
- Prevent accidental browser gestures (pull-to-refresh)

### 6. **Secure Leaderboard with Game Sessions**

```
POST /api/game/start → returns sessionToken + serverSeed
POST /api/game/end → requires sessionToken + moveHistory
Server validates: moveHistory produces claimed score
```

This prevents score injection while keeping gameplay client-side.

### 7. **Add Sound Design**

- Movement tick sound (subtle)
- Food pickup sound (satisfying "nom")
- Game over sound (dramatic but not annoying)
- Background music (optional, toggleable)
- All audio should have mute toggle with localStorage persistence

### 8. **Implement Ghost/Replay Feature**

Record each game as an array of moves + random seed. Allow players to:

- Watch replay of their last game
- See ghost of #1 player's run overlaid during gameplay
- Share replay links

### 9. **Add Accessibility Features**

- High contrast mode (colorblind-friendly palette)
- Screen reader announcements for score changes
- Configurable controls (rebind keys)
- Pause on focus loss (don't punish tab-switching)
- Reduced motion option (disable screen shake)

### 10. **Create Component-Based Architecture**

Structure the codebase for maintainability:

```
/src
  /core           → Game logic (pure functions, testable)
  /rendering      → Canvas drawing (separated from logic)
  /input          → Input handlers (keyboard, touch)
  /audio          → Sound management
  /api            → Backend communication
  /ui             → Menu screens, overlays
  /utils          → Helpers (collision detection, random)
```

This enables unit testing game logic without canvas/DOM dependencies.

</proposals>

---

## Ready for Planning Session 🎮

I'm now ready to dive deeper into any of these questions or proposals. We can:

- Discuss implementation details for specific proposals
- Explore trade-offs between approaches
- Prioritize which improvements matter most for MVP
- Debate architectural decisions
- Identify what's truly "minimum" for a viable product

What would you like to explore first? Or do you have your own questions/concerns about the MVP specification?

```plaintext
baseSpeed = 120ms
currentSpeed = max(50ms, baseSpeed - (snakeLength * 2))
```

```plaintext
POST /api/game/start → returns sessionToken + serverSeed
POST /api/game/end → requires sessionToken + moveHistory
Server validates: moveHistory produces claimed score
```

```plaintext
/src
  /core           → Game logic (pure functions, testable)
  /rendering      → Canvas drawing (separated from logic)
  /input          → Input handlers (keyboard, touch)
  /audio          → Sound management
  /api            → Backend communication
  /ui             → Menu screens, overlays
  /utils          → Helpers (collision detection, random)
```

---

**User**

Questions

1. 20x20

2. 100

3. seoncd input buffored

4. Wybieraj zawsze najdalsze wolne miejsca od głowy

5. na ten moment nie musimy się tym przejmować

6. nie jest potrzebny mobiel support

7.Nie, zakładamy że zawsze jest dostepna

8. daj tylko max length 100 characters

9. nie ma możliwośći pauzowania

10. retro pixel art

Proposal

1. zgadzam się

2. ok

3. ok

4. nie - w ogóle nie chcemy implementować offline first architecture

5. mobile nie musi być obsługiwane

6. ok

7. ok

8. ok

9. ok

10ok

---

**Cursor**

# Planning Session - Round 2

Excellent! Thank you for the clear answers. Let me summarize what we've established and then dig deeper into some implementation details.

---

## ✅ Confirmed Specifications

| Aspect                   | Decision                            |
| ------------------------ | ----------------------------------- |
| **Grid Size**            | 20×20 cells                         |
| **Base Speed**           | 100ms per tick                      |
| **Input Handling**       | Buffer second input                 |
| **Food Spawn**           | Farthest free position from head    |
| **Leaderboard Security** | Not a priority now                  |
| **Mobile Support**       | ❌ Not needed                       |
| **Offline Mode**         | ❌ Not needed (DB always available) |
| **Nick Validation**      | Max 100 characters                  |
| **Pause Feature**        | ❌ Removed from scope               |
| **Visual Style**         | Retro pixel art 🕹️                  |

---

## ✅ Approved Proposals

1. ✅ Progressive speed system
2. ✅ Input buffer (2-frame)
3. ✅ Visual feedback & juice (screen shake, particles, glow)
4. ❌ ~~Offline-first~~ - removed
5. ❌ ~~Touch controls~~ - removed
6. ✅ Secure leaderboard with game sessions
7. ✅ Sound design
8. ✅ Ghost/replay feature
9. ✅ Accessibility features
10. ✅ Component-based architecture

---

## 🔍 Follow-up Questions

Now let me clarify some implementation details for the approved features:

### 1. Progressive Speed System

You agreed to progressive speed. Should we:

- **Option A:** Speed increases every X points (e.g., every 50 points = -5ms)
- **Option B:** Speed increases per food eaten (e.g., each food = -2ms)
- **Option C:** Speed tied to snake length directly

And what should be the **minimum speed cap**? (e.g., never faster than 50ms)

---

### 2. Food Spawn - "Farthest from Head"

Just to confirm the algorithm:

```
1. Find all empty cells (not occupied by snake)
2. Calculate Manhattan distance from head to each empty cell
3. Select the cell with maximum distance
4. If tie, pick randomly among tied cells?
```

Is this correct? Or should ties be resolved differently (e.g., prefer corners)?

---

### 3. Visual Feedback - Retro Pixel Art Style

For the retro aesthetic, what's the color palette preference?

- **Option A:** Classic green monochrome (Game Boy style) 🟢
- **Option B:** NES-style limited palette (8-16 colors)
- **Option C:** Modern retro (pixel art but vibrant colors)
- **Option D:** Leave it to implementation discretion

Also, should the snake have distinct head/tail sprites, or uniform segments?

---

### 4. Ghost/Replay Feature - Scope

This is a significant feature. For MVP, should we:

- **Full:** Record moves + show ghost overlay + shareable links
- **Minimal:** Just record last game, viewable locally only
- **Defer:** Mark as "nice to have" and implement if time permits

---

### 5. Accessibility - Priority Level

You approved accessibility features. Which are **must-have** for MVP vs **nice-to-have**?

| Feature               | Must-have?                                                                   |
| --------------------- | ---------------------------------------------------------------------------- |
| High contrast mode    | ?                                                                            |
| Screen reader support | ?                                                                            |
| Rebindable controls   | ?                                                                            |
| Pause on focus loss   | ? (Note: you removed pause, so this becomes "auto game-over on focus loss"?) |
| Reduced motion option | ?                                                                            |

---

### 6. Sound Design - Implementation

Should sounds be:

- **Included in repo:** Ship with default retro sounds (beeps, bloops)
- **Web Audio API:** Generate sounds programmatically (8-bit style synthesis)
- **External assets:** Use free sound libraries (need to handle licensing)

And is background music in scope, or just sound effects?

---

### 7. Leaderboard Session Security

You said "don't worry about it now" but also approved the secure session proposal. To clarify:

- **Skip entirely:** Just POST score to API, no validation
- **Basic validation:** Server checks if score is reasonable (not 999999)
- **Full session:** Token-based with move history validation (implement later)

Which approach for MVP?

---

Let me know your thoughts on these! We can go through them one by one or you can answer all at once. 🐍

```plaintext
1. Find all empty cells (not occupied by snake)
2. Calculate Manhattan distance from head to each empty cell
3. Select the cell with maximum distance
4. If tie, pick randomly among tied cells?
```

---

**User**

1 a

2 tak

3. a

4. minimal

5. tylko high contrast

6. web audio api

7. basic validation

---

**Cursor**

# Planning Session - Decisions Locked In 🔒

Perfect! We have very clear direction now. Let me document the final specifications:

---

## 📋 Final MVP Specifications

### Core Gameplay

| Parameter         | Value                     |
| ----------------- | ------------------------- |
| Grid Size         | 20×20                     |
| Base Speed        | 100ms/tick                |
| Speed Increase    | Every 50 points → -5ms    |
| Minimum Speed Cap | 50ms (needs confirmation) |
| Input System      | 2-frame buffer            |
| Pause             | ❌ Not available          |

### Food Spawn Algorithm

```
1. Find all empty cells
2. Calculate Manhattan distance from snake head
3. Pick cell with maximum distance
4. If tie → random selection among tied cells
```

### Visual Style - Game Boy Green 🟢

- Monochrome green palette
- Classic 4-shade Game Boy aesthetic
- Pixel art sprites

### Features Scope

| Feature              | Status          | Implementation                             |
| -------------------- | --------------- | ------------------------------------------ |
| Progressive speed    | ✅ MVP          | Every 50pts = -5ms faster                  |
| Input buffer         | ✅ MVP          | 2-frame queue                              |
| Visual juice         | ✅ MVP          | Screen shake, particles (in green palette) |
| Sound effects        | ✅ MVP          | Web Audio API synthesis (8-bit beeps)      |
| Background music     | ❓              | Not specified - SFX only?                  |
| Ghost/replay         | ✅ MVP          | Minimal: last game only, local storage     |
| High contrast mode   | ✅ MVP          | Accessibility option                       |
| Other accessibility  | ❌ Deferred     | Screen reader, rebind, etc.                |
| Leaderboard security | ✅ MVP          | Basic server-side validation               |
| Mobile support       | ❌ Out of scope | Desktop only                               |
| Offline mode         | ❌ Out of scope | Requires DB connection                     |

---

## 🎨 Game Boy Green Palette Reference

For the authentic Game Boy look:

```
Darkest:  #0f380f  ████
Dark:     #306230  ████
Light:    #8bac0f  ████
Lightest: #9bbc0f  ████
```

Snake head → Darkest green
Snake body → Dark green  
Food → Pulsing between Light/Lightest
Background → Lightest green
Grid lines → Light green (subtle)

---

## ❓ Final Clarifications Needed

Just a few small details before we can finalize:

### 1. Speed Cap

I suggested 50ms as minimum speed. Is that good, or do you want a different floor?

- 50ms = Very fast (20 moves/second) - challenging
- 60ms = Fast but manageable
- 40ms = Insane difficulty

### 2. Background Music

Should we include procedurally generated 8-bit background music, or just sound effects (eat, die, move)?

### 3. High Contrast Mode

For accessibility, should high contrast be:

- **Option A:** Black & white mode (pure #000 and #FFF)
- **Option B:** Yellow on black (common high contrast)
- **Option C:** User picks foreground/background colors

### 4. Starting Snake Length

How long should the snake be at game start?

- 3 segments (classic)
- 1 segment (extra challenge)
- 5 segments (easier start)

---

Once you answer these, I believe we'll have a complete specification ready for implementation!

Or if you're happy with the current state, just say **"summarize"** and I'll compile the full planning session summary. 🐍

```plaintext
1. Find all empty cells
2. Calculate Manhattan distance from snake head
3. Pick cell with maximum distance
4. If tie → random selection among tied cells
```

```plaintext
Darkest:  #0f380f  ████
Dark:     #306230  ████
Light:    #8bac0f  ████
Lightest: #9bbc0f  ████
```

---

**User**

1 a

2. sound effects

3. c

4. 3

---

**Cursor**

# Planning Session - All Specifications Complete! ✅

Excellent! We now have a **fully defined MVP specification**. Here's the final lock-in:

---

## 🔒 Final Decisions - Complete

| Parameter           | Final Value                         |
| ------------------- | ----------------------------------- |
| **Grid Size**       | 20×20                               |
| **Base Speed**      | 100ms/tick                          |
| **Speed Increase**  | Every 50 points → -5ms              |
| **Minimum Speed**   | 50ms (20 moves/sec)                 |
| **Starting Length** | 3 segments                          |
| **Input System**    | 2-frame buffer                      |
| **Food Algorithm**  | Farthest from head (Manhattan)      |
| **Visual Style**    | Game Boy green monochrome           |
| **Audio**           | Web Audio API - SFX only (no music) |
| **High Contrast**   | User-selectable colors              |
| **Replay**          | Last game only, local storage       |
| **Nick Max Length** | 100 characters                      |
| **Pause**           | ❌ Not available                    |
| **Mobile**          | ❌ Not supported                    |
| **Offline**         | ❌ Not supported                    |

---

## 🎮 MVP Feature Summary

```
┌─────────────────────────────────────────────────────────┐
│                    SNAKE MVP                            │
├─────────────────────────────────────────────────────────┤
│  ✅ Core Gameplay                                       │
│     • 20×20 grid, 3-segment start                       │
│     • Arrow/WASD controls with input buffer             │
│     • Progressive speed (100ms → 50ms)                  │
│     • Food spawns farthest from head                    │
│                                                         │
│  ✅ Visuals                                             │
│     • Game Boy green pixel art                          │
│     • Screen shake, particles, glow effects             │
│     • High contrast mode (custom colors)                │
│                                                         │
│  ✅ Audio                                               │
│     • Web Audio API synthesized SFX                     │
│     • Eat sound, death sound, (optional move tick)      │
│                                                         │
│  ✅ Leaderboard                                         │
│     • Top 10, server-side basic validation              │
│     • Nick: max 100 chars                               │
│                                                         │
│  ✅ Replay                                              │
│     • Watch last game (local only)                      │
│                                                         │
│  ✅ Architecture                                        │
│     • Component-based, testable game logic              │
│     • Secure session tokens for scores                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Ready for Implementation

The planning session is complete! We have clear answers for every aspect of the MVP.

**Your options now:**

1. **Say "summarize"** → I'll generate a comprehensive planning session summary document

2. **Ask more questions** → We can continue discussing any aspect

3. **Start building** → I can begin implementing the Snake game based on these specs

What would you like to do next? 🐍

```plaintext
┌─────────────────────────────────────────────────────────┐
│                    SNAKE MVP                            │
├─────────────────────────────────────────────────────────┤
│  ✅ Core Gameplay                                       │
│     • 20×20 grid, 3-segment start                       │
│     • Arrow/WASD controls with input buffer             │
│     • Progressive speed (100ms → 50ms)                  │
│     • Food spawns farthest from head                    │
│                                                         │
│  ✅ Visuals                                             │
│     • Game Boy green pixel art                          │
│     • Screen shake, particles, glow effects             │
│     • High contrast mode (custom colors)                │
│                                                         │
│  ✅ Audio                                               │
│     • Web Audio API synthesized SFX                     │
│     • Eat sound, death sound, (optional move tick)      │
│                                                         │
│  ✅ Leaderboard                                         │
│     • Top 10, server-side basic validation              │
│     • Nick: max 100 chars                               │
│                                                         │
│  ✅ Replay                                              │
│     • Watch last game (local only)                      │
│                                                         │
│  ✅ Architecture                                        │
│     • Component-based, testable game logic              │
│     • Secure session tokens for scores                  │
└─────────────────────────────────────────────────────────┘
```

---

**User**

zrób nowy plik .md na podstawie tego

---

**Cursor**

```markdown
# 🐍 Snake Game - Specyfikacja Techniczna

> Dokument wygenerowany na podstawie sesji planowania MVP

---

## 📋 Podsumowanie

Klasyczna gra Snake w stylu Game Boy z nowoczesną architekturą. Gracz steruje wężem na planszy 20×20, zbiera jedzenie i zdobywa punkty. Gra przyspiesza wraz z postępem, oferując rosnące wyzwanie.

---

## 🎮 Parametry Gry

| Parametr              | Wartość              |
| --------------------- | -------------------- |
| Rozmiar planszy       | 20×20 komórek        |
| Bazowa prędkość       | 100ms na ruch        |
| Przyspieszenie        | Co 50 punktów → -5ms |
| Minimalna prędkość    | 50ms (20 ruchów/sek) |
| Startowa długość węża | 3 segmenty           |
| Punkty za jedzenie    | +10 punktów          |

---

## 🕹️ Sterowanie

### Klawiatura

- **Strzałki:** ↑ ↓ ← →
- **WASD:** W A S D

### System Buforowania Inputu

- Bufor 2-klatkowy (2-frame buffer)
- Drugi input jest buforowany, nie ignorowany
- Zapobiega "połykaniu" inputów przy szybkiej grze
- Wąż nie może zawrócić o 180°

### Pauza

- ❌ Brak funkcji pauzy w MVP

---

## 🍎 Algorytm Spawn Jedzenia

Jedzenie pojawia się zawsze **najdalej od głowy węża**:
```

1. Znajdź wszystkie puste komórki (nie zajęte przez węża)
2. Oblicz odległość Manhattan od głowy do każdej pustej komórki
3. Wybierz komórkę z maksymalną odległością
4. W przypadku remisu → losowy wybór spośród komórek o równej odległości

```

**Wzór odległości Manhattan:**
```

distance = |head.x - cell.x| + |head.y - cell.y|

````

---

## ⚡ System Progresji Prędkości

Gra przyspiesza wraz ze zdobywanymi punktami:

```javascript
// Formuła prędkości
const baseSpeed = 100;  // ms
const speedDecrease = Math.floor(score / 50) * 5;
const currentSpeed = Math.max(50, baseSpeed - speedDecrease);
````

| Punkty  | Prędkość | Opis                  |
| ------- | -------- | --------------------- |
| 0-49    | 100ms    | Start                 |
| 50-99   | 95ms     | Lekkie przyspieszenie |
| 100-149 | 90ms     | Zauważalne            |
| 150-199 | 85ms     | Szybko                |
| 200-249 | 80ms     | Bardzo szybko         |
| ...     | ...      | ...                   |
| 500+    | 50ms     | Maksymalna prędkość   |

---

## 🎨 Styl Wizualny - Game Boy Green

### Paleta Kolorów

```css
:root {
	--gb-darkest: #0f380f; /* Najciemniejszy - głowa węża */
	--gb-dark: #306230; /* Ciemny - ciało węża */
	--gb-light: #8bac0f; /* Jasny - linie siatki, UI */
	--gb-lightest: #9bbc0f; /* Najjaśniejszy - tło */
}
```

### Przypisanie Kolorów

| Element      | Kolor                            |
| ------------ | -------------------------------- |
| Tło planszy  | `#9bbc0f` (najjaśniejszy)        |
| Linie siatki | `#8bac0f` (jasny, subtelne)      |
| Głowa węża   | `#0f380f` (najciemniejszy)       |
| Ciało węża   | `#306230` (ciemny)               |
| Jedzenie     | Pulsujące `#8bac0f` ↔ `#9bbc0f` |
| Tekst UI     | `#0f380f` (najciemniejszy)       |

### Efekty Wizualne (Juice)

- **Screen shake** - przy śmierci (100-200ms, subtelny)
- **Pulsowanie jedzenia** - animacja glow
- **Cząsteczki** - przy zjedzeniu jedzenia
- **Wyróżnienie głowy** - inna tekstura/kolor niż ciało

---

## 🔊 System Dźwięku

### Technologia

- **Web Audio API** - synteza programistyczna
- Styl 8-bitowy (square wave, triangle wave)
- Brak muzyki w tle - tylko efekty dźwiękowe

### Efekty Dźwiękowe

| Zdarzenie          | Dźwięk                     |
| ------------------ | -------------------------- |
| Zjedzenie jedzenia | Krótki "beep" (wysoki ton) |
| Śmierć / Game Over | Opadający ton (sad sound)  |
| Ruch węża          | Opcjonalny cichy tick      |

### Ustawienia

- Przycisk mute (zapisywany w localStorage)
- Domyślnie: dźwięk włączony

---

## ♿ Dostępność

### Tryb Wysokiego Kontrastu

- Użytkownik wybiera własne kolory (foreground/background)
- Zapisywane w localStorage
- Dostępne z menu ustawień

```javascript
// Przykład ustawień
{
  highContrastEnabled: true,
  foregroundColor: "#FFFFFF",
  backgroundColor: "#000000"
}
```

### Inne funkcje dostępności (odroczone)

- ❌ Screen reader - nie w MVP
- ❌ Rebindowanie klawiszy - nie w MVP
- ❌ Tryb reduced motion - nie w MVP

---

## 🔄 System Powtórek (Replay)

### Zakres MVP

- **Tylko ostatnia gra** - zapisywana lokalnie
- Brak udostępniania linków
- Brak ghost overlay podczas gry

### Implementacja

```javascript
// Struktura zapisywanej rozgrywki
{
  seed: 12345,           // Seed dla generatora losowego
  moves: ["UP", "UP", "RIGHT", "RIGHT", ...],
  finalScore: 150,
  finalLength: 18,
  timestamp: "2025-12-02T10:30:00Z"
}
```

### Odtwarzanie

- Przycisk "Obejrzyj ostatnią grę" na ekranie Game Over
- Odtwarzanie z tą samą prędkością co oryginalna gra
- Możliwość przerwania i powrotu do menu

---

## 🗄️ Baza Danych i Leaderboard

### Tabela: `leaderboard`

| Kolumna      | Typ          | Opis                          |
| ------------ | ------------ | ----------------------------- |
| id           | INT (PK)     | Unikalny identyfikator        |
| nick         | VARCHAR(100) | Nazwa gracza (max 100 znaków) |
| score        | INT          | Zdobyty wynik                 |
| snake_length | INT          | Końcowa długość węża          |
| created_at   | TIMESTAMP    | Data i czas zapisu            |

### Walidacja Nicku

- Maksymalna długość: **100 znaków**
- Brak innych ograniczeń w MVP

### Walidacja Wyniku (Server-side)

```javascript
// Podstawowa walidacja
function validateScore(score, snakeLength) {
	// Każde jedzenie = +10 punktów, +1 długość
	// Start: 3 segmenty, 0 punktów
	const expectedLength = 3 + score / 10;

	// Sprawdź czy wynik jest sensowny
	if (score < 0) return false;
	if (score % 10 !== 0) return false; // Musi być wielokrotnością 10
	if (snakeLength !== expectedLength) return false;
	if (score > 10000) return false; // Rozsądny limit

	return true;
}
```

### API Endpoints

```
GET  /api/leaderboard          → Top 10 wyników
POST /api/leaderboard          → Zapisz wynik
     Body: { nick, score, snake_length }
```

---

## 🖥️ Interfejs Użytkownika

### Ekran Startowy

```
┌─────────────────────────────────────┐
│                                     │
│            🐍 SNAKE 🐍              │
│                                     │
│     ┌─────────────────────────┐     │
│     │  Wpisz nick...          │     │
│     └─────────────────────────┘     │
│                                     │
│        [ 🎮 START GAME ]            │
│                                     │
│        [ 🏆 LEADERBOARD ]           │
│                                     │
│        [ ⚙️ USTAWIENIA ]            │
│                                     │
└─────────────────────────────────────┘
```

### Ekran Gry

```
┌─────────────────────────────────────┐
│  SCORE: 120    LENGTH: 15    🔊     │
├─────────────────────────────────────┤
│                                     │
│    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░    │
│    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░    │
│    ░░░░░░░░███░░░░░░░░░░░░░░░░░    │
│    ░░░░░░░░░█░░░░░░░░░░░░░░░░░░    │
│    ░░░░░░░░░█░░░░░░░░░░░░░░░░░░    │
│    ░░░░░░░░░█████░░░░░░░░░░░░░░    │
│    ░░░░░░░░░░░░░█░░░░░🍎░░░░░░░    │
│    ░░░░░░░░░░░░░█░░░░░░░░░░░░░░    │
│    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░    │
│                                     │
└─────────────────────────────────────┘
```

### Ekran Game Over

```
┌─────────────────────────────────────┐
│                                     │
│           💀 GAME OVER 💀           │
│                                     │
│          Twój wynik: 150            │
│          Długość węża: 18           │
│                                     │
│     ┌─────────────────────────┐     │
│     │  Twój nick...           │     │
│     └─────────────────────────┘     │
│                                     │
│        [ 💾 ZAPISZ WYNIK ]          │
│                                     │
│        [ 🔄 ZAGRAJ PONOWNIE ]       │
│        [ 🎬 OBEJRZYJ POWTÓRKĘ ]     │
│        [ 🏆 LEADERBOARD ]           │
│        [ 🏠 MENU GŁÓWNE ]           │
│                                     │
└─────────────────────────────────────┘
```

### Ekran Ustawień

```
┌─────────────────────────────────────┐
│                                     │
│           ⚙️ USTAWIENIA             │
│                                     │
│   Dźwięk:        [ON] / OFF         │
│                                     │
│   Wysoki kontrast:  ON / [OFF]      │
│                                     │
│   Kolor pierwszoplanowy:            │
│   ┌──────────────────────┐          │
│   │  #FFFFFF             │  [🎨]    │
│   └──────────────────────┘          │
│                                     │
│   Kolor tła:                        │
│   ┌──────────────────────┐          │
│   │  #000000             │  [🎨]    │
│   └──────────────────────┘          │
│                                     │
│        [ 💾 ZAPISZ ]                │
│        [ ← WRÓĆ ]                   │
│                                     │
└─────────────────────────────────────┘
```

---

## 🏗️ Architektura Kodu

### Struktura Katalogów

```
/src
  /core
    game.js           # Główna logika gry
    snake.js          # Klasa węża
    food.js           # Logika jedzenia
    collision.js      # Wykrywanie kolizji

  /rendering
    canvas.js         # Renderowanie na Canvas
    sprites.js        # Sprite'y pixel art
    effects.js        # Efekty wizualne (shake, particles)

  /input
    keyboard.js       # Obsługa klawiatury
    inputBuffer.js    # Bufor inputów

  /audio
    soundEngine.js    # Web Audio API engine
    sounds.js         # Definicje dźwięków

  /ui
    screens.js        # Ekrany (start, game, gameover)
    leaderboard.js    # Wyświetlanie tabeli wyników
    settings.js       # Panel ustawień

  /api
    leaderboardApi.js # Komunikacja z backendem

  /replay
    recorder.js       # Nagrywanie rozgrywki
    player.js         # Odtwarzanie powtórki

  /utils
    random.js         # Seeded random generator
    storage.js        # localStorage wrapper

  index.js            # Entry point

/server
  index.js            # Express/FastAPI server
  routes/
    leaderboard.js    # API endpoints
  db/
    schema.sql        # Schemat bazy danych

/public
  index.html
  styles.css

/tests
  core.test.js        # Testy logiki gry
```

### Separacja Logiki

```
┌─────────────────────────────────────────────────────┐
│                    Game Loop                         │
├─────────────────────────────────────────────────────┤
│                                                      │
│   Input          Core Logic         Rendering        │
│   ┌─────┐       ┌──────────┐       ┌──────────┐     │
│   │Keyb.│──────▶│  Game    │──────▶│  Canvas  │     │
│   │Buff.│       │  State   │       │  Draw    │     │
│   └─────┘       └──────────┘       └──────────┘     │
│                      │                   │          │
│                      ▼                   ▼          │
│                 ┌──────────┐       ┌──────────┐     │
│                 │  Audio   │       │ Effects  │     │
│                 │  Engine  │       │ Particles│     │
│                 └──────────┘       └──────────┘     │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Technologiczny

### Frontend

- **HTML5 Canvas** - renderowanie gry
- **Vanilla JavaScript** (lub TypeScript)
- **CSS3** - stylowanie UI
- **Web Audio API** - synteza dźwięków

### Backend

- **Node.js + Express** lub **Python + FastAPI**
- **SQLite** - baza danych (prosta, bez konfiguracji)

### Narzędzia

- Brak frameworków frontendowych (czysty JS)
- Brak bundlera wymagane (opcjonalnie Vite)

---

## ❌ Poza Zakresem MVP

| Funkcja                | Status                        |
| ---------------------- | ----------------------------- |
| Obsługa mobile/touch   | ❌ Nie implementujemy         |
| Tryb offline           | ❌ Zakładamy stałe połączenie |
| Pauza                  | ❌ Usunięta z zakresu         |
| Muzyka w tle           | ❌ Tylko SFX                  |
| Ghost overlay          | ❌ Tylko lokalna powtórka     |
| Udostępnianie powtórek | ❌ Nie w MVP                  |
| Rebindowanie klawiszy  | ❌ Odroczone                  |
| Screen reader          | ❌ Odroczone                  |
| Poziomy trudności      | ❌ Zastąpione progresją       |

---

## ✅ Checklist MVP

- [ ] Ekran startowy z polem na nick
- [ ] Przycisk START
- [ ] Plansza 20×20 w stylu Game Boy
- [ ] Wąż startowy (3 segmenty)
- [ ] Sterowanie strzałkami/WASD
- [ ] Bufor inputów (2-frame)
- [ ] Automatyczny ruch węża
- [ ] Spawn jedzenia (najdalej od głowy)
- [ ] Wydłużanie węża po zjedzeniu
- [ ] Liczenie punktów (+10)
- [ ] Progresja prędkości (co 50 pkt)
- [ ] Wykrywanie kolizji (ściana + ogon)
- [ ] Screen shake przy śmierci
- [ ] Efekty cząsteczkowe
- [ ] Dźwięki (Web Audio API)
- [ ] Ekran Game Over
- [ ] Zapisywanie do bazy danych
- [ ] Walidacja wyniku server-side
- [ ] Leaderboard (top 10)
- [ ] Nagrywanie ostatniej gry
- [ ] Odtwarzanie powtórki
- [ ] Tryb wysokiego kontrastu
- [ ] Ustawienia (dźwięk, kolory)
- [ ] Przycisk "Zagraj ponownie"

---

## 📅 Dokument utworzony

**Data:** 2 grudnia 2025  
**Sesja planowania:** Snake Game MVP  
**Wersja:** 1.0

---

```

Utworzyłem plik `SNAKE_SPEC.md` z kompletną specyfikacją techniczną gry Snake! 🐍

Dokument zawiera:

### 📋 Zawartość

1. **Parametry gry** - wymiary, prędkość, progresja
2. **Sterowanie** - klawiatura, system buforowania
3. **Algorytm spawn jedzenia** - Manhattan distance, najdalej od głowy
4. **System progresji prędkości** - wzór i tabela
5. **Styl wizualny** - paleta Game Boy green z kodami HEX
6. **System dźwięku** - Web Audio API, lista SFX
7. **Dostępność** - tryb wysokiego kontrastu
8. **System powtórek** - struktura danych, implementacja
9. **Baza danych** - schemat tabeli, walidacja, API endpoints
10. **Interfejs użytkownika** - ASCII mockupy wszystkich ekranów
11. **Architektura kodu** - struktura katalogów, separacja logiki
12. **Stack technologiczny** - frontend/backend
13. **Lista funkcji poza zakresem MVP**
14. **Checklist implementacji**

---

Czy chcesz, żebym:
- **Zaczął implementację** gry na podstawie tej specyfikacji?
- **Zmodyfikował** cokolwiek w dokumencie?
- **Dodał** więcej szczegółów do którejś sekcji?

```
