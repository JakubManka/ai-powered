# Create a comprehensive product requirements document

---

**User**

You are an experienced product manager tasked with creating a comprehensive product requirements document (PRD) based on the following descriptions:

<project_description>

{{project-description}} <- Enter the MVP idea

</project_description>

<project_details>

{{project-details}} <- Enter the planning session summary

</project_details>

Follow these steps to create a comprehensive and well-organized document:

Divide the PRD into the following sections:

a. Design Overview

b. User Problem

c. Functional Requirements

d. Project Boundaries

e. User Stories

f. Success Metrics

In each section, provide detailed and relevant information based on the project description and answers to the clarifying questions. Ensure that:

You use clear and concise language

You provide specific details and data where necessary

You maintain consistency throughout the document

You address all points listed in each section

When creating user stories and acceptance criteria

List ALL necessary user stories, including baseline, alternative, and extreme scenarios.

Assign a unique requirement identifier (e.g., US-001) to each user story for direct traceability.

Include at least one user story specifically for secure access or authentication if the application requires user identification or access restrictions.

Ensure that no potential user interactions are omitted.

Ensure that each user story is testable.

Use the following structure for each user story:

ID

Title

Description

Acceptance Criteria

Once the PRD is complete, review it against this checklist:

Is each user story testable?

Are the acceptance criteria clear and specific?

Do we have enough user stories to build a fully functional application?

Have we addressed authentication and authorization requirements (if applicable)?

Formatting the PRD:

Maintain consistent formatting and numbering.

Do not use bold formatting in markdown ( \*\* ).

List ALL user stories.

Format the PRD in correct markdown.

Prepare a PRD with the following structure:

# Product Requirements Document (PRD) - {{app-name}}

## 1. Product Overview

## 2. User Problem

## 3. Functional Requirements

## 4. Product Boundaries

## 5. User Stories

## 6. Success Metrics

Remember to fill out each section with detailed, relevant information based on the project description and our clarifying questions. Make sure the PRD is comprehensive, clear, and includes all the relevant information needed to further develop the product.

The final output should consist solely of a PRD following the specified markdown format, which you will save as an .ai/prd.md file.@PRD_Summary.md @MVP.md

---

**Cursor**

I'll create a comprehensive PRD based on the MVP.md and PRD_Summary.md files. Let me first create the directory structure and then the PRD document.

