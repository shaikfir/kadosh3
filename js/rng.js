/* Deterministic PRNG & seeded shuffle for reproducible games */

const RNG = (() => {
  // Mulberry32 — fast 32-bit PRNG with good distribution
  function mulberry32(seed) {
    let s = seed | 0;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function createDeck() {
    const suits = ['H', 'D', 'C', 'S'];
    const deck = [];
    for (const suit of suits) {
      for (let rank = 1; rank <= 13; rank++) {
        deck.push({
          id: `${rank}_${suit}`,
          suit,
          rank,
          isFace: rank >= 11,
          faceType: rank === 11 ? 'J' : rank === 12 ? 'Q' : rank === 13 ? 'K' : null,
        });
      }
    }
    return deck;
  }

  // Fisher–Yates shuffle using the seeded PRNG
  function shuffleDeck(seed) {
    const deck = createDeck();
    const rng = mulberry32(seed);
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  function randomGameId() {
    return Math.floor(Math.random() * 10_000_000) + 1;
  }

  return { shuffleDeck, randomGameId, createDeck };
})();
