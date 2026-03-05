/* Game state management */

const State = (() => {
  let game = null;

  function newGame(gameId) {
    const id = gameId || RNG.randomGameId();
    const deck = RNG.shuffleDeck(id);
    game = {
      gameId: id,
      deck,
      stockIndex: 0,
      board: Rules.createBoard(),
      phase: 'PLACEMENT',
      moves: 0,
      startTimeMs: Date.now(),
      elapsedMs: 0,
      undoStack: [],
      selectedSlotIndex: null,
    };
    return game;
  }

  function getGame() {
    return game;
  }

  function nextCard() {
    if (!game || game.stockIndex >= game.deck.length) return null;
    return game.deck[game.stockIndex];
  }

  function stockRemaining() {
    if (!game) return 0;
    return game.deck.length - game.stockIndex;
  }

  function snapshot() {
    return {
      stockIndex: game.stockIndex,
      boardCardIds: game.board.map((s) => s.cardId),
      phase: game.phase,
      moves: game.moves,
    };
  }

  function restoreSnapshot(snap) {
    game.stockIndex = snap.stockIndex;
    for (let i = 0; i < 16; i++) {
      game.board[i].cardId = snap.boardCardIds[i];
    }
    game.phase = snap.phase;
    game.moves = snap.moves;
  }

  function pushUndo() {
    game.undoStack.push(snapshot());
  }

  function clearUndo() {
    game.undoStack = [];
  }

  function canUndo() {
    return game && game.undoStack.length > 0;
  }

  function undo() {
    if (!canUndo()) return false;
    const snap = game.undoStack.pop();
    restoreSnapshot(snap);
    return true;
  }

  function placeCard(slotIndex) {
    const card = nextCard();
    if (!card) return { success: false, reason: 'No cards left' };

    const slot = game.board[slotIndex];
    if (slot.cardId !== null) return { success: false, reason: 'Slot occupied' };

    const legalSlots = Rules.legalSlotsForCard(card, game.board);
    if (!legalSlots.some((s) => s.row === slot.row && s.col === slot.col)) {
      return { success: false, reason: 'Illegal placement for this card' };
    }

    clearUndo();
    pushUndo();

    slot.cardId = card.id;
    game.stockIndex++;
    game.moves++;

    if (Rules.checkWin(game.board, game.deck)) {
      game.phase = 'WON';
      return { success: true, phase: 'WON' };
    }

    if (Rules.boardIsFull(game.board)) {
      if (Rules.checkRemovalLoss(game.board, game.deck)) {
        game.phase = 'LOST';
        return { success: true, phase: 'LOST', lossReason: 'Board is full and no removable combinations exist.' };
      }
      game.phase = 'REMOVAL';
      return { success: true, phase: 'REMOVAL' };
    }

    const next = nextCard();
    if (next && Rules.checkPlacementLoss(next, game.board)) {
      game.phase = 'LOST';
      const typeName = next.faceType === 'K' ? 'King' : next.faceType === 'Q' ? 'Queen' : 'Jack';
      return { success: true, phase: 'LOST', lossReason: `Drew a ${typeName} but all ${typeName} slots are occupied.` };
    }

    game.phase = 'PLACEMENT';
    return { success: true, phase: 'PLACEMENT' };
  }

  function removeCards(slotIndices) {
    if (game.phase !== 'REMOVAL') return { success: false, reason: 'Not in removal phase' };

    pushUndo();

    if (slotIndices.length === 1) {
      const slot = game.board[slotIndices[0]];
      const card = game.deck.find((c) => c.id === slot.cardId);
      if (!card || !Rules.canRemoveSingle(card)) {
        game.undoStack.pop();
        return { success: false, reason: 'Cannot remove this card alone (must be a 10)' };
      }
      slot.cardId = null;
    } else if (slotIndices.length === 2) {
      const s1 = game.board[slotIndices[0]];
      const s2 = game.board[slotIndices[1]];
      const c1 = game.deck.find((c) => c.id === s1.cardId);
      const c2 = game.deck.find((c) => c.id === s2.cardId);
      if (!c1 || !c2 || !Rules.canRemovePair(c1, c2)) {
        game.undoStack.pop();
        return { success: false, reason: 'These cards do not sum to 10' };
      }
      s1.cardId = null;
      s2.cardId = null;
    } else {
      game.undoStack.pop();
      return { success: false, reason: 'Invalid removal' };
    }

    game.moves++;

    if (Rules.checkWin(game.board, game.deck)) {
      game.phase = 'WON';
      return { success: true, phase: 'WON' };
    }

    // Allow chaining removals as long as valid combos exist
    if (Rules.hasAnyRemoval(game.board, game.deck)) {
      return { success: true, phase: 'REMOVAL' };
    }

    // No more removals — switch to placement if stock remains
    if (stockRemaining() > 0) {
      game.phase = 'PLACEMENT';
      const next = nextCard();
      if (next && Rules.checkPlacementLoss(next, game.board)) {
        game.phase = 'LOST';
        const typeName = next.faceType === 'K' ? 'King' : next.faceType === 'Q' ? 'Queen' : 'Jack';
        return { success: true, phase: 'LOST', lossReason: `Next card is a ${typeName} but all ${typeName} slots are occupied.` };
      }
      return { success: true, phase: 'PLACEMENT' };
    }

    // No removals and no stock left
    game.phase = 'LOST';
    return { success: true, phase: 'LOST', lossReason: 'No more moves available.' };
  }

  function getHint() {
    if (!game) return null;

    if (game.phase === 'PLACEMENT') {
      const card = nextCard();
      if (!card) return null;
      const slots = Rules.legalSlotsForCard(card, game.board);
      return { type: 'placement', slots };
    }

    if (game.phase === 'REMOVAL') {
      const combos = Rules.findRemovableCombos(game.board, game.deck);
      if (combos.length > 0) return { type: 'removal', combo: combos[0] };
      return null;
    }

    return null;
  }

  function updateElapsed() {
    if (game && (game.phase === 'PLACEMENT' || game.phase === 'REMOVAL')) {
      game.elapsedMs = Date.now() - game.startTimeMs;
    }
  }

  return {
    newGame,
    getGame,
    nextCard,
    stockRemaining,
    placeCard,
    removeCards,
    canUndo,
    undo,
    getHint,
    updateElapsed,
    clearUndo,
  };
})();