```markdown
# Product Requirements Document (PRD) - Snake Game

## 1. Product Overview

### 1.1 Product Description

A classic Snake game reimagined with a nostalgic Game Boy aesthetic. Players control a snake on a 20×20 grid, collecting food to grow longer and accumulate points. The game features progressive difficulty through increasing speed, a global leaderboard system, and a replay feature for reviewing gameplay.

### 1.2 Target Platform

Desktop web browsers with keyboard input support. Mobile devices and touch controls are explicitly excluded from this version.

### 1.3 Technology Stack

- Frontend: Vanilla JavaScript, HTML5 Canvas, CSS3, Web Audio API
- Backend: Node.js with Express OR Python with FastAPI (to be determined)
- Database: SQLite
- No frontend frameworks or required bundlers

### 1.4 Visual Identity

The game employs a 4-color Game Boy Green palette:

| Color Code | Usage                         |
| ---------- | ----------------------------- |
| #0f380f    | Snake head, UI text (darkest) |
| #306230    | Snake body (dark)             |
| #8bac0f    | Grid lines, food glow (light) |
| #9bbc0f    | Background (lightest)         |

---

## 2. User Problem

### 2.1 Problem Statement

Players seeking a nostalgic, quick-play gaming experience lack access to a well-designed, browser-based Snake game that combines classic gameplay with modern quality-of-life features such as responsive controls, visual polish, and competitive leaderboards.

### 2.2 Target Users

- Casual gamers looking for quick entertainment sessions
- Retro gaming enthusiasts who appreciate Game Boy aesthetics
- Competitive players who enjoy leaderboard-based challenges
- Users with visual impairments requiring high contrast display options

### 2.3 User Needs

1. Responsive, reliable controls that do not lose inputs during fast gameplay
2. Clear visual feedback for game events (eating, collision, game over)
3. Ability to track and compare scores with other players
4. Option to review gameplay to understand mistakes
5. Customizable visual settings for accessibility

---

## 3. Functional Requirements

### 3.1 Core Gameplay Mechanics

#### 3.1.1 Game Board

- Grid size: 20×20 cells
- Visual style: Game Boy Green palette
- Subtle grid lines for cell visibility

#### 3.1.2 Snake Mechanics

- Starting length: 3 segments
- Growth: +1 segment per food consumed
- Movement: Automatic in current direction
- Cannot reverse direction 180 degrees (e.g., cannot go from UP to DOWN directly)

#### 3.1.3 Speed Progression

- Base speed: 100ms per move
- Speed decrease: 5ms for every 50 points scored
- Minimum speed: 50ms (maximum 20 moves per second)
- Formula: `currentSpeed = max(50, 100 - floor(score / 50) * 5)`

| Score Range | Speed (ms) | Moves/Second |
| ----------- | ---------- | ------------ |
| 0-49        | 100        | 10           |
| 50-99       | 95         | ~10.5        |
| 100-149     | 90         | ~11.1        |
| 150-199     | 85         | ~11.8        |
| 200-249     | 80         | 12.5         |
| 500+        | 50         | 20           |

#### 3.1.4 Scoring System

- Points per food: +10
- Score validation formula: `snakeLength === 3 + (score / 10)`
- Maximum accepted score: 10,000 points

#### 3.1.5 Food Spawning Algorithm

1. Identify all empty cells (not occupied by snake)
2. Calculate Manhattan distance from snake head to each empty cell
3. Select the cell with maximum distance
4. If multiple cells tie for maximum distance, select randomly using seeded RNG

- Manhattan distance formula: `distance = |head.x - cell.x| + |head.y - cell.y|`

#### 3.1.6 Collision Detection

- Wall collision: Snake head exits grid boundaries
- Self collision: Snake head occupies same cell as any body segment
- Both collision types trigger game over state

### 3.2 Input System

#### 3.2.1 Supported Controls

- Arrow keys: UP, DOWN, LEFT, RIGHT
- WASD keys: W (up), A (left), S (down), D (right)

#### 3.2.2 Input Buffer

- 2-frame input buffer system
- Second input is queued, not ignored
- Queued inputs processed sequentially
- Prevents input loss during rapid direction changes

### 3.3 Audio System

#### 3.3.1 Technology

- Web Audio API with programmatic synthesis
- 8-bit style waveforms (square wave, triangle wave)

#### 3.3.2 Sound Effects

| Event          | Sound Description                   |
| -------------- | ----------------------------------- |
| Food consumed  | Short high-pitched beep             |
| Game over      | Descending sad tone                 |
| Snake movement | Optional subtle tick (configurable) |

#### 3.3.3 Audio Settings

- Mute toggle button
- Setting persisted to localStorage
- Default state: sound enabled

### 3.4 Visual Effects

#### 3.4.1 Screen Shake

- Trigger: Game over (death)
- Duration: 100-200ms
- Intensity: Subtle displacement

#### 3.4.2 Particle Effects

- Trigger: Food consumption
- Style: Burst of particles from food location

#### 3.4.3 Food Animation

- Pulsing glow effect
- Color oscillation between #8bac0f and #9bbc0f

#### 3.4.4 Snake Visual Distinction

- Head: Distinct color/texture (#0f380f)
- Body: Secondary color (#306230)

### 3.5 User Interface Screens

#### 3.5.1 Start Screen

- Game title display
- Nickname input field
- Start Game button
- Leaderboard button
- Settings button

#### 3.5.2 Game Screen

- Current score display
- Current snake length display
- Sound mute toggle
- Game board (20×20 grid)

#### 3.5.3 Game Over Screen

- Final score display
- Final snake length display
- Nickname input field (pre-filled if previously entered)
- Save Score button
- Play Again button
- Watch Replay button
- View Leaderboard button
- Return to Menu button

#### 3.5.4 Settings Screen

- Sound toggle (ON/OFF)
- High contrast mode toggle
- Foreground color picker (when high contrast enabled)
- Background color picker (when high contrast enabled)
- Save button
- Back button

#### 3.5.5 Leaderboard Screen

- Top 10 scores display
- Columns: Rank, Nickname, Score, Snake Length, Date
- Back button

### 3.6 Replay System

#### 3.6.1 Recording

- Data captured: RNG seed, move sequence, final score, final length, timestamp
- Storage: localStorage (client-side only)
- Retention: Most recent game only (overwrites previous)

#### 3.6.2 Playback

- Deterministic recreation using seed and move sequence
- Playback speed matches original game speed
- Cancel button to return to menu

### 3.7 Leaderboard System

#### 3.7.1 Display

- Shows top 10 scores
- Fields: Nickname, Score, Snake Length, Timestamp

#### 3.7.2 API Endpoints

- GET /api/leaderboard - Retrieve top 10 scores
- POST /api/leaderboard - Submit new score

#### 3.7.3 Server-Side Validation

- score >= 0
- score % 10 === 0 (must be multiple of 10)
- snakeLength === 3 + (score / 10)
- score <= 10000

### 3.8 Accessibility Features

#### 3.8.1 High Contrast Mode

- User-selectable foreground color
- User-selectable background color
- Settings persisted to localStorage

### 3.9 Data Persistence

#### 3.9.1 localStorage (Client)

- Sound mute preference
- High contrast mode enabled flag
- Custom foreground color
- Custom background color
- Last game replay data

#### 3.9.2 Database (Server)

- Table: leaderboard
  - id: INT (Primary Key)
  - nick: VARCHAR(100)
  - score: INT
  - snake_length: INT
  - created_at: TIMESTAMP

---

## 4. Product Boundaries

### 4.1 In Scope

- Desktop web browser gameplay with keyboard controls
- Single-player mode only
- Global leaderboard with top 10 scores
- Local replay of most recent game
- High contrast accessibility mode
- 8-bit sound effects via Web Audio API
- Game Boy Green visual theme

### 4.2 Out of Scope

| Feature                      | Status   | Rationale                             |
| ---------------------------- | -------- | ------------------------------------- |
| Mobile/touch support         | Excluded | Complexity, keyboard-focused gameplay |
| Pause functionality          | Excluded | Scope reduction for MVP               |
| Background music             | Excluded | SFX-only approach                     |
| Offline mode                 | Excluded | Assumes network connectivity          |
| Ghost overlay during play    | Excluded | Complexity                            |
| Replay sharing/links         | Excluded | Requires additional infrastructure    |
| Key rebinding                | Deferred | Post-MVP enhancement                  |
| Screen reader support        | Deferred | Post-MVP accessibility enhancement    |
| Reduced motion mode          | Deferred | Post-MVP accessibility enhancement    |
| Difficulty levels            | Excluded | Replaced by progressive speed system  |
| Multiple concurrent replays  | Excluded | Only stores last game                 |
| User accounts/authentication | Excluded | Nickname-only identification          |

### 4.3 Assumptions

- Users have modern desktop web browsers (Chrome, Firefox, Safari, Edge)
- Users have stable network connectivity for leaderboard features
- Users have functional keyboard input devices
- JavaScript is enabled in user browsers

### 4.4 Constraints

- Nickname maximum length: 100 characters
- Maximum acceptable score: 10,000 points
- Leaderboard displays only top 10 entries
- Single replay storage (most recent game only)

---

## 5. User Stories

### 5.1 Game Initialization

#### US-001: Enter Nickname Before Playing

- ID: US-001
- Title: Enter Nickname Before Playing
- Description: As a player, I want to enter my nickname before starting the game so that my score can be identified on the leaderboard.
- Acceptance Criteria:
  1. Start screen displays a text input field for nickname
  2. Nickname field accepts up to 100 characters
  3. Nickname is preserved when navigating between screens within session
  4. Empty nickname is allowed (score submitted as anonymous or empty string)
  5. Nickname input field is focused by default on start screen

#### US-002: Start New Game

- ID: US-002
- Title: Start New Game
- Description: As a player, I want to click a Start button to begin a new game so that I can play Snake.
- Acceptance Criteria:
  1. Start screen displays a clearly visible Start Game button
  2. Clicking Start Game transitions to the game screen
  3. Game begins with snake at starting position (3 segments)
  4. Score is reset to 0
  5. Snake begins moving automatically in a default direction
  6. Food spawns on the board using the Manhattan distance algorithm

### 5.2 Core Gameplay

#### US-003: Control Snake with Arrow Keys

- ID: US-003
- Title: Control Snake with Arrow Keys
- Description: As a player, I want to control the snake direction using arrow keys so that I can navigate the game board.
- Acceptance Criteria:
  1. Pressing UP arrow changes snake direction to up (if not currently moving down)
  2. Pressing DOWN arrow changes snake direction to down (if not currently moving up)
  3. Pressing LEFT arrow changes snake direction to left (if not currently moving right)
  4. Pressing RIGHT arrow changes snake direction to right (if not currently moving left)
  5. Direction change takes effect on the next movement tick

#### US-004: Control Snake with WASD Keys

- ID: US-004
- Title: Control Snake with WASD Keys
- Description: As a player, I want to control the snake direction using WASD keys so that I have an alternative control scheme.
- Acceptance Criteria:
  1. Pressing W changes snake direction to up (if not currently moving down)
  2. Pressing S changes snake direction to down (if not currently moving up)
  3. Pressing A changes snake direction to left (if not currently moving right)
  4. Pressing D changes snake direction to right (if not currently moving left)
  5. WASD and arrow keys function identically and interchangeably

#### US-005: Input Buffering for Rapid Direction Changes

- ID: US-005
- Title: Input Buffering for Rapid Direction Changes
- Description: As a player, I want my rapid direction inputs to be buffered so that quick successive key presses are not lost.
- Acceptance Criteria:
  1. When a second direction input is received before the first is processed, it is queued
  2. Queued input is processed on the subsequent movement tick
  3. Buffer holds maximum of one pending input (2-frame buffer)
  4. Buffered input respects 180-degree reversal restriction
  5. Invalid buffered inputs are discarded

#### US-006: Prevent 180-Degree Reversal

- ID: US-006
- Title: Prevent 180-Degree Reversal
- Description: As a player, I want the game to prevent me from reversing direction 180 degrees so that I cannot accidentally kill myself by moving into my own body.
- Acceptance Criteria:
  1. When moving UP, pressing DOWN is ignored
  2. When moving DOWN, pressing UP is ignored
  3. When moving LEFT, pressing RIGHT is ignored
  4. When moving RIGHT, pressing LEFT is ignored
  5. Ignored inputs do not enter the input buffer

#### US-007: Collect Food and Grow

- ID: US-007
- Title: Collect Food and Grow
- Description: As a player, I want my snake to grow when it eats food so that I can see my progress in the game.
- Acceptance Criteria:
  1. When snake head occupies the same cell as food, food is consumed
  2. Snake length increases by 1 segment after consuming food
  3. New segment is added at the tail end of the snake
  4. Food consumption sound effect plays (if sound enabled)
  5. Particle effect displays at food location

#### US-008: Score Points for Eating Food

- ID: US-008
- Title: Score Points for Eating Food
- Description: As a player, I want to earn 10 points each time my snake eats food so that I can track my performance.
- Acceptance Criteria:
  1. Score increases by exactly 10 points when food is consumed
  2. Score display updates immediately after food consumption
  3. Score is displayed on the game screen at all times during gameplay

#### US-009: Experience Progressive Speed Increase

- ID: US-009
- Title: Experience Progressive Speed Increase
- Description: As a player, I want the game to speed up as my score increases so that I face an increasing challenge.
- Acceptance Criteria:
  1. Game starts at 100ms per move (10 moves per second)
  2. Speed decreases by 5ms for every 50 points earned
  3. Speed never goes below 50ms (maximum 20 moves per second)
  4. Speed change takes effect immediately upon reaching score threshold
  5. Speed formula is: max(50, 100 - floor(score / 50) \* 5)

#### US-010: Food Spawns at Maximum Distance

- ID: US-010
- Title: Food Spawns at Maximum Distance
- Description: As a player, I want food to spawn at the farthest point from my snake head so that I must traverse the board to collect it.
- Acceptance Criteria:
  1. After food is consumed, new food spawns within one game tick
  2. New food position is the empty cell with maximum Manhattan distance from snake head
  3. If multiple cells tie for maximum distance, one is selected randomly
  4. Food never spawns on a cell occupied by the snake
  5. Random selection uses seeded RNG for replay determinism

### 5.3 Game Over Conditions

#### US-011: Game Over on Wall Collision

- ID: US-011
- Title: Game Over on Wall Collision
- Description: As a player, I want the game to end when my snake hits a wall so that there are boundaries to the play area.
- Acceptance Criteria:
  1. Game ends immediately when snake head moves outside the 20×20 grid
  2. Screen shake effect plays on collision
  3. Game over sound effect plays (if sound enabled)
  4. Transition to game over screen occurs after effects complete

#### US-012: Game Over on Self Collision

- ID: US-012
- Title: Game Over on Self Collision
- Description: As a player, I want the game to end when my snake collides with its own body so that self-avoidance is part of the challenge.
- Acceptance Criteria:
  1. Game ends immediately when snake head occupies the same cell as any body segment
  2. Screen shake effect plays on collision
  3. Game over sound effect plays (if sound enabled)
  4. Transition to game over screen occurs after effects complete

#### US-013: View Final Score on Game Over

- ID: US-013
- Title: View Final Score on Game Over
- Description: As a player, I want to see my final score and snake length after the game ends so that I know how well I performed.
- Acceptance Criteria:
  1. Game over screen displays final score
  2. Game over screen displays final snake length
  3. Information is displayed prominently and clearly
  4. Screen remains visible until player takes an action

### 5.4 Leaderboard

#### US-014: Submit Score to Leaderboard

- ID: US-014
- Title: Submit Score to Leaderboard
- Description: As a player, I want to submit my score to the leaderboard so that I can compete with other players.
- Acceptance Criteria:
  1. Game over screen displays Save Score button
  2. Clicking Save Score sends nickname, score, and snake length to server
  3. Server validates score using formula: snakeLength === 3 + (score / 10)
  4. Server validates score is non-negative, multiple of 10, and <= 10000
  5. Success message displays after successful submission
  6. Error message displays if validation fails or network error occurs
  7. Save Score button is disabled after successful submission to prevent duplicates

#### US-015: View Leaderboard

- ID: US-015
- Title: View Leaderboard
- Description: As a player, I want to view the top 10 scores so that I can see how I rank against other players.
- Acceptance Criteria:
  1. Leaderboard is accessible from start screen and game over screen
  2. Displays top 10 scores sorted by score descending
  3. Each entry shows: rank, nickname, score, snake length, date
  4. Leaderboard loads within 500ms under normal network conditions
  5. Loading indicator displays while fetching data
  6. Error message displays if leaderboard fails to load

### 5.5 Replay System

#### US-016: Automatic Game Recording

- ID: US-016
- Title: Automatic Game Recording
- Description: As a player, I want my game to be automatically recorded so that I can watch it later.
- Acceptance Criteria:
  1. Every game session is recorded automatically
  2. Recording captures: RNG seed, all move inputs, final score, final length, timestamp
  3. Recording is stored in localStorage
  4. New recording overwrites previous recording
  5. Recording begins when game starts and ends on game over

#### US-017: Watch Replay of Last Game

- ID: US-017
- Title: Watch Replay of Last Game
- Description: As a player, I want to watch a replay of my last game so that I can see what went wrong or review my gameplay.
- Acceptance Criteria:
  1. Game over screen displays Watch Replay button
  2. Clicking Watch Replay starts playback of the recorded game
  3. Playback uses same speed progression as original game
  4. Snake movement, food spawns, and score are identical to original
  5. Cancel button is available to stop playback and return to menu
  6. Watch Replay button is disabled if no recording exists

### 5.6 Settings and Accessibility

#### US-018: Toggle Sound On/Off

- ID: US-018
- Title: Toggle Sound On/Off
- Description: As a player, I want to toggle sound effects on or off so that I can play without disturbing others.
- Acceptance Criteria:
  1. Sound toggle is accessible from settings screen
  2. Sound toggle is accessible from game screen (mute button)
  3. When muted, no sound effects play
  4. Setting is persisted to localStorage
  5. Setting is loaded on application start
  6. Default state is sound enabled

#### US-019: Enable High Contrast Mode

- ID: US-019
- Title: Enable High Contrast Mode
- Description: As a player with visual impairments, I want to enable a high contrast mode so that I can see the game elements more clearly.
- Acceptance Criteria:
  1. Settings screen displays high contrast mode toggle
  2. When enabled, color picker inputs appear for foreground and background
  3. Game renders using user-selected colors instead of Game Boy palette
  4. Snake, food, and grid are rendered in foreground color
  5. Background is rendered in background color
  6. Settings are persisted to localStorage

#### US-020: Customize High Contrast Colors

- ID: US-020
- Title: Customize High Contrast Colors
- Description: As a player with specific visual needs, I want to customize my foreground and background colors so that I can optimize visibility for my condition.
- Acceptance Criteria:
  1. Color pickers are visible only when high contrast mode is enabled
  2. Foreground color picker accepts any valid hex color
  3. Background color picker accepts any valid hex color
  4. Preview of selected colors is shown before saving
  5. Save button persists color choices to localStorage
  6. Colors are applied immediately in game

#### US-021: Save Settings

- ID: US-021
- Title: Save Settings
- Description: As a player, I want my settings to be saved so that I do not have to reconfigure them each time I play.
- Acceptance Criteria:
  1. Settings screen has a Save button
  2. Clicking Save persists all current settings to localStorage
  3. Confirmation message displays after successful save
  4. Settings are loaded automatically on application start
  5. Back button allows exiting settings without saving changes

### 5.7 Navigation

#### US-022: Return to Main Menu

- ID: US-022
- Title: Return to Main Menu
- Description: As a player, I want to return to the main menu from various screens so that I can access different features.
- Acceptance Criteria:
  1. Game over screen has Return to Menu button
  2. Leaderboard screen has Back button returning to previous screen
  3. Settings screen has Back button returning to previous screen
  4. Replay playback has Cancel button returning to menu
  5. Navigation buttons are clearly labeled and accessible

#### US-023: Play Again After Game Over

- ID: US-023
- Title: Play Again After Game Over
- Description: As a player, I want to quickly start a new game after game over so that I can continue playing without navigating menus.
- Acceptance Criteria:
  1. Game over screen displays Play Again button
  2. Clicking Play Again starts a new game immediately
  3. Nickname from previous game is retained
  4. Score and snake reset to initial values
  5. New game recording begins (overwrites previous)

### 5.8 Audio-Visual Feedback

#### US-024: Hear Sound When Eating Food

- ID: US-024
- Title: Hear Sound When Eating Food
- Description: As a player, I want to hear a sound when my snake eats food so that I receive audio feedback for successful actions.
- Acceptance Criteria:
  1. Short beep sound plays when food is consumed
  2. Sound is 8-bit style (square/triangle wave)
  3. Sound does not play when muted
  4. Sound plays immediately on food consumption

#### US-025: Hear Sound on Game Over

- ID: US-025
- Title: Hear Sound on Game Over
- Description: As a player, I want to hear a distinct sound when the game ends so that I am clearly notified of my death.
- Acceptance Criteria:
  1. Descending tone plays on game over
  2. Sound is distinct from food consumption sound
  3. Sound is 8-bit style
  4. Sound does not play when muted
  5. Sound plays immediately on collision detection

#### US-026: See Screen Shake on Death

- ID: US-026
- Title: See Screen Shake on Death
- Description: As a player, I want to see a screen shake effect when I die so that the game over moment feels impactful.
- Acceptance Criteria:
  1. Screen shake activates on game over
  2. Duration is 100-200ms
  3. Shake is subtle but noticeable
  4. Shake applies to game canvas only, not entire page
  5. Game over screen appears after shake completes

#### US-027: See Particle Effects When Eating

- ID: US-027
- Title: See Particle Effects When Eating
- Description: As a player, I want to see particle effects when eating food so that the action feels rewarding.
- Acceptance Criteria:
  1. Particle burst originates from food location on consumption
  2. Particles use Game Boy palette colors
  3. Particles dissipate within 500ms
  4. Effect does not interfere with gameplay visibility
  5. Particle system does not cause performance issues

#### US-028: See Pulsing Food Animation

- ID: US-028
- Title: See Pulsing Food Animation
- Description: As a player, I want to see the food pulsing so that it is visually distinct and easy to locate.
- Acceptance Criteria:
  1. Food displays a pulsing glow animation
  2. Animation oscillates between #8bac0f and #9bbc0f
  3. Pulse cycle is smooth and continuous
  4. Animation is visible but not distracting
  5. Animation runs throughout food lifetime

### 5.9 Edge Cases

#### US-029: Handle Very Long Snake

- ID: US-029
- Title: Handle Very Long Snake
- Description: As a player, I want the game to function correctly even when my snake is very long so that I can continue playing at high scores.
- Acceptance Criteria:
  1. Game remains playable when snake occupies majority of board
  2. Food spawning algorithm handles limited empty cells correctly
  3. Performance remains stable at 60 FPS with maximum snake length
  4. Game ends gracefully if no empty cells remain for food

#### US-030: Handle Network Failure on Score Submission

- ID: US-030
- Title: Handle Network Failure on Score Submission
- Description: As a player, I want to be notified if my score fails to submit so that I know my entry was not saved.
- Acceptance Criteria:
  1. Error message displays if network request fails
  2. Player can retry submission
  3. Other game functions remain accessible during network failure
  4. Score submission timeout occurs after reasonable period (5-10 seconds)

#### US-031: Handle Empty Leaderboard

- ID: US-031
- Title: Handle Empty Leaderboard
- Description: As a player, I want to see a meaningful message when the leaderboard is empty so that I understand there are no scores yet.
- Acceptance Criteria:
  1. Empty leaderboard displays message: "No scores yet. Be the first!"
  2. Table headers are still visible
  3. Back navigation remains functional

#### US-032: Handle Invalid Replay Data

- ID: US-032
- Title: Handle Invalid Replay Data
- Description: As a player, I want to be notified if replay data is corrupted so that I do not experience crashes or confusion.
- Acceptance Criteria:
  1. Application validates replay data before playback
  2. Error message displays if data is invalid or corrupted
  3. Watch Replay button is disabled if no valid recording exists
  4. Corrupted data does not crash the application

---

## 6. Success Metrics

### 6.1 Performance Metrics

| Metric                | Target               | Measurement Method                                   |
| --------------------- | -------------------- | ---------------------------------------------------- |
| Frame rate stability  | 60 FPS consistent    | Browser developer tools performance monitor          |
| Input latency         | < 16ms response time | Timestamp delta between keypress and state change    |
| Replay accuracy       | 100% deterministic   | Same seed + move sequence produces identical outcome |
| Leaderboard load time | < 500ms              | API response time measurement                        |

### 6.2 Quality Metrics

| Metric                      | Target                                     | Measurement Method                     |
| --------------------------- | ------------------------------------------ | -------------------------------------- |
| Score validation accuracy   | 100% invalid scores rejected               | Server-side validation pass/fail rate  |
| Input buffer effectiveness  | 0% lost inputs during rapid play           | User testing and automated input tests |
| Cross-browser compatibility | Functions in Chrome, Firefox, Safari, Edge | Manual testing on each browser         |

### 6.3 User Experience Metrics

| Metric                   | Target                     | Measurement Method             |
| ------------------------ | -------------------------- | ------------------------------ |
| Game start time          | < 2 seconds from page load | Performance timing measurement |
| Audio latency            | < 50ms from trigger event  | Audio playback timing analysis |
| Visual effect smoothness | No perceptible stutter     | 60 FPS during all effects      |

### 6.4 Reliability Metrics

| Metric                   | Target                               | Measurement Method         |
| ------------------------ | ------------------------------------ | -------------------------- |
| localStorage persistence | 100% data retained across sessions   | Automated read/write tests |
| Server uptime            | 99% availability                     | Server monitoring          |
| Error handling coverage  | All user-facing errors have messages | Code review and testing    |

---

## Document Information

- Version: 1.0
- Created: December 2, 2025
- Based on: MVP Planning Session
- Status: Ready for Development
```

