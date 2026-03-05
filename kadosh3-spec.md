# Kadosh 3 — "Kings In The Corners" Solitaire Spec (Client‑Only, No NPM)

This spec describes **Kadosh 3**, a jungle-themed solitaire/puzzle game inspired by the "Kings In The Corners" ruleset you pasted (cardgames.io style). It is **not** the multiplayer Kings Corner game.

**Live at**: https://shaikfir.github.io/kadosh3/  
**Repo**: https://github.com/shaikfir/kadosh3

---

## 0) Hard Constraints

- **Client-side only** (pure browser).
- **No npm / no Node toolchain**. Must run by opening `index.html` directly or using any basic static server.
- Vanilla **HTML/CSS/JS** (ES6).
- Any third-party assets must be **vendored** into the repo (`/assets`, `/vendor`) and loaded via `<link>` / `<script>`.
- **Deployable to GitHub Pages** (github.io) via a static GitHub Actions workflow.

---

## 1) Core Game Concept

### Objective (Win Condition)
- **Win as soon as all face cards (J, Q, K) are placed on the board** (i.e., all 12 face cards are on board slots).  
  - Number cards (A–10) do **not** need to be removed from the deck to win.
  - If the last required face card is placed, the game ends immediately with a Win screen.

### Lose Conditions
You lose if either happens:
1. You draw a face card (J/Q/K) and **all eligible slots for that face rank are occupied**.
2. The board is full (no empty slots) and **no removable combination summing to 10 exists**.

### Theme
- Jungle theme UI with dark green palette, gold accents, and decorative jungle elements.
- "Game finished" modal shows **a real photo of a monkey showing its red ass** (`/assets/monkey-red-ass.png`).
- A **fart sound effect** (`/assets/sfx/fart1.ogg`) plays when the game-over modal appears (if sounds are enabled).
- Game name shown as **Kadosh 3**.

---

## 2) Board Layout

### 2.1 Default board (fixed)
- Board is always **4×4 = 16 slots**.
- Slots have **markers** indicating face placement constraints (J/Q/K).  
  **Number cards (A–10) may be placed on *any* slot**, including marked ones.

### 2.2 Slot role mapping (row/col are 1-based)
- **Kings**: corners — markers display ♚
  - (1,1), (1,4), (4,1), (4,4)
- **Queens**: middle of top + bottom rows — markers display ♛
  - (1,2), (1,3), (4,2), (4,3)
- **Jacks**: middle of left + right columns — markers display **J** (italic)
  - (2,1), (3,1), (2,4), (3,4)
- **Unmarked**: center 4 squares (no marker shown)
  - (2,2), (2,3), (3,2), (3,3)

---

## 3) Cards & Stock

- Standard 52-card deck.
- Stock is face-down, but the **next card is always visible** (top card shown).
- There is **no waste pile**:
  - "Waste" in many solitaire games means a separate pile where drawn cards go temporarily.
  - **Kadosh 3 has none**: the drawn card must be placed directly onto the board.

---

## 4) Turn Loop / Phases

### 4.1 Game phases
- **PLACEMENT phase**: board not full, player must place the next stock card.
- **REMOVAL phase**: board full, player may remove combos summing to 10.
- The game alternates between these phases automatically.

### 4.2 Placement rules
When the board has ≥1 empty slot:
1. The UI shows the **next stock card** (face-up preview).
2. The player **must place** that card into **an empty board slot** by clicking a slot (primary), or drag-and-drop.
3. **After placement, the card is locked to that slot**:
   - It **cannot** be moved to another slot.
   - Only **Undo** can revert.

#### Face-card placement constraints
These constraints apply **only when placing a face card**:
- **K** may be placed **only** in corner slots.
- **Q** may be placed **only** in the 4 Queen slots (top/bottom middles).
- **J** may be placed **only** in the 4 Jack slots (left/right middles).

#### Royalty slot hover feedback
When the next card is a face card (J/Q/K), empty slots provide **visual hover feedback**:
- **Legal slots** glow green on hover (indicating the face card can be placed there).
- **Illegal slots** are dimmed to 50% opacity and show a red tint with a `not-allowed` cursor on hover.

#### Number-card placement constraints
- **A–10** can be placed into **any empty slot**, regardless of the slot marker.

#### Forced loss on blocked face card
- If the next stock card is a face card and all eligible slots for that rank are occupied → **immediate loss**.

### 4.3 Removal rules (only when the board is full)
When the board is full (16 cards):
- The player may remove cards from the board **only** by selecting:
  - **Two number cards** whose ranks sum to **10**, or
  - A single **10** by itself.

#### Rank values
- A=1, 2–10 as written.
- J/Q/K are **not removable**.

#### Selection mechanics
- Remove by:
  - Click first card then second card, or
  - Drag a card onto another card.
- Removals may be chained:
  - After any successful removal, if another valid removal exists, the player may continue removing.
- When **no removals exist**:
  - Switch back to **PLACEMENT phase** if there is still stock remaining (board will have empties).
  - If stock is empty and no removals exist → **loss** ("No more moves available").

