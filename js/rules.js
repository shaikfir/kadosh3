/* Rules engine — pure functions, no side effects */

const Rules = (() => {
  const SLOT_MAP = buildSlotMap();

  function buildSlotMap() {
    const types = [];
    const layout = [
      ['K', 'Q', 'Q', 'K'],
      ['J', 'ANY', 'ANY', 'J'],
      ['J', 'ANY', 'ANY', 'J'],
      ['K', 'Q', 'Q', 'K'],
    ];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        types.push({ row: r, col: c, type: layout[r][c] });
      }
    }
    return types;
  }

  function createBoard() {
    return SLOT_MAP.map((s) => ({
      row: s.row,
      col: s.col,
      type: s.type,
      cardId: null,
    }));
  }

  function slotIndex(row, col) {
    return row * 4 + col;
  }

  function isSlotEmpty(board, row, col) {
    return board[slotIndex(row, col)].cardId === null;
  }

  function boardIsFull(board) {
    return board.every((s) => s.cardId !== null);
  }

  function emptySlotCount(board) {
    return board.filter((s) => s.cardId === null).length;
  }

  function legalSlotsForCard(card, board) {
    return board.filter((slot) => {
      if (slot.cardId !== null) return false;
      if (card.faceType === 'K') return slot.type === 'K';
      if (card.faceType === 'Q') return slot.type === 'Q';
      if (card.faceType === 'J') return slot.type === 'J';
      return true; // number cards go anywhere
    });
  }

  function cardValue(card) {
    if (card.isFace) return null;
    return card.rank; // A=1 .. 10=10
  }

  function canRemoveSingle(card) {
    return !card.isFace && card.rank === 10;
  }

  function canRemovePair(c1, c2) {
    if (c1.isFace || c2.isFace) return false;
    return c1.rank + c2.rank === 10;
  }

  function findRemovableCombos(board, deck) {
    const combos = [];
    const occupiedSlots = board.filter((s) => s.cardId !== null);
    const cards = occupiedSlots.map((s) => ({
      slot: s,
      card: deck.find((c) => c.id === s.cardId),
    }));

    for (const { slot, card } of cards) {
      if (canRemoveSingle(card)) {
        combos.push([slot]);
      }
    }

    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        if (canRemovePair(cards[i].card, cards[j].card)) {
          combos.push([cards[i].slot, cards[j].slot]);
        }
      }
    }

    return combos;
  }

  function hasAnyRemoval(board, deck) {
    const occupiedSlots = board.filter((s) => s.cardId !== null);
    const cards = occupiedSlots.map((s) => ({
      slot: s,
      card: deck.find((c) => c.id === s.cardId),
    }));

    for (const { card } of cards) {
      if (canRemoveSingle(card)) return true;
    }

    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        if (canRemovePair(cards[i].card, cards[j].card)) return true;
      }
    }

    return false;
  }

  function faceCardsOnBoard(board, deck) {
    return board.filter((s) => {
      if (!s.cardId) return false;
      const card = deck.find((c) => c.id === s.cardId);
      return card && card.isFace;
    }).length;
  }

  function checkWin(board, deck) {
    return faceCardsOnBoard(board, deck) === 12;
  }

  function checkPlacementLoss(card, board) {
    if (!card.isFace) return false;
    return legalSlotsForCard(card, board).length === 0;
  }

  function checkRemovalLoss(board, deck) {
    return boardIsFull(board) && !hasAnyRemoval(board, deck);
  }

  function faceSlotStatus(board, deck) {
    const status = { K: { total: 4, filled: 0 }, Q: { total: 4, filled: 0 }, J: { total: 4, filled: 0 } };
    for (const slot of board) {
      if (slot.type === 'K' || slot.type === 'Q' || slot.type === 'J') {
        if (slot.cardId !== null) {
          status[slot.type].filled++;
        }
      }
    }
    return status;
  }

  return {
    SLOT_MAP,
    createBoard,
    slotIndex,
    isSlotEmpty,
    boardIsFull,
    emptySlotCount,
    legalSlotsForCard,
    canRemoveSingle,
    canRemovePair,
    findRemovableCombos,
    hasAnyRemoval,
    faceCardsOnBoard,
    checkWin,
    checkPlacementLoss,
    checkRemovalLoss,
    faceSlotStatus,
    cardValue,
  };
})();