I have created a comprehensive Product Requirements Document (PRD) at `.ai/prd.md`. The document includes:

1. Product Overview - Complete description of the Snake game with Game Boy aesthetics, technology stack, and visual identity specifications

2. User Problem - Clear problem statement, target users, and user needs

3. Functional Requirements - Detailed specifications covering:

   - Core gameplay mechanics (grid, snake, speed progression, scoring)
   - Input system with buffering
   - Audio system using Web Audio API
   - Visual effects (screen shake, particles, animations)
   - All UI screens
   - Replay and leaderboard systems
   - Accessibility features

4. Product Boundaries - Clear delineation of what is in scope and out of scope for MVP, including assumptions and constraints

5. User Stories - 32 testable user stories (US-001 through US-032) organized by category:

   - Game initialization (nickname, start game)
   - Core gameplay (controls, input buffering, food collection, scoring, speed progression)
   - Game over conditions
   - Leaderboard functionality
   - Replay system
   - Settings and accessibility
   - Navigation
   - Audio-visual feedback
   - Edge cases (network failures, empty states, corrupted data)

6. Success Metrics - Measurable targets for performance, quality, user experience, and reliability

Each user story includes:

- Unique identifier (US-XXX)
- Title
- Description in user story format
- Clear, testable acceptance criteria