---

## 5) Controls & UX

### 5.1 Primary interactions
- **Click empty slot** to place the next card (fast play).
- Optional: drag the next card preview onto an empty slot.
- In removal phase: click/drag between cards to remove.

### 5.2 "Auto-place" assist
- Clicking the **next-card preview** should:
  1. Determine all legal empty slots for that card.
  2. If **exactly one** legal slot exists: auto-place there.
  3. If multiple: highlight them and wait for slot click.
  4. If none (face blocked): trigger loss.

### 5.3 Hint button
A "Hint" button that behaves differently by phase:
- Placement phase: highlight all legal empty slots for the next card.
- Removal phase: highlight at least one removable combo (pair summing to 10 or a single 10).

### 5.4 Game finished modal
- On loss, show a modal:
  - Title: **GAME FINISHED**
  - The **blocking card** that caused the loss is rendered inside the modal (with a red border) so the player can see exactly which card ended the game.
  - Monkey red-ass photo (`/assets/monkey-red-ass.png`).
  - **Fart sound effect** (`/assets/sfx/fart1.ogg`) plays when the modal appears (if sounds are enabled in settings).
  - Message text: why you lost (blocked face card / no removals).
  - Buttons:
    - **New Game** (only).  
- No "Keep playing" option.

### 5.5 Keyboard shortcuts
- **Ctrl/Cmd+Z**: Undo
- **H**: Show hint (when not focused on an input field)

---

## 6) Undo (Current "Turn" Only)

Because this game doesn't have "turns" in the multiplayer sense, define **turn** as:
- The sequence from the moment a new card becomes the "next card" preview until it has been placed.

### Undo scope
- Allow undo of the **last placement only**, plus any removals made **after** that placement *only if the board was full*.
- Clear undo history when a new card placement occurs (so undo never crosses multiple placements).

### Implementation approach
- Maintain an in-memory `undoStack` for the current turn segment.
- Snapshot before each mutation during removal (optional stepwise undo within removal), but never allow undo beyond the most recent placement boundary.

---

## 7) "Game #" (Seeded Shuffles)

### Requirements
- Each game has an integer **Game ID** shown on screen (e.g., `Game #37908`).
- Given the same Game ID, the shuffle order must be reproducible.

### Implementation
- Uses **Mulberry32** deterministic PRNG seeded with the Game ID.
- Shuffle deck with **Fisher–Yates** using that PRNG.
- "New Game" picks a random Game ID (1..10,000,000).
- Header input field to **start a specific Game ID**.
- "Restart" restarts the same Game ID.

---

## 8) Visual Design & Assets (No NPM)

### 8.1 Card rendering
Cards are **CSS-rendered**: rank text + suit symbol (♥♦♣♠) with red/black coloring.
- Top-left: rank
- Center: large suit symbol
- Bottom-right: suit (rotated 180°)

### 8.2 Slot markers
Empty slots show translucent markers indicating which face cards can be placed:
- King slots (corners): ♚ with gold-tinted background
- Queen slots (top/bottom middles): ♛ with orange-tinted background
- Jack slots (side middles): **J** (italic) with green-tinted background
- Center slots: no marker, neutral background

### 8.3 Jungle theme
- Dark green gradient backgrounds (`#1a2f1a` to `#2d4a2d`).
- Gold accent color (`#d4a843`) for borders, highlights, and title gradient.
- Decorative jungle emoji elements (🌿 🌴) as subtle fixed overlays.
- Board has a semi-transparent green panel with gold border.

### 8.4 Sound effects
- **Game-over sound**: `/assets/sfx/fart1.ogg` — plays when the lose modal appears (toggleable via settings).

### 8.5 Risk meter
Status bar displays **face slot occupancy badges** for each type (K, Q, J):
- Shows `filled/total` count (e.g., `K: 2/4`).
- **Warning** (orange) when only 1 slot remains.
- **Complete** (green) when all slots are filled.

---

## 9) Options Screen (Settings)

### 9.1 Implemented options
- Game ID:
  - Random new game
  - Start by ID (input in header)
  - Restart same game
- Animations: on/off
- Sounds: on/off (controls game-over fart sound)
- Hints: on/off (Hint button disabled if off)
- Accessibility:
  - High-contrast mode (black background, brighter colors)
  - Large cards mode (90×130px instead of 70×100px)

### 9.2 Future options
- Card style:
  - CSS-rendered (current default)
  - Asset deck (SVG/PNG in `/assets/cards/`)
- Undo mode:
  - Current turn (default)
  - Off
  - Unlimited
- Auto-place:
  - Only when 1 legal slot (default)
  - Never
  - Always (needs heuristic)

### 9.3 Alternative layouts (future)
Default remains 4×4. For larger boards, two viable designs:
- **Multi-deck mode**: add decks so there are enough J/Q/K to justify more special slots.
- **Fixed special slots**: keep 12 special slots and enlarge the board with more unmarked slots (makes the game easier unless compensated).

