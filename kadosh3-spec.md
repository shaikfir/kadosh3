# Kadosh 3 — “Kings In The Corners” Solitaire Spec (Client‑Only, No NPM)

This spec describes **Kadosh 3**, a jungle-themed solitaire/puzzle game inspired by the “Kings In The Corners” ruleset you pasted (cardgames.io style). It is **not** the multiplayer Kings Corner game.

---

## 0) Hard Constraints

- **Client-side only** (pure browser).
- **No npm / no Node toolchain**. Must run by opening `index.html` directly or using any basic static server.
- Vanilla **HTML/CSS/JS** (ES6).
- Any third-party assets must be **vendored** into the repo (`/assets`, `/vendor`) and loaded via `<link>` / `<script>`.

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
- Jungle theme UI.
- “Game finished” modal shows **an image of a monkey showing its red ass** (local asset provided by you / bundled in `/assets/`).
- Game name shown as **Kadosh 3**.

---

## 2) Board Layout

### 2.1 Default board (fixed)
- Board is always **4×4 = 16 slots**.
- Slots have **markers** indicating face placement constraints (J/Q/K).  
  **Number cards (A–10) may be placed on *any* slot**, including marked ones.

### 2.2 Slot role mapping (row/col are 1-based)
- **Kings**: corners
  - (1,1), (1,4), (4,1), (4,4)
- **Queens**: middle of top + bottom rows
  - (1,2), (1,3), (4,2), (4,3)
- **Jacks**: middle of left + right columns
  - (2,1), (3,1), (2,4), (3,4)
- **Unmarked**: center 4 squares
  - (2,2), (2,3), (3,2), (3,3)

---

## 3) Cards & Stock

- Standard 52-card deck.
- Stock is face-down, but the **next card is always visible** (top card shown).
- There is **no waste pile**:
  - “Waste” in many solitaire games means a separate pile where drawn cards go temporarily.
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
  - If stock is empty and board is full and no removals exist → this is already covered by the “board full + no removals” loss condition.
  - If stock is empty and board is **not** full: placement is impossible; show “No cards left” and keep allowing removals only if the board is full (it won’t be).

---

## 5) Controls & UX

### 5.1 Primary interactions
- **Click empty slot** to place the next card (fast play).
- Optional: drag the next card preview onto an empty slot.
- In removal phase: click/drag between cards to remove.

### 5.2 “Auto-place” assist
- Clicking the **next-card preview** should:
  1. Determine all legal empty slots for that card.
  2. If **exactly one** legal slot exists: auto-place there.
  3. If multiple: highlight them and wait for slot click.
  4. If none (face blocked): trigger loss.

### 5.3 Hint button
A “Hint” button that behaves differently by phase:
- Placement phase: highlight all legal empty slots for the next card.
- Removal phase: highlight at least one removable combo (pair summing to 10 or a single 10).

### 5.4 Game finished modal
- On loss, show a modal:
  - Title: **GAME FINISHED**
  - Monkey red-ass image (asset path configurable, default `/assets/monkey-red-ass.png`)
  - Message text: why you lost (blocked face card / no removals).
  - Buttons:
    - **Start new game** (only).  
- No “Keep playing” option.

---

## 6) Undo (Current “Turn” Only)

Because this game doesn’t have “turns” in the multiplayer sense, define **turn** as:
- The sequence from the moment a new card becomes the “next card” preview until it has been placed.

### Undo scope
- Allow undo of the **last placement only**, plus any removals made **after** that placement *only if the board was full*.
- Clear undo history when a new card placement occurs (so undo never crosses multiple placements).

### Implementation approach
- Maintain an in-memory `undoStack` for the current turn segment.
- Snapshot before each mutation during removal (optional stepwise undo within removal), but never allow undo beyond the most recent placement boundary.

---

## 7) “Game #” (Seeded Shuffles)

### Requirements
- Each game has an integer **Game ID** shown on screen (e.g., `Game #37908`).
- Given the same Game ID, the shuffle order must be reproducible.

### Implementation approach
- Use a deterministic PRNG (e.g., Mulberry32 / Xorshift32) seeded with the Game ID.
- Shuffle deck with Fisher–Yates using that PRNG.
- “New Game” picks a random Game ID (e.g., 1..10,000,000).
- Add an input to **start a specific Game ID**.
- “Restart” restarts the same Game ID.

---

## 8) Visual Design & Assets (No NPM)

### 8.1 Card art options
Implement cards in two modes (selectable in Options):
1. **Asset deck** (SVG/PNG) in `/assets/cards/` (recommended for “beautiful”).
2. **CSS-rendered** (fallback): rank text + suit symbol.

### 8.2 Suggested free/open decks to vendor
Candidates to download and store locally in your repo:
- **SVGCards** (public-domain decks). citeturn0search3
- **revk.uk SVG Vector Playing Cards** (released under CC0). citeturn0search6
- **Wikimedia Commons CC0 deck (single SVG file)**. citeturn0search9

> Verify license text before shipping; vendor the files into `/assets/`.

### 8.3 Jungle theme assets
- Background texture (leaves), wood/stone UI panels, jungle accent colors.
- Sound effects (optional, toggleable): card place, remove combo, win, lose “monkey screech”.

---

## 9) Options Screen (Settings)

### 9.1 MVP options
- Game ID:
  - Random new game
  - Start by ID
- Card style:
  - Asset deck
  - Minimal CSS
- Animations: on/off
- Sounds: on/off
- Hints: on/off (Hint button disabled if off)
- Accessibility:
  - High-contrast mode
  - Large cards mode

### 9.2 Future options
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
  options: Options,
  stats: Stats
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

### 11.3 Win check
- Win when count of face cards on board (J/Q/K) reaches **12**.

### 11.4 Loss checks
- Placement: next card is face and has 0 legal slots → lose.
- Removal: board full and no removals exist → lose.

---

## 12) Suggested “Fun Features”

- **Daily Jungle Challenge**: game id = YYYYMMDD, track best moves/time locally.
- **Risk meter**: warn when face slots are close to blocked (e.g., “Queens: 3/4 filled”).
- **Achievements / unlocks**: new card backs / jungle boards.
- **Combo streak**: during removal phase, count consecutive removals and show jungle animation.
- **Smart hint level**: “basic hint” vs “least risky slot” heuristic for number placement.

---

## 13) Acceptance Criteria (MVP)

1. Correct 4×4 layout with K/Q/J slot mapping.
2. Next-card preview visible; click empty slot places it; card locks.
3. Removal only when board full; pairs sum to 10 or single 10.
4. Win triggers when all 12 face cards are placed.
5. Loss triggers for blocked face card or full board with no removals.
6. Game finished modal shows monkey red-ass image; **New Game only**.
7. Seeded shuffles with Game ID; restart repeats exactly.
8. Undo works for current “turn” as defined.
9. Hint button works in both phases.
10. Runs with **no npm**.

---

## 14) File/Project Structure (No NPM)

```
/kadosh3/
  index.html
  /css/
    styles.css
  /js/
    app.js
    state.js
    rules.js
    rng.js
    ui.js
    storage.js
  /assets/
    /cards/
    monkey-red-ass.png
    jungle-bg.png
    /sfx/
  README.md
```