The PRD avoids bold formatting as requested and maintains consistent markdown structure throughout.

---

**User**

Tearz wybierzmy tech stack,

Proponuje next js jako BE i react + vite + tailwind jako FE.

CO porponujesz na DB i jako wysęitlanie animacji na FE

---

**Cursor**

Świetnie, że chcesz ustalić tech stack! Mam kilka uwag i propozycji:

## Moje rekomendacje

### Backend

Użycie Next.js jako czystego backendu jest trochę niestandardowe. Masz dwie opcje:

**Opcja A: Pełny stack Next.js (rekomendowana)**

- Next.js 14+ z App Router jako full-stack
- API Routes dla endpointów leaderboard
- React + Tailwind wbudowane
- Nie potrzebujesz osobnego Vite

**Opcja B: Rozdzielony stack (twoja propozycja)**

- Frontend: React + Vite + Tailwind
- Backend: Express.js lub Fastify (lżejsze niż Next.js dla samego API)

### Database

Dla prostego leaderboarda (top 10 wyników) rekomenduję:

| Opcja                | Zalety                                     | Wady                          |
| -------------------- | ------------------------------------------ | ----------------------------- |
| SQLite + Drizzle ORM | Zero konfiguracji, plik lokalny, type-safe | Nie skaluje się horyzontalnie |
| Turso (SQLite edge)  | SQLite w chmurze, darmowy tier, szybki     | Zewnętrzna zależność          |
| PostgreSQL + Prisma  | Produkcyjny standard, świetne ORM          | Wymaga serwera DB             |

Dla MVP: **SQLite + Drizzle ORM** - najprostsze, wystarczające dla leaderboarda.

### Animacje na Frontend

Gra Snake wymaga game loop z Canvas. Opcje:

| Biblioteka         | Opis                                 | Rekomendacja           |
| ------------------ | ------------------------------------ | ---------------------- |
| Vanilla Canvas API | Pełna kontrola, zero zależności      | ✅ Najlepsza dla nauki |
| PixiJS             | WebGL 2D renderer, świetna wydajność | ✅ Najlepsza wydajność |
| Konva.js           | Canvas z React bindings              | Dobra dla React devs   |
| Phaser             | Pełny game framework                 | Overkill dla Snake     |

**Moja rekomendacja: PixiJS** lub **Vanilla Canvas API**

- PixiJS da ci łatwiejsze particle effects, sprite batching, i automatyczną optymalizację WebGL
- Vanilla Canvas jest prostszy i zgodny z oryginalnym MVP

### Proponowany Tech Stack

```
Frontend:
├── React 18 + Vite + TypeScript
├── Tailwind CSS (UI screens)
├── PixiJS 8 (game rendering + animations)
└── Web Audio API (dźwięki 8-bit)

Backend:
├── Express.js / Fastify (REST API)
├── SQLite + Drizzle ORM
└── Zod (walidacja score)
```

Lub uproszczony full-stack:

```
Full-stack:
├── Next.js 14 (App Router)
├── Tailwind CSS
├── PixiJS 8 (game canvas)
├── SQLite + Drizzle ORM
└── Web Audio API
```

