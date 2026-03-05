/* localStorage persistence for options and stats */

const Storage = (() => {
  const PREFIX = 'kadosh3_';

  const DEFAULT_OPTIONS = {
    cardStyle: 'css',
    animations: true,
    sounds: false,
    hints: true,
    highContrast: false,
    largeCards: false,
  };

  function saveOptions(opts) {
    try {
      localStorage.setItem(PREFIX + 'options', JSON.stringify(opts));
    } catch (e) { /* quota exceeded or private mode */ }
  }

  function loadOptions() {
    try {
      const raw = localStorage.getItem(PREFIX + 'options');
      if (raw) return { ...DEFAULT_OPTIONS, ...JSON.parse(raw) };
    } catch (e) { /* corrupted */ }
    return { ...DEFAULT_OPTIONS };
  }

  function saveStats(stats) {
    try {
      localStorage.setItem(PREFIX + 'stats', JSON.stringify(stats));
    } catch (e) { /* */ }
  }

  function loadStats() {
    try {
      const raw = localStorage.getItem(PREFIX + 'stats');
      if (raw) return JSON.parse(raw);
    } catch (e) { /* */ }
    return { gamesPlayed: 0, gamesWon: 0, bestMoves: null, bestTimeMs: null };
  }

  function updateStats(won, moves, timeMs) {
    const s = loadStats();
    s.gamesPlayed++;
    if (won) {
      s.gamesWon++;
      if (s.bestMoves === null || moves < s.bestMoves) s.bestMoves = moves;
      if (s.bestTimeMs === null || timeMs < s.bestTimeMs) s.bestTimeMs = timeMs;
    }
    saveStats(s);
    return s;
  }

  return { saveOptions, loadOptions, saveStats, loadStats, updateStats, DEFAULT_OPTIONS };
})();
