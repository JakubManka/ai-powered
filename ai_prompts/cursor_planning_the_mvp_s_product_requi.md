# Planning the MVP's product requirements document

---

**User**

You are an AI assistant tasked with summarizing a conversation about planning the MVP's Product Requirements Document (PRD) and preparing a concise summary for the next stage of development. The conversation history contains the following information:

Project description

Identified user problem

Conversation history containing questions and answers

Recommendations for the PRD content

Your task is to:

Summarize the conversation history, focusing on all decisions related to PRD planning.

Match the model's recommendations to the answers provided in the conversation history. Identify which recommendations are relevant based on the discussion. 3. Prepare a detailed conversation summary that includes:

a. Key functional requirements of the product

b. Key user stories and user journeys

c. Important success criteria and how to measure them

d. Any unresolved issues or areas requiring further clarification

Format the results as follows:

<conversation_summary>

[List the decisions made by the user, numbered].

<matched_recommendations>

[List the most important recommendations matched to the conversation, numbered].

</matched_recommendations>

<prd_planning_summary>

[Provide a detailed summary of the conversation, including the items listed in Step 3].

</prd_planning_summary>

<unresolved_issues>

[List any unresolved issues or areas requiring further clarification, if any]

</unresolved_issues>

</conversation_summary>

The final output should contain only markdown content. Ensure your summary is clear, concise, and provides valuable information for the next stage of PRD development.

@MVP.md

---

**Cursor**

# Snake Game MVP - PRD Planning Summary

<conversation_summary>

## Decisions Made by the User