---

Co preferujesz? Mogę zaktualizować PRD z wybranym stackiem i przygotować strukturę projektu.

```plaintext
Frontend:
├── React 18 + Vite + TypeScript
├── Tailwind CSS (UI screens)
├── PixiJS 8 (game rendering + animations)
└── Web Audio API (dźwięki 8-bit)

Backend:
├── Express.js / Fastify (REST API)
├── SQLite + Drizzle ORM
└── Zod (walidacja score)
```

```plaintext
Full-stack:
├── Next.js 14 (App Router)
├── Tailwind CSS
├── PixiJS 8 (game canvas)
├── SQLite + Drizzle ORM
└── Web Audio API
```

---

**User**

niech będzie opcja pierwsza

---

**Cursor**

```markdown
# Product Requirements Document (PRD) - Snake Game

## 1. Product Overview

### 1.1 Product Description

A classic Snake game reimagined with a nostalgic Game Boy aesthetic. Players control a snake on a 20×20 grid, collecting food to grow longer and accumulate points. The game features progressive difficulty through increasing speed, a global leaderboard system, and a replay feature for reviewing gameplay.

### 1.2 Target Platform

Desktop web browsers with keyboard input support. Mobile devices and touch controls are explicitly excluded from this version.

### 1.3 Technology Stack

Full-stack Next.js application with the following technologies:

Frontend:

- Next.js 14+ (App Router) - React framework with server components
- React 18 - UI components and state management
- TypeScript - Type safety
- Tailwind CSS - Styling for UI screens
- PixiJS 8 - WebGL 2D renderer for game canvas and animations
- Web Audio API - Programmatic 8-bit sound synthesis

Backend:

- Next.js API Routes - REST API endpoints
- Zod - Request/response validation

Database:

- SQLite - Lightweight file-based database
- Drizzle ORM - Type-safe database queries

Development:

- ESLint + Prettier - Code quality
- pnpm - Package manager

### 1.4 Visual Identity

The game employs a 4-color Game Boy Green palette:

| Color Code | Usage                         |
| ---------- | ----------------------------- |
| #0f380f    | Snake head, UI text (darkest) |
| #306230    | Snake body (dark)             |
| #8bac0f    | Grid lines, food glow (light) |
| #9bbc0f    | Background (lightest)         |

---

## 2. User Problem

### 2.1 Problem Statement

Players seeking a nostalgic, quick-play gaming experience lack access to a well-designed, browser-based Snake game that combines classic gameplay with modern quality-of-life features such as responsive controls, visual polish, and competitive leaderboards.

### 2.2 Target Users

- Casual gamers looking for quick entertainment sessions
- Retro gaming enthusiasts who appreciate Game Boy aesthetics
- Competitive players who enjoy leaderboard-based challenges
- Users with visual impairments requiring high contrast display options

### 2.3 User Needs

1. Responsive, reliable controls that do not lose inputs during fast gameplay
2. Clear visual feedback for game events (eating, collision, game over)
3. Ability to track and compare scores with other players
4. Option to review gameplay to understand mistakes
5. Customizable visual settings for accessibility

---

## 3. Functional Requirements

### 3.1 Core Gameplay Mechanics

#### 3.1.1 Game Board

- Grid size: 20×20 cells
- Visual style: Game Boy Green palette
- Subtle grid lines for cell visibility

#### 3.1.2 Snake Mechanics

- Starting length: 3 segments
- Growth: +1 segment per food consumed
- Movement: Automatic in current direction
- Cannot reverse direction 180 degrees (e.g., cannot go from UP to DOWN directly)

#### 3.1.3 Speed Progression

- Base speed: 100ms per move
- Speed decrease: 5ms for every 50 points scored
- Minimum speed: 50ms (maximum 20 moves per second)
- Formula: `currentSpeed = max(50, 100 - floor(score / 50) * 5)`

| Score Range | Speed (ms) | Moves/Second |
| ----------- | ---------- | ------------ |
| 0-49        | 100        | 10           |
| 50-99       | 95         | ~10.5        |
| 100-149     | 90         | ~11.1        |
| 150-199     | 85         | ~11.8        |
| 200-249     | 80         | 12.5         |
| 500+        | 50         | 20           |

#### 3.1.4 Scoring System

- Points per food: +10
- Score validation formula: `snakeLength === 3 + (score / 10)`
- Maximum accepted score: 10,000 points

#### 3.1.5 Food Spawning Algorithm

1. Identify all empty cells (not occupied by snake)
2. Calculate Manhattan distance from snake head to each empty cell
3. Select the cell with maximum distance
4. If multiple cells tie for maximum distance, select randomly using seeded RNG

- Manhattan distance formula: `distance = |head.x - cell.x| + |head.y - cell.y|`

#### 3.1.6 Collision Detection

- Wall collision: Snake head exits grid boundaries
- Self collision: Snake head occupies same cell as any body segment
- Both collision types trigger game over state

### 3.2 Input System

#### 3.2.1 Supported Controls

- Arrow keys: UP, DOWN, LEFT, RIGHT
- WASD keys: W (up), A (left), S (down), D (right)

#### 3.2.2 Input Buffer

- 2-frame input buffer system
- Second input is queued, not ignored
- Queued inputs processed sequentially
- Prevents input loss during rapid direction changes

### 3.3 Audio System

#### 3.3.1 Technology

- Web Audio API with programmatic synthesis
- 8-bit style waveforms (square wave, triangle wave)

#### 3.3.2 Sound Effects

| Event          | Sound Description                   |
| -------------- | ----------------------------------- |
| Food consumed  | Short high-pitched beep             |
| Game over      | Descending sad tone                 |
| Snake movement | Optional subtle tick (configurable) |

#### 3.3.3 Audio Settings

- Mute toggle button
- Setting persisted to localStorage
- Default state: sound enabled

### 3.4 Visual Effects

#### 3.4.1 Screen Shake

- Trigger: Game over (death)
- Duration: 100-200ms
- Intensity: Subtle displacement

#### 3.4.2 Particle Effects

- Trigger: Food consumption
- Style: Burst of particles from food location

#### 3.4.3 Food Animation

- Pulsing glow effect
- Color oscillation between #8bac0f and #9bbc0f

#### 3.4.4 Snake Visual Distinction

- Head: Distinct color/texture (#0f380f)
- Body: Secondary color (#306230)

### 3.5 User Interface Screens

#### 3.5.1 Start Screen

- Game title display
- Nickname input field
- Start Game button
- Leaderboard button
- Settings button

#### 3.5.2 Game Screen

- Current score display
- Current snake length display
- Sound mute toggle
- Game board (20×20 grid)

#### 3.5.3 Game Over Screen

- Final score display
- Final snake length display
- Nickname input field (pre-filled if previously entered)
- Save Score button
- Play Again button
- Watch Replay button
- View Leaderboard button
- Return to Menu button

#### 3.5.4 Settings Screen

- Sound toggle (ON/OFF)
- High contrast mode toggle
- Foreground color picker (when high contrast enabled)
- Background color picker (when high contrast enabled)
- Save button
- Back button

#### 3.5.5 Leaderboard Screen

- Top 10 scores display
- Columns: Rank, Nickname, Score, Snake Length, Date
- Back button

### 3.6 Replay System

#### 3.6.1 Recording

- Data captured: RNG seed, move sequence, final score, final length, timestamp
- Storage: localStorage (client-side only)
- Retention: Most recent game only (overwrites previous)

#### 3.6.2 Playback

- Deterministic recreation using seed and move sequence
- Playback speed matches original game speed
- Cancel button to return to menu

### 3.7 Leaderboard System

#### 3.7.1 Display

- Shows top 10 scores
- Fields: Nickname, Score, Snake Length, Timestamp

#### 3.7.2 API Endpoints

- GET /api/leaderboard - Retrieve top 10 scores
- POST /api/leaderboard - Submit new score

#### 3.7.3 Server-Side Validation

- score >= 0
- score % 10 === 0 (must be multiple of 10)
- snakeLength === 3 + (score / 10)
- score <= 10000

### 3.8 Accessibility Features

#### 3.8.1 High Contrast Mode

- User-selectable foreground color
- User-selectable background color
- Settings persisted to localStorage

### 3.9 Data Persistence

#### 3.9.1 localStorage (Client)

- Sound mute preference
- High contrast mode enabled flag
- Custom foreground color
- Custom background color
- Last game replay data

#### 3.9.2 Database (Server)

- Table: leaderboard
  - id: INT (Primary Key)
  - nick: VARCHAR(100)
  - score: INT
  - snake_length: INT
  - created_at: TIMESTAMP

---

## 4. Product Boundaries

### 4.1 In Scope

- Desktop web browser gameplay with keyboard controls
- Single-player mode only
- Global leaderboard with top 10 scores
- Local replay of most recent game
- High contrast accessibility mode
- 8-bit sound effects via Web Audio API
- Game Boy Green visual theme

### 4.2 Out of Scope

| Feature                      | Status   | Rationale                             |
| ---------------------------- | -------- | ------------------------------------- |
| Mobile/touch support         | Excluded | Complexity, keyboard-focused gameplay |
| Pause functionality          | Excluded | Scope reduction for MVP               |
| Background music             | Excluded | SFX-only approach                     |
| Offline mode                 | Excluded | Assumes network connectivity          |
| Ghost overlay during play    | Excluded | Complexity                            |
| Replay sharing/links         | Excluded | Requires additional infrastructure    |
| Key rebinding                | Deferred | Post-MVP enhancement                  |
| Screen reader support        | Deferred | Post-MVP accessibility enhancement    |
| Reduced motion mode          | Deferred | Post-MVP accessibility enhancement    |
| Difficulty levels            | Excluded | Replaced by progressive speed system  |
| Multiple concurrent replays  | Excluded | Only stores last game                 |
| User accounts/authentication | Excluded | Nickname-only identification          |

### 4.3 Assumptions

- Users have modern desktop web browsers (Chrome, Firefox, Safari, Edge)
- Users have stable network connectivity for leaderboard features
- Users have functional keyboard input devices
- JavaScript is enabled in user browsers

### 4.4 Constraints

- Nickname maximum length: 100 characters
- Maximum acceptable score: 10,000 points
- Leaderboard displays only top 10 entries
- Single replay storage (most recent game only)

---

## 5. User Stories

### 5.1 Game Initialization

#### US-001: Enter Nickname Before Playing

- ID: US-001
- Title: Enter Nickname Before Playing
- Description: As a player, I want to enter my nickname before starting the game so that my score can be identified on the leaderboard.
- Acceptance Criteria:
  1. Start screen displays a text input field for nickname
  2. Nickname field accepts up to 100 characters
  3. Nickname is preserved when navigating between screens within session
  4. Empty nickname is allowed (score submitted as anonymous or empty string)
  5. Nickname input field is focused by default on start screen

#### US-002: Start New Game

- ID: US-002
- Title: Start New Game
- Description: As a player, I want to click a Start button to begin a new game so that I can play Snake.
- Acceptance Criteria:
  1. Start screen displays a clearly visible Start Game button
  2. Clicking Start Game transitions to the game screen
  3. Game begins with snake at starting position (3 segments)
  4. Score is reset to 0
  5. Snake begins moving automatically in a default direction
  6. Food spawns on the board using the Manhattan distance algorithm

### 5.2 Core Gameplay

#### US-003: Control Snake with Arrow Keys

- ID: US-003
- Title: Control Snake with Arrow Keys
- Description: As a player, I want to control the snake direction using arrow keys so that I can navigate the game board.
- Acceptance Criteria:
  1. Pressing UP arrow changes snake direction to up (if not currently moving down)
  2. Pressing DOWN arrow changes snake direction to down (if not currently moving up)
  3. Pressing LEFT arrow changes snake direction to left (if not currently moving right)
  4. Pressing RIGHT arrow changes snake direction to right (if not currently moving left)
  5. Direction change takes effect on the next movement tick

#### US-004: Control Snake with WASD Keys

- ID: US-004
- Title: Control Snake with WASD Keys
- Description: As a player, I want to control the snake direction using WASD keys so that I have an alternative control scheme.
- Acceptance Criteria:
  1. Pressing W changes snake direction to up (if not currently moving down)
  2. Pressing S changes snake direction to down (if not currently moving up)
  3. Pressing A changes snake direction to left (if not currently moving right)
  4. Pressing D changes snake direction to right (if not currently moving left)
  5. WASD and arrow keys function identically and interchangeably

#### US-005: Input Buffering for Rapid Direction Changes

- ID: US-005
- Title: Input Buffering for Rapid Direction Changes
- Description: As a player, I want my rapid direction inputs to be buffered so that quick successive key presses are not lost.
- Acceptance Criteria:
  1. When a second direction input is received before the first is processed, it is queued
  2. Queued input is processed on the subsequent movement tick
  3. Buffer holds maximum of one pending input (2-frame buffer)
  4. Buffered input respects 180-degree reversal restriction
  5. Invalid buffered inputs are discarded

#### US-006: Prevent 180-Degree Reversal

- ID: US-006
- Title: Prevent 180-Degree Reversal
- Description: As a player, I want the game to prevent me from reversing direction 180 degrees so that I cannot accidentally kill myself by moving into my own body.
- Acceptance Criteria:
  1. When moving UP, pressing DOWN is ignored
  2. When moving DOWN, pressing UP is ignored
  3. When moving LEFT, pressing RIGHT is ignored
  4. When moving RIGHT, pressing LEFT is ignored
  5. Ignored inputs do not enter the input buffer

#### US-007: Collect Food and Grow

- ID: US-007
- Title: Collect Food and Grow
- Description: As a player, I want my snake to grow when it eats food so that I can see my progress in the game.
- Acceptance Criteria:
  1. When snake head occupies the same cell as food, food is consumed
  2. Snake length increases by 1 segment after consuming food
  3. New segment is added at the tail end of the snake
  4. Food consumption sound effect plays (if sound enabled)
  5. Particle effect displays at food location

#### US-008: Score Points for Eating Food

- ID: US-008
- Title: Score Points for Eating Food
- Description: As a player, I want to earn 10 points each time my snake eats food so that I can track my performance.
- Acceptance Criteria:
  1. Score increases by exactly 10 points when food is consumed
  2. Score display updates immediately after food consumption
  3. Score is displayed on the game screen at all times during gameplay

#### US-009: Experience Progressive Speed Increase

- ID: US-009
- Title: Experience Progressive Speed Increase
- Description: As a player, I want the game to speed up as my score increases so that I face an increasing challenge.
- Acceptance Criteria:
  1. Game starts at 100ms per move (10 moves per second)
  2. Speed decreases by 5ms for every 50 points earned
  3. Speed never goes below 50ms (maximum 20 moves per second)
  4. Speed change takes effect immediately upon reaching score threshold
  5. Speed formula is: max(50, 100 - floor(score / 50) \* 5)

#### US-010: Food Spawns at Maximum Distance

- ID: US-010
- Title: Food Spawns at Maximum Distance
- Description: As a player, I want food to spawn at the farthest point from my snake head so that I must traverse the board to collect it.
- Acceptance Criteria:
  1. After food is consumed, new food spawns within one game tick
  2. New food position is the empty cell with maximum Manhattan distance from snake head
  3. If multiple cells tie for maximum distance, one is selected randomly
  4. Food never spawns on a cell occupied by the snake
  5. Random selection uses seeded RNG for replay determinism

### 5.3 Game Over Conditions

#### US-011: Game Over on Wall Collision

- ID: US-011
- Title: Game Over on Wall Collision
- Description: As a player, I want the game to end when my snake hits a wall so that there are boundaries to the play area.
- Acceptance Criteria:
  1. Game ends immediately when snake head moves outside the 20×20 grid
  2. Screen shake effect plays on collision
  3. Game over sound effect plays (if sound enabled)
  4. Transition to game over screen occurs after effects complete

#### US-012: Game Over on Self Collision

- ID: US-012
- Title: Game Over on Self Collision
- Description: As a player, I want the game to end when my snake collides with its own body so that self-avoidance is part of the challenge.
- Acceptance Criteria:
  1. Game ends immediately when snake head occupies the same cell as any body segment
  2. Screen shake effect plays on collision
  3. Game over sound effect plays (if sound enabled)
  4. Transition to game over screen occurs after effects complete

#### US-013: View Final Score on Game Over

- ID: US-013
- Title: View Final Score on Game Over
- Description: As a player, I want to see my final score and snake length after the game ends so that I know how well I performed.
- Acceptance Criteria:
  1. Game over screen displays final score
  2. Game over screen displays final snake length
  3. Information is displayed prominently and clearly
  4. Screen remains visible until player takes an action

### 5.4 Leaderboard

#### US-014: Submit Score to Leaderboard

- ID: US-014
- Title: Submit Score to Leaderboard
- Description: As a player, I want to submit my score to the leaderboard so that I can compete with other players.
- Acceptance Criteria:
  1. Game over screen displays Save Score button
  2. Clicking Save Score sends nickname, score, and snake length to server
  3. Server validates score using formula: snakeLength === 3 + (score / 10)
  4. Server validates score is non-negative, multiple of 10, and <= 10000
  5. Success message displays after successful submission
  6. Error message displays if validation fails or network error occurs
  7. Save Score button is disabled after successful submission to prevent duplicates

#### US-015: View Leaderboard

- ID: US-015
- Title: View Leaderboard
- Description: As a player, I want to view the top 10 scores so that I can see how I rank against other players.
- Acceptance Criteria:
  1. Leaderboard is accessible from start screen and game over screen
  2. Displays top 10 scores sorted by score descending
  3. Each entry shows: rank, nickname, score, snake length, date
  4. Leaderboard loads within 500ms under normal network conditions
  5. Loading indicator displays while fetching data
  6. Error message displays if leaderboard fails to load

### 5.5 Replay System

#### US-016: Automatic Game Recording

- ID: US-016
- Title: Automatic Game Recording
- Description: As a player, I want my game to be automatically recorded so that I can watch it later.
- Acceptance Criteria:
  1. Every game session is recorded automatically
  2. Recording captures: RNG seed, all move inputs, final score, final length, timestamp
  3. Recording is stored in localStorage
  4. New recording overwrites previous recording
  5. Recording begins when game starts and ends on game over

#### US-017: Watch Replay of Last Game

- ID: US-017
- Title: Watch Replay of Last Game
- Description: As a player, I want to watch a replay of my last game so that I can see what went wrong or review my gameplay.
- Acceptance Criteria:
  1. Game over screen displays Watch Replay button
  2. Clicking Watch Replay starts playback of the recorded game
  3. Playback uses same speed progression as original game
  4. Snake movement, food spawns, and score are identical to original
  5. Cancel button is available to stop playback and return to menu
  6. Watch Replay button is disabled if no recording exists

### 5.6 Settings and Accessibility

#### US-018: Toggle Sound On/Off

- ID: US-018
- Title: Toggle Sound On/Off
- Description: As a player, I want to toggle sound effects on or off so that I can play without disturbing others.
- Acceptance Criteria:
  1. Sound toggle is accessible from settings screen
  2. Sound toggle is accessible from game screen (mute button)
  3. When muted, no sound effects play
  4. Setting is persisted to localStorage
  5. Setting is loaded on application start
  6. Default state is sound enabled

#### US-019: Enable High Contrast Mode

- ID: US-019
- Title: Enable High Contrast Mode
- Description: As a player with visual impairments, I want to enable a high contrast mode so that I can see the game elements more clearly.
- Acceptance Criteria:
  1. Settings screen displays high contrast mode toggle
  2. When enabled, color picker inputs appear for foreground and background
  3. Game renders using user-selected colors instead of Game Boy palette
  4. Snake, food, and grid are rendered in foreground color
  5. Background is rendered in background color
  6. Settings are persisted to localStorage

#### US-020: Customize High Contrast Colors

- ID: US-020
- Title: Customize High Contrast Colors
- Description: As a player with specific visual needs, I want to customize my foreground and background colors so that I can optimize visibility for my condition.
- Acceptance Criteria:
  1. Color pickers are visible only when high contrast mode is enabled
  2. Foreground color picker accepts any valid hex color
  3. Background color picker accepts any valid hex color
  4. Preview of selected colors is shown before saving
  5. Save button persists color choices to localStorage
  6. Colors are applied immediately in game

#### US-021: Save Settings

- ID: US-021
- Title: Save Settings
- Description: As a player, I want my settings to be saved so that I do not have to reconfigure them each time I play.
- Acceptance Criteria:
  1. Settings screen has a Save button
  2. Clicking Save persists all current settings to localStorage
  3. Confirmation message displays after successful save
  4. Settings are loaded automatically on application start
  5. Back button allows exiting settings without saving changes

### 5.7 Navigation

#### US-022: Return to Main Menu

- ID: US-022
- Title: Return to Main Menu
- Description: As a player, I want to return to the main menu from various screens so that I can access different features.
- Acceptance Criteria:
  1. Game over screen has Return to Menu button
  2. Leaderboard screen has Back button returning to previous screen
  3. Settings screen has Back button returning to previous screen
  4. Replay playback has Cancel button returning to menu
  5. Navigation buttons are clearly labeled and accessible

#### US-023: Play Again After Game Over

- ID: US-023
- Title: Play Again After Game Over
- Description: As a player, I want to quickly start a new game after game over so that I can continue playing without navigating menus.
- Acceptance Criteria:
  1. Game over screen displays Play Again button
  2. Clicking Play Again starts a new game immediately
  3. Nickname from previous game is retained
  4. Score and snake reset to initial values
  5. New game recording begins (overwrites previous)

### 5.8 Audio-Visual Feedback

#### US-024: Hear Sound When Eating Food

- ID: US-024
- Title: Hear Sound When Eating Food
- Description: As a player, I want to hear a sound when my snake eats food so that I receive audio feedback for successful actions.
- Acceptance Criteria:
  1. Short beep sound plays when food is consumed
  2. Sound is 8-bit style (square/triangle wave)
  3. Sound does not play when muted
  4. Sound plays immediately on food consumption

#### US-025: Hear Sound on Game Over

- ID: US-025
- Title: Hear Sound on Game Over
- Description: As a player, I want to hear a distinct sound when the game ends so that I am clearly notified of my death.
- Acceptance Criteria:
  1. Descending tone plays on game over
  2. Sound is distinct from food consumption sound
  3. Sound is 8-bit style
  4. Sound does not play when muted
  5. Sound plays immediately on collision detection

#### US-026: See Screen Shake on Death

- ID: US-026
- Title: See Screen Shake on Death
- Description: As a player, I want to see a screen shake effect when I die so that the game over moment feels impactful.
- Acceptance Criteria:
  1. Screen shake activates on game over
  2. Duration is 100-200ms
  3. Shake is subtle but noticeable
  4. Shake applies to game canvas only, not entire page
  5. Game over screen appears after shake completes

#### US-027: See Particle Effects When Eating

- ID: US-027
- Title: See Particle Effects When Eating
- Description: As a player, I want to see particle effects when eating food so that the action feels rewarding.
- Acceptance Criteria:
  1. Particle burst originates from food location on consumption
  2. Particles use Game Boy palette colors
  3. Particles dissipate within 500ms
  4. Effect does not interfere with gameplay visibility
  5. Particle system does not cause performance issues

#### US-028: See Pulsing Food Animation

- ID: US-028
- Title: See Pulsing Food Animation
- Description: As a player, I want to see the food pulsing so that it is visually distinct and easy to locate.
- Acceptance Criteria:
  1. Food displays a pulsing glow animation
  2. Animation oscillates between #8bac0f and #9bbc0f
  3. Pulse cycle is smooth and continuous
  4. Animation is visible but not distracting
  5. Animation runs throughout food lifetime

### 5.9 Edge Cases

#### US-029: Handle Very Long Snake

- ID: US-029
- Title: Handle Very Long Snake
- Description: As a player, I want the game to function correctly even when my snake is very long so that I can continue playing at high scores.
- Acceptance Criteria:
  1. Game remains playable when snake occupies majority of board
  2. Food spawning algorithm handles limited empty cells correctly
  3. Performance remains stable at 60 FPS with maximum snake length
  4. Game ends gracefully if no empty cells remain for food

#### US-030: Handle Network Failure on Score Submission

- ID: US-030
- Title: Handle Network Failure on Score Submission
- Description: As a player, I want to be notified if my score fails to submit so that I know my entry was not saved.
- Acceptance Criteria:
  1. Error message displays if network request fails
  2. Player can retry submission
  3. Other game functions remain accessible during network failure
  4. Score submission timeout occurs after reasonable period (5-10 seconds)

#### US-031: Handle Empty Leaderboard

- ID: US-031
- Title: Handle Empty Leaderboard
- Description: As a player, I want to see a meaningful message when the leaderboard is empty so that I understand there are no scores yet.
- Acceptance Criteria:
  1. Empty leaderboard displays message: "No scores yet. Be the first!"
  2. Table headers are still visible
  3. Back navigation remains functional

#### US-032: Handle Invalid Replay Data

- ID: US-032
- Title: Handle Invalid Replay Data
- Description: As a player, I want to be notified if replay data is corrupted so that I do not experience crashes or confusion.
- Acceptance Criteria:
  1. Application validates replay data before playback
  2. Error message displays if data is invalid or corrupted
  3. Watch Replay button is disabled if no valid recording exists
  4. Corrupted data does not crash the application

---

## 6. Success Metrics

### 6.1 Performance Metrics

| Metric                | Target               | Measurement Method                                   |
| --------------------- | -------------------- | ---------------------------------------------------- |
| Frame rate stability  | 60 FPS consistent    | Browser developer tools performance monitor          |
| Input latency         | < 16ms response time | Timestamp delta between keypress and state change    |
| Replay accuracy       | 100% deterministic   | Same seed + move sequence produces identical outcome |
| Leaderboard load time | < 500ms              | API response time measurement                        |

### 6.2 Quality Metrics

| Metric                      | Target                                     | Measurement Method                     |
| --------------------------- | ------------------------------------------ | -------------------------------------- |
| Score validation accuracy   | 100% invalid scores rejected               | Server-side validation pass/fail rate  |
| Input buffer effectiveness  | 0% lost inputs during rapid play           | User testing and automated input tests |
| Cross-browser compatibility | Functions in Chrome, Firefox, Safari, Edge | Manual testing on each browser         |

### 6.3 User Experience Metrics

| Metric                   | Target                     | Measurement Method             |
| ------------------------ | -------------------------- | ------------------------------ |
| Game start time          | < 2 seconds from page load | Performance timing measurement |
| Audio latency            | < 50ms from trigger event  | Audio playback timing analysis |
| Visual effect smoothness | No perceptible stutter     | 60 FPS during all effects      |

### 6.4 Reliability Metrics

| Metric                   | Target                               | Measurement Method         |
| ------------------------ | ------------------------------------ | -------------------------- |
| localStorage persistence | 100% data retained across sessions   | Automated read/write tests |
| Server uptime            | 99% availability                     | Server monitoring          |
| Error handling coverage  | All user-facing errors have messages | Code review and testing    |

---

## Document Information

- Version: 1.0
- Created: December 2, 2025
- Based on: MVP Planning Session
- Status: Ready for Development
```

