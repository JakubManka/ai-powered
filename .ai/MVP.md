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
```

---

## ⚡ System Progresji Prędkości

Gra przyspiesza wraz ze zdobywanymi punktami:

```javascript
// Formuła prędkości
const baseSpeed = 100; // ms
const speedDecrease = Math.floor(score / 50) * 5;
const currentSpeed = Math.max(50, baseSpeed - speedDecrease);
```

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