1. **Game Board**: 20×20 cell grid with Game Boy Green aesthetic
2. **Snake Mechanics**: Starting length of 3 segments, +1 segment per food eaten
3. **Scoring System**: +10 points per food item
4. **Speed Progression**: Base 100ms, decreases by 5ms every 50 points, minimum 50ms
5. **Controls**: Arrow keys and WASD support with 2-frame input buffering
6. **Movement Restriction**: Snake cannot reverse 180° direction
7. **Food Spawn Algorithm**: Manhattan distance-based, spawns farthest from snake head
8. **Visual Style**: 4-color Game Boy palette (#0f380f, #306230, #8bac0f, #9bbc0f)
9. **Visual Effects**: Screen shake on death, particle effects on eating, pulsing food animation
10. **Audio**: Web Audio API with 8-bit synthesized SFX only (no background music)
11. **Persistence**: Sound/accessibility settings saved to localStorage
12. **Accessibility**: High contrast mode with user-customizable foreground/background colors
13. **Replay System**: Local-only, last game only, deterministic playback via seed + moves
14. **Leaderboard**: Top 10 scores, server-side validation, nick max 100 characters
15. **Tech Stack**: Vanilla JS, HTML5 Canvas, SQLite, Node.js+Express or Python+FastAPI
16. **Excluded from MVP**: Pause, mobile support, offline mode, ghost overlay, replay sharing, key rebinding, screen reader support

<matched_recommendations>

1. **Keep it simple** - No frameworks, vanilla JS approach aligns with rapid MVP development
2. **Deterministic replay** - Using seed-based randomization enables efficient replay storage (just seed + moves array)
3. **Progressive difficulty** - Speed increase every 50 points provides smooth difficulty curve without complex level systems
4. **Server-side validation** - Score/length mathematical relationship (length = 3 + score/10) prevents basic cheating
5. **Manhattan distance for food** - Simple, predictable algorithm that increases challenge as snake grows
6. **2-frame input buffer** - Prevents input "swallowing" during fast gameplay, improving responsiveness
7. **Minimal audio** - SFX-only approach reduces scope while maintaining game feel
8. **localStorage for settings** - Simple persistence without authentication complexity
9. **SQLite database** - Zero-configuration database suitable for MVP scale

</matched_recommendations>

<prd_planning_summary>

### Key Functional Requirements

**Core Gameplay**

- Snake moves automatically in current direction at speed determined by score
- Player controls direction via keyboard (arrows/WASD)
- Collision with walls or snake body triggers game over
- Eating food increases length by 1, score by 10, and potentially increases speed

**Input System**

- 2-frame input buffer to prevent lost inputs during rapid play
- Direction change requests queued and processed sequentially
- 180° reversal blocked (e.g., cannot go from UP to DOWN directly)

**Food System**

- Single food item on board at all times
- Spawns at cell with maximum Manhattan distance from snake head
- Ties broken randomly (using seeded RNG for replay determinism)

**Progression System**

- Speed formula: `max(50, 100 - floor(score/50) * 5)`
- Creates natural difficulty curve without explicit levels

**Audio/Visual**

- Game Boy Green 4-color palette throughout
- Screen shake effect (100-200ms) on death
- Particle burst when eating food
- Pulsing glow animation on food
- 8-bit synthesized sound effects via Web Audio API

**Leaderboard**

- Display top 10 scores with nick, score, snake length, timestamp
- Server validates: score ≥ 0, score % 10 === 0, length === 3 + score/10, score ≤ 10000

**Replay**

- Records: seed, move sequence, final score/length, timestamp
- Playback recreates exact game using deterministic RNG
- Only most recent game stored

**Settings**

- Sound mute toggle
- High contrast mode with color pickers for foreground/background

### Key User Stories

1. **As a player**, I want to enter my nickname before playing so my score can be identified on the leaderboard
2. **As a player**, I want responsive controls so I can make quick direction changes during fast gameplay
3. **As a player**, I want the game to get faster as I progress so I feel challenged
4. **As a player**, I want to see my final score and submit it to the leaderboard after game over
5. **As a player**, I want to watch a replay of my last game to see what went wrong
6. **As a player**, I want to toggle sound on/off and have that preference remembered
7. **As a player with visual impairments**, I want to customize colors for better visibility

### User Journey

```
Start Screen → Enter Nick → Click START →
Gameplay Loop (move, eat, grow, speed up) →
Collision/Death → Game Over Screen →
[Save Score / Watch Replay / Play Again / View Leaderboard / Return to Menu]
```

### Success Criteria

| Metric                | Target                     | Measurement                           |
| --------------------- | -------------------------- | ------------------------------------- |
| Game loop stability   | 60 FPS consistent          | Browser dev tools performance monitor |
| Input latency         | < 16ms response            | Input timestamp to state change delta |
| Replay accuracy       | 100% deterministic         | Same seed + moves = identical outcome |
| Score validation      | 0% invalid scores accepted | Server-side validation pass rate      |
| Leaderboard load time | < 500ms                    | API response time                     |

</prd_planning_summary>

<unresolved_issues>

1. **Backend choice not finalized**: Document mentions "Node.js + Express OR Python + FastAPI" - needs definitive selection
2. **Deployment environment**: No hosting/deployment strategy specified
3. **Error handling**: No specification for network failures when submitting scores
4. **Rate limiting**: No anti-spam measures for leaderboard submissions defined
5. **Nick uniqueness**: Not specified if duplicate nicks are allowed on leaderboard
6. **Replay storage limit**: No specification on localStorage size limits or cleanup strategy
7. **Browser support**: Minimum browser versions not specified
8. **Canvas sizing**: Exact pixel dimensions and responsive behavior not defined
9. **Game state recovery**: Behavior on accidental browser close/refresh not specified
10. **Loading states**: No UX specification for leaderboard loading or submission states

</unresolved_issues>

</conversation_summary>

---

## Next Steps for Development

1. **Resolve backend technology choice** (Node.js vs Python)
2. **Define deployment strategy** (hosting, CI/CD)
3. **Create detailed technical design** for each module in `/src`
4. **Establish browser compatibility matrix**
5. **Design error states and loading UX**
6. **Set up project scaffolding** with chosen tooling

```plaintext
Start Screen → Enter Nick → Click START →
Gameplay Loop (move, eat, grow, speed up) →
Collision/Death → Game Over Screen →
[Save Score / Watch Replay / Play Again / View Leaderboard / Return to Menu]
```

---

**User**

zapisz to w pliku .md

---

**Cursor**

```markdown
# Snake Game MVP - PRD Planning Summary

<conversation_summary>

## Decisions Made by the User

1. **Game Board**: 20×20 cell grid with Game Boy Green aesthetic
2. **Snake Mechanics**: Starting length of 3 segments, +1 segment per food eaten
3. **Scoring System**: +10 points per food item
4. **Speed Progression**: Base 100ms, decreases by 5ms every 50 points, minimum 50ms
5. **Controls**: Arrow keys and WASD support with 2-frame input buffering
6. **Movement Restriction**: Snake cannot reverse 180° direction
7. **Food Spawn Algorithm**: Manhattan distance-based, spawns farthest from snake head
8. **Visual Style**: 4-color Game Boy palette (#0f380f, #306230, #8bac0f, #9bbc0f)
9. **Visual Effects**: Screen shake on death, particle effects on eating, pulsing food animation
10. **Audio**: Web Audio API with 8-bit synthesized SFX only (no background music)
11. **Persistence**: Sound/accessibility settings saved to localStorage
12. **Accessibility**: High contrast mode with user-customizable foreground/background colors
13. **Replay System**: Local-only, last game only, deterministic playback via seed + moves
14. **Leaderboard**: Top 10 scores, server-side validation, nick max 100 characters
15. **Tech Stack**: Vanilla JS, HTML5 Canvas, SQLite, Node.js+Express or Python+FastAPI
16. **Excluded from MVP**: Pause, mobile support, offline mode, ghost overlay, replay sharing, key rebinding, screen reader support

<matched_recommendations>

1. **Keep it simple** - No frameworks, vanilla JS approach aligns with rapid MVP development
2. **Deterministic replay** - Using seed-based randomization enables efficient replay storage (just seed + moves array)
3. **Progressive difficulty** - Speed increase every 50 points provides smooth difficulty curve without complex level systems
4. **Server-side validation** - Score/length mathematical relationship (length = 3 + score/10) prevents basic cheating
5. **Manhattan distance for food** - Simple, predictable algorithm that increases challenge as snake grows
6. **2-frame input buffer** - Prevents input "swallowing" during fast gameplay, improving responsiveness
7. **Minimal audio** - SFX-only approach reduces scope while maintaining game feel
8. **localStorage for settings** - Simple persistence without authentication complexity
9. **SQLite database** - Zero-configuration database suitable for MVP scale

</matched_recommendations>

<prd_planning_summary>

### Key Functional Requirements

**Core Gameplay**

- Snake moves automatically in current direction at speed determined by score
- Player controls direction via keyboard (arrows/WASD)
- Collision with walls or snake body triggers game over
- Eating food increases length by 1, score by 10, and potentially increases speed

**Input System**

- 2-frame input buffer to prevent lost inputs during rapid play
- Direction change requests queued and processed sequentially
- 180° reversal blocked (e.g., cannot go from UP to DOWN directly)

**Food System**

- Single food item on board at all times
- Spawns at cell with maximum Manhattan distance from snake head
- Ties broken randomly (using seeded RNG for replay determinism)

**Progression System**

- Speed formula: `max(50, 100 - floor(score/50) * 5)`
- Creates natural difficulty curve without explicit levels

**Audio/Visual**

- Game Boy Green 4-color palette throughout
- Screen shake effect (100-200ms) on death
- Particle burst when eating food
- Pulsing glow animation on food
- 8-bit synthesized sound effects via Web Audio API

**Leaderboard**

- Display top 10 scores with nick, score, snake length, timestamp
- Server validates: score ≥ 0, score % 10 === 0, length === 3 + score/10, score ≤ 10000

**Replay**

- Records: seed, move sequence, final score/length, timestamp
- Playback recreates exact game using deterministic RNG
- Only most recent game stored

**Settings**

- Sound mute toggle
- High contrast mode with color pickers for foreground/background

### Key User Stories

1. **As a player**, I want to enter my nickname before playing so my score can be identified on the leaderboard
2. **As a player**, I want responsive controls so I can make quick direction changes during fast gameplay
3. **As a player**, I want the game to get faster as I progress so I feel challenged
4. **As a player**, I want to see my final score and submit it to the leaderboard after game over
5. **As a player**, I want to watch a replay of my last game to see what went wrong
6. **As a player**, I want to toggle sound on/off and have that preference remembered
7. **As a player with visual impairments**, I want to customize colors for better visibility

### User Journey
```

Start Screen → Enter Nick → Click START →
Gameplay Loop (move, eat, grow, speed up) →
Collision/Death → Game Over Screen →
[Save Score / Watch Replay / Play Again / View Leaderboard / Return to Menu]

```

### Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Game loop stability | 60 FPS consistent | Browser dev tools performance monitor |
| Input latency | < 16ms response | Input timestamp to state change delta |
| Replay accuracy | 100% deterministic | Same seed + moves = identical outcome |
| Score validation | 0% invalid scores accepted | Server-side validation pass rate |
| Leaderboard load time | < 500ms | API response time |

</prd_planning_summary>

<unresolved_issues>

1. **Backend choice not finalized**: Document mentions "Node.js + Express OR Python + FastAPI" - needs definitive selection
2. **Deployment environment**: No hosting/deployment strategy specified
3. **Error handling**: No specification for network failures when submitting scores
4. **Rate limiting**: No anti-spam measures for leaderboard submissions defined
5. **Nick uniqueness**: Not specified if duplicate nicks are allowed on leaderboard
6. **Replay storage limit**: No specification on localStorage size limits or cleanup strategy
7. **Browser support**: Minimum browser versions not specified
8. **Canvas sizing**: Exact pixel dimensions and responsive behavior not defined
9. **Game state recovery**: Behavior on accidental browser close/refresh not specified
10. **Loading states**: No UX specification for leaderboard loading or submission states

</unresolved_issues>

</conversation_summary>

---

## Next Steps for Development

1. **Resolve backend technology choice** (Node.js vs Python)
2. **Define deployment strategy** (hosting, CI/CD)
3. **Create detailed technical design** for each module in `/src`
4. **Establish browser compatibility matrix**
5. **Design error states and loading UX**
6. **Set up project scaffolding** with chosen tooling

```

Zapisałem podsumowanie PRD w pliku `PRD_Summary.md` w głównym katalogu projektu. Plik zawiera:

- ✅ **16 decyzji** podjętych podczas planowania
- ✅ **9 dopasowanych rekomendacji**
- ✅ **Kluczowe wymagania funkcjonalne** (gameplay, input, food, progression, audio/visual, leaderboard, replay, settings)
- ✅ **7 user stories**
- ✅ **User journey** z diagramem przepływu
- ✅ **Kryteria sukcesu** z metrykami i sposobami pomiaru
- ✅ **10 nierozwiązanych kwestii** wymagających dalszych decyzji
- ✅ **Kolejne kroki** do rozpoczęcia developmentu