Zaktualizowałem PRD z wybranym tech stackiem:

```15:35:.ai/prd.md
Full-stack Next.js application with the following technologies:

Frontend:
- Next.js 14+ (App Router) - React framework with server components
- React 18 - UI components and state management
- TypeScript - Type safety
- Tailwind CSS - Styling for UI screens
- PixiJS 8 - WebGL 2D renderer for game canvas and animations
- Web Audio API - Programmatic 8-bit sound synthesis

Backend:
- Next.js API Routes - REST API endpoints
- Zod - Request/response validation

Database:
- SQLite - Lightweight file-based database
- Drizzle ORM - Type-safe database queries

Development:
- ESLint + Prettier - Code quality
- pnpm - Package manager
```

Co dalej? Mogę:

1. Stworzyć strukturę projektu i zainicjalizować Next.js
2. Przygotować schemat bazy danych (Drizzle)
3. Zacząć implementację od konkretnej funkcjonalności

Co preferujesz?

```plaintext
Full-stack Next.js application with the following technologies:

Frontend:
- Next.js 14+ (App Router) - React framework with server components
- React 18 - UI components and state management
- TypeScript - Type safety
- Tailwind CSS - Styling for UI screens
- PixiJS 8 - WebGL 2D renderer for game canvas and animations
- Web Audio API - Programmatic 8-bit sound synthesis

Backend:
- Next.js API Routes - REST API endpoints
- Zod - Request/response validation

Database:
- SQLite - Lightweight file-based database
- Drizzle ORM - Type-safe database queries

Development:
- ESLint + Prettier - Code quality
- pnpm - Package manager
```