---

## 10) Data Model

### 10.1 Card
```js
Card = {
  id: string,
  suit: "H"|"D"|"C"|"S",
  rank: 1..13,                // A=1 ... K=13
  isFace: boolean,            // rank >= 11
  faceType: null|"J"|"Q"|"K"  // derived
}
```

### 10.2 Board
```js
SlotType = "K"|"Q"|"J"|"ANY"
Slot = { row: number, col: number, type: SlotType, cardId: string|null }

Board = { rows: 4, cols: 4, slots: Slot[] }
```

### 10.3 Game state
```js
GameState = {
  gameId: number,
  deck: Card[],
  stockIndex: number,              // next card is deck[stockIndex]
  board: Board,
  phase: "PLACEMENT"|"REMOVAL"|"WON"|"LOST",
  moves: number,
  startTimeMs: number,
  elapsedMs: number,
  undoStack: Snapshot[],
  selectedSlotIndex: number|null    // for removal phase card selection
}
```

### 10.4 Snapshot (undo)
```js
Snapshot = {
  stockIndex: number,
  boardCardIds: (string|null)[],    // length 16
  phase: "PLACEMENT"|"REMOVAL",
  moves: number
}
```

### 10.5 Options (persisted to localStorage)
```js
Options = {
  cardStyle: "css",
  animations: boolean,
  sounds: boolean,
  hints: boolean,
  highContrast: boolean,
  largeCards: boolean
}
```

### 10.6 Stats (persisted to localStorage)
```js
Stats = {
  gamesPlayed: number,
  gamesWon: number,
  bestMoves: number|null,
  bestTimeMs: number|null
}
```

---

## 11) Rules Engine (Deterministic)

### 11.1 Placement legality
For card `c` and empty slot `s`:
- If `c` is K → `s.type === "K"`
- If `c` is Q → `s.type === "Q"`
- If `c` is J → `s.type === "J"`
- If `c` is A–10 → any empty slot is legal

### 11.2 Removal legality (REMOVAL phase only)
- Single 10 is removable.
- Pair is removable if both are number cards (A–10) and sum to 10.
- Face cards are never removable.
- Removals can be **chained**: after a removal, if more valid combos exist, the player stays in REMOVAL phase regardless of board fill level.

### 11.3 Win check
- Win when count of face cards on board (J/Q/K) reaches **12**.

### 11.4 Loss checks
- Placement: next card is face and has 0 legal slots → lose.
- Removal: no removals exist and no stock remains → lose.

---

## 12) Suggested "Fun Features"

- **Daily Jungle Challenge**: game id = YYYYMMDD, track best moves/time locally.
- **Risk meter**: warn when face slots are close to blocked (e.g., "Queens: 3/4 filled"). ✅ Implemented.
- **Achievements / unlocks**: new card backs / jungle boards.
- **Combo streak**: during removal phase, count consecutive removals and show jungle animation.
- **Smart hint level**: "basic hint" vs "least risky slot" heuristic for number placement.

---

## 13) Acceptance Criteria (MVP)

1. ✅ Correct 4×4 layout with K/Q/J slot mapping.
2. ✅ Next-card preview visible; click empty slot places it; card locks.
3. ✅ Removal only when board full; pairs sum to 10 or single 10; chaining supported.
4. ✅ Win triggers when all 12 face cards are placed.
5. ✅ Loss triggers for blocked face card or no moves remaining.
6. ✅ Game finished modal shows monkey red-ass photo, blocking card, and fart sound; **New Game only**.
7. ✅ Seeded shuffles with Game ID (Mulberry32 + Fisher–Yates); restart repeats exactly.
8. ✅ Undo works for current "turn" as defined.
9. ✅ Hint button works in both phases.
10. ✅ Runs with **no npm**; deployed to GitHub Pages.
11. ✅ Royalty cards highlight valid/invalid slots on hover.
12. ✅ Keyboard shortcuts (Ctrl+Z undo, H hint).
13. ✅ Settings persisted to localStorage (animations, sounds, hints, accessibility).
14. ✅ Risk meter shows face slot occupancy with warning colors.

---

## 14) File/Project Structure (No NPM)

```
/kadosh3/
  index.html
  .gitignore
  .github/
    workflows/
      deploy.yml              # GitHub Pages deployment
  /css/
    styles.css
  /js/
    app.js                    # Main orchestration + controls
    state.js                  # Game state management + undo
    rules.js                  # Rules engine (pure functions)
    rng.js                    # Mulberry32 PRNG + Fisher–Yates shuffle
    ui.js                     # DOM rendering & interactions
    storage.js                # localStorage for options & stats
  /assets/
    /cards/                   # (reserved for future card art assets)
    monkey-butt.svg           # SVG fallback monkey illustration
    monkey-red-ass.png        # Real monkey photo for game-over modal
    /sfx/
      fart1.ogg               # Game-over sound effect
  kadosh3-spec.md             # This spec
```