---

**User**

zapisz w pliku tech stack

---

**Cursor**

```markdown
# Tech Stack - Snake Game

## Overview

Full-stack Next.js application with Game Boy aesthetic Snake game.

---

## Frontend

| Technology    | Version | Purpose                                               |
| ------------- | ------- | ----------------------------------------------------- |
| Next.js       | 14+     | React framework with App Router and server components |
| React         | 18      | UI components and state management                    |
| TypeScript    | 5+      | Type safety and developer experience                  |
| Tailwind CSS  | 3+      | Utility-first styling for UI screens                  |
| PixiJS        | 8       | WebGL 2D renderer for game canvas and animations      |
| Web Audio API | native  | Programmatic 8-bit sound synthesis                    |

---

## Backend

| Technology         | Version | Purpose                                        |
| ------------------ | ------- | ---------------------------------------------- |
| Next.js API Routes | 14+     | REST API endpoints (/api/leaderboard)          |
| Zod                | 3+      | Request/response validation and type inference |

---

## Database

| Technology  | Version | Purpose                                   |
| ----------- | ------- | ----------------------------------------- |
| SQLite      | 3       | Lightweight file-based database           |
| Drizzle ORM | latest  | Type-safe database queries and migrations |

---

## Development Tools

| Technology | Purpose                              |
| ---------- | ------------------------------------ |
| pnpm       | Fast, disk-efficient package manager |
| ESLint     | Code linting and quality             |
| Prettier   | Code formatting                      |
| TypeScript | Static type checking                 |

---

## Project Structure
```

snake-game/
├── .ai/ # AI documentation
│ ├── prd.md
│ └── tech-stack.md
├── src/
│ ├── app/ # Next.js App Router
│ │ ├── api/
│ │ │ └── leaderboard/
│ │ │ └── route.ts
│ │ ├── layout.tsx
│ │ ├── page.tsx
│ │ └── globals.css
│ ├── components/ # React components
│ │ ├── ui/ # Reusable UI components
│ │ ├── screens/ # Screen components
│ │ └── game/ # Game-specific components
│ ├── game/ # Game engine (PixiJS)
│ │ ├── engine.ts # Main game loop
│ │ ├── snake.ts # Snake logic
│ │ ├── food.ts # Food spawning
│ │ ├── input.ts # Input handling
│ │ ├── audio.ts # Sound effects
│ │ ├── effects.ts # Visual effects
│ │ └── replay.ts # Replay system
│ ├── lib/ # Utilities
│ │ ├── db/ # Database (Drizzle)
│ │ │ ├── schema.ts
│ │ │ └── index.ts
│ │ ├── validation.ts # Zod schemas
│ │ └── constants.ts # Game constants
│ ├── hooks/ # Custom React hooks
│ └── types/ # TypeScript types
├── drizzle/ # Drizzle migrations
├── public/ # Static assets
├── drizzle.config.ts
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md

````

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
````

---

## API Endpoints

| Method | Endpoint         | Description            |
| ------ | ---------------- | ---------------------- |
| GET    | /api/leaderboard | Retrieve top 10 scores |
| POST   | /api/leaderboard | Submit new score       |

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
| Chrome  | 90+             |
| Firefox | 90+             |
| Safari  | 14+             |
| Edge    | 90+             |

---

## Performance Targets

| Metric        | Target        |
| ------------- | ------------- |
| Frame rate    | 60 FPS stable |
| Input latency | < 16ms        |
| Initial load  | < 2 seconds   |
| API response  | < 500ms       |

```

Zapisałem tech stack w pliku `.ai/tech-stack.md`. Zawiera:

- Pełną listę technologii z wersjami
- Proponowaną strukturę projektu
- Kluczowe zależności (package.json)
- Schemat bazy danych (SQL)
- Endpointy API
- Zmienne środowiskowe
- Cele wydajnościowe

Chcesz żebym teraz zainicjalizował projekt Next.js z tą strukturą?

```
