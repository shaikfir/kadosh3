/* UI rendering & interaction handling */

const UI = (() => {
  const SUIT_SYMBOLS = { H: '♥', D: '♦', C: '♣', S: '♠' };
  const SUIT_COLORS = { H: '#e74c3c', D: '#e74c3c', C: '#2c3e50', S: '#2c3e50' };
  const RANK_DISPLAY = {
    1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6',
    7: '7', 8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K',
  };
  const SLOT_LABELS = { K: '♚', Q: '♛', J: 'J', ANY: '' };

  let options = {};
  let highlightedSlots = [];
  let selectedRemovalSlot = null;
  let timerInterval = null;
  const loseSfx = new Audio('assets/sfx/fart1.ogg');

  function init(opts) {
    options = opts;
    applyAccessibility();
  }

  function applyAccessibility() {
    document.body.classList.toggle('high-contrast', !!options.highContrast);
    document.body.classList.toggle('large-cards', !!options.largeCards);
    document.body.classList.toggle('no-animations', !options.animations);
  }

  function renderBoard(game) {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    highlightedSlots = [];
    selectedRemovalSlot = null;

    for (let i = 0; i < 16; i++) {
      const slot = game.board[i];
      const slotEl = document.createElement('div');
      slotEl.className = 'slot';
      slotEl.dataset.index = i;
      slotEl.dataset.type = slot.type;

      if (slot.cardId) {
        const card = game.deck.find((c) => c.id === slot.cardId);
        slotEl.appendChild(createCardElement(card));
        slotEl.classList.add('occupied');

        if (game.phase === 'REMOVAL' && !card.isFace) {
          slotEl.classList.add('removable-candidate');
          slotEl.addEventListener('click', () => handleRemovalClick(i));
        }
      } else {
        const marker = document.createElement('span');
        marker.className = 'slot-marker';
        marker.textContent = SLOT_LABELS[slot.type];
        slotEl.appendChild(marker);
        slotEl.classList.add('empty');

        if (game.phase === 'PLACEMENT') {
          slotEl.addEventListener('click', () => handlePlacementClick(i));

          const nextC = State.nextCard();
          if (nextC && nextC.isFace) {
            const legal = Rules.legalSlotsForCard(nextC, game.board);
            const isLegal = legal.some((s) => s.row === slot.row && s.col === slot.col);
            slotEl.classList.add(isLegal ? 'legal-hover' : 'illegal-hover');
          }
        }
      }

      boardEl.appendChild(slotEl);
    }
  }

  function createCardElement(card) {
    const el = document.createElement('div');
    el.className = 'card';
    el.dataset.suit = card.suit;
    el.dataset.rank = card.rank;

    const color = SUIT_COLORS[card.suit];
    el.style.color = color;

    const rankEl = document.createElement('span');
    rankEl.className = 'card-rank';
    rankEl.textContent = RANK_DISPLAY[card.rank];

    const suitEl = document.createElement('span');
    suitEl.className = 'card-suit';
    suitEl.textContent = SUIT_SYMBOLS[card.suit];

    const centerEl = document.createElement('span');
    centerEl.className = 'card-center';
    centerEl.textContent = SUIT_SYMBOLS[card.suit];

    el.appendChild(rankEl);
    el.appendChild(centerEl);
    el.appendChild(suitEl);

    return el;
  }

  function renderNextCard(game) {
    const previewEl = document.getElementById('next-card-preview');
    previewEl.innerHTML = '';

    const card = State.nextCard();
    if (!card) {
      previewEl.innerHTML = '<div class="card card-empty"><span class="card-center">—</span></div>';
      document.getElementById('stock-count').textContent = '0 cards left';
      return;
    }

    const cardEl = createCardElement(card);
    cardEl.classList.add('next-card');
    cardEl.addEventListener('click', handleNextCardClick);

    cardEl.setAttribute('draggable', 'true');
    cardEl.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', 'next-card');
      cardEl.classList.add('dragging');
    });
    cardEl.addEventListener('dragend', () => {
      cardEl.classList.remove('dragging');
    });

    previewEl.appendChild(cardEl);

    const remaining = State.stockRemaining();
    document.getElementById('stock-count').textContent = `${remaining} card${remaining !== 1 ? 's' : ''} left`;
  }

  function renderStatus(game) {
    const phaseEl = document.getElementById('phase-display');
    if (game.phase === 'PLACEMENT') {
      phaseEl.textContent = 'Place a card';
      phaseEl.className = 'phase-badge placement';
    } else if (game.phase === 'REMOVAL') {
      phaseEl.textContent = 'Remove pairs (sum = 10)';
      phaseEl.className = 'phase-badge removal';
    } else if (game.phase === 'WON') {
      phaseEl.textContent = 'You won!';
      phaseEl.className = 'phase-badge won';
    } else {
      phaseEl.textContent = 'Game over';
      phaseEl.className = 'phase-badge lost';
    }

    document.getElementById('game-id-display').textContent = `Game #${game.gameId}`;
    document.getElementById('moves-display').textContent = `Moves: ${game.moves}`;

    renderFaceStatus(game);
  }

  function renderFaceStatus(game) {
    const status = Rules.faceSlotStatus(game.board, game.deck);
    const el = document.getElementById('face-status');
    el.innerHTML = '';
    for (const [type, info] of Object.entries(status)) {
      const badge = document.createElement('span');
      badge.className = 'face-badge';
      if (info.filled === info.total) badge.classList.add('complete');
      else if (info.filled >= info.total - 1) badge.classList.add('warning');
      badge.textContent = `${type}: ${info.filled}/${info.total}`;
      el.appendChild(badge);
    }
  }

  function renderTimer(game) {
    const mins = Math.floor(game.elapsedMs / 60000);
    const secs = Math.floor((game.elapsedMs % 60000) / 1000);
    document.getElementById('timer-display').textContent =
      `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function startTimer() {
    stopTimer();
    timerInterval = setInterval(() => {
      State.updateElapsed();
      const game = State.getGame();
      if (game) renderTimer(game);
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function handlePlacementClick(slotIndex) {
    const game = State.getGame();
    if (!game || game.phase !== 'PLACEMENT') return;

    const result = State.placeCard(slotIndex);
    if (!result.success) {
      showToast(result.reason);
      return;
    }

    clearHighlights();
    renderAll(game);

    if (result.phase === 'WON') {
      stopTimer();
      showWinModal(game);
    } else if (result.phase === 'LOST') {
      stopTimer();
      showLoseModal(game, result.lossReason);
    }
  }

  function handleRemovalClick(slotIndex) {
    const game = State.getGame();
    if (!game || game.phase !== 'REMOVAL') return;

    const slot = game.board[slotIndex];
    const card = game.deck.find((c) => c.id === slot.cardId);
    if (!card || card.isFace) {
      showToast('Face cards cannot be removed');
      return;
    }

    if (selectedRemovalSlot === null) {
      if (card.rank === 10) {
        const result = State.removeCards([slotIndex]);
        if (result.success) {
          animateRemoval([slotIndex]);
          selectedRemovalSlot = null;
          setTimeout(() => {
            renderAll(game);
            if (result.phase === 'WON') {
              stopTimer();
              showWinModal(game);
            } else if (result.phase === 'LOST') {
              stopTimer();
              showLoseModal(game, result.lossReason);
            }
          }, options.animations ? 300 : 0);
          return;
        }
      }

      selectedRemovalSlot = slotIndex;
      const slotEl = document.querySelector(`.slot[data-index="${slotIndex}"]`);
      if (slotEl) slotEl.classList.add('selected');
    } else {
      if (selectedRemovalSlot === slotIndex) {
        const slotEl = document.querySelector(`.slot[data-index="${slotIndex}"]`);
        if (slotEl) slotEl.classList.remove('selected');
        selectedRemovalSlot = null;
        return;
      }

      const result = State.removeCards([selectedRemovalSlot, slotIndex]);
      if (result.success) {
        animateRemoval([selectedRemovalSlot, slotIndex]);
        selectedRemovalSlot = null;
        setTimeout(() => {
          renderAll(game);
          if (result.phase === 'WON') {
            stopTimer();
            showWinModal(game);
          } else if (result.phase === 'LOST') {
            stopTimer();
            showLoseModal(game, result.lossReason);
          }
        }, options.animations ? 300 : 0);
      } else {
        showToast(result.reason);
        const oldEl = document.querySelector(`.slot[data-index="${selectedRemovalSlot}"]`);
        if (oldEl) oldEl.classList.remove('selected');
        selectedRemovalSlot = null;
      }
    }
  }

  function handleNextCardClick() {
    const game = State.getGame();
    if (!game || game.phase !== 'PLACEMENT') return;

    const card = State.nextCard();
    if (!card) return;

    const legalSlots = Rules.legalSlotsForCard(card, game.board);

    if (legalSlots.length === 0) {
      return; // loss already handled
    }

    if (legalSlots.length === 1) {
      const idx = Rules.slotIndex(legalSlots[0].row, legalSlots[0].col);
      handlePlacementClick(idx);
      return;
    }

    highlightSlots(legalSlots);
  }

  function highlightSlots(slots) {
    clearHighlights();
    highlightedSlots = slots;
    for (const slot of slots) {
      const idx = Rules.slotIndex(slot.row, slot.col);
      const el = document.querySelector(`.slot[data-index="${idx}"]`);
      if (el) el.classList.add('highlighted');
    }
  }

  function clearHighlights() {
    document.querySelectorAll('.slot.highlighted').forEach((el) => el.classList.remove('highlighted'));
    document.querySelectorAll('.slot.selected').forEach((el) => el.classList.remove('selected'));
    highlightedSlots = [];
  }

  function animateRemoval(indices) {
    for (const idx of indices) {
      const el = document.querySelector(`.slot[data-index="${idx}"]`);
      if (el) el.classList.add('removing');
    }
  }

  function showHint() {
    const hint = State.getHint();
    if (!hint) {
      showToast('No hints available');
      return;
    }

    if (hint.type === 'placement') {
      highlightSlots(hint.slots);
    } else if (hint.type === 'removal') {
      clearHighlights();
      for (const slot of hint.combo) {
        const idx = Rules.slotIndex(slot.row, slot.col);
        const el = document.querySelector(`.slot[data-index="${idx}"]`);
        if (el) el.classList.add('highlighted');
      }
    }
  }

  function showWinModal(game) {
    State.updateElapsed();
    const stats = Storage.updateStats(true, game.moves, game.elapsedMs);
    const modal = document.getElementById('game-modal');
    const content = document.getElementById('modal-content');
    content.innerHTML = `
      <h2 class="modal-title win-title">🎉 YOU WON! 🎉</h2>
      <div class="modal-image win-image">
        <div class="win-monkey">🐒👑</div>
      </div>
      <p class="modal-text">All face cards placed! The jungle king is pleased.</p>
      <div class="modal-stats">
        <span>Moves: ${game.moves}</span>
        <span>Time: ${formatTime(game.elapsedMs)}</span>
      </div>
      <div class="modal-stats">
        <span>Games won: ${stats.gamesWon}/${stats.gamesPlayed}</span>
        ${stats.bestMoves ? `<span>Best: ${stats.bestMoves} moves</span>` : ''}
      </div>
      <button class="btn btn-primary" onclick="App.newGame()">New Game</button>
    `;
    modal.classList.add('active');
  }

  function cardToHTML(card) {
    const color = SUIT_COLORS[card.suit];
    const rank = RANK_DISPLAY[card.rank];
    const suit = SUIT_SYMBOLS[card.suit];
    return `<div class="card modal-card" style="color:${color}">
      <span class="card-rank">${rank}</span>
      <span class="card-center">${suit}</span>
      <span class="card-suit">${suit}</span>
    </div>`;
  }

  function showLoseModal(game, reason) {
    State.updateElapsed();
    Storage.updateStats(false, game.moves, game.elapsedMs);
    const modal = document.getElementById('game-modal');
    const content = document.getElementById('modal-content');

    const blockingCard = State.nextCard();
    const cardHTML = blockingCard ? cardToHTML(blockingCard) : '';

    content.innerHTML = `
      <h2 class="modal-title lose-title">GAME FINISHED</h2>
      ${cardHTML ? `<div class="modal-blocking-card">${cardHTML}</div>` : ''}
      <div class="modal-image">
        <img src="assets/monkey-red-ass.png" alt="Monkey" class="monkey-img" onerror="this.outerHTML='<div class=\\'monkey-fallback\\'>🐵🍑</div>'">
      </div>
      <p class="modal-text">${reason || 'Better luck next time!'}</p>
      <div class="modal-stats">
        <span>Moves: ${game.moves}</span>
        <span>Time: ${formatTime(game.elapsedMs)}</span>
      </div>
      <button class="btn btn-primary" onclick="App.newGame()">New Game</button>
    `;
    modal.classList.add('active');

    if (options.sounds) {
      loseSfx.currentTime = 0;
      loseSfx.play().catch(() => {});
    }
  }

  function hideModal() {
    document.getElementById('game-modal').classList.remove('active');
  }

  function showSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const opts = Storage.loadOptions();

    document.getElementById('opt-animations').checked = opts.animations;
    document.getElementById('opt-sounds').checked = opts.sounds;
    document.getElementById('opt-hints').checked = opts.hints;
    document.getElementById('opt-high-contrast').checked = opts.highContrast;
    document.getElementById('opt-large-cards').checked = opts.largeCards;

    modal.classList.add('active');
  }

  function hideSettingsModal() {
    document.getElementById('settings-modal').classList.remove('active');
  }

  function saveSettings() {
    options = {
      ...options,
      animations: document.getElementById('opt-animations').checked,
      sounds: document.getElementById('opt-sounds').checked,
      hints: document.getElementById('opt-hints').checked,
      highContrast: document.getElementById('opt-high-contrast').checked,
      largeCards: document.getElementById('opt-large-cards').checked,
    };
    Storage.saveOptions(options);
    applyAccessibility();
    hideSettingsModal();
    const game = State.getGame();
    if (game) renderAll(game);
  }

  function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('active');
    setTimeout(() => el.classList.remove('active'), 2000);
  }

  function renderAll(game) {
    renderBoard(game);
    renderNextCard(game);
    renderStatus(game);
    renderTimer(game);
    setupDragDrop(game);

    const undoBtn = document.getElementById('btn-undo');
    undoBtn.disabled = !State.canUndo() || game.phase === 'WON' || game.phase === 'LOST';

    const hintBtn = document.getElementById('btn-hint');
    hintBtn.disabled = !options.hints || game.phase === 'WON' || game.phase === 'LOST';
  }

  function setupDragDrop(game) {
    if (game.phase !== 'PLACEMENT') return;

    document.querySelectorAll('.slot.empty').forEach((slotEl) => {
      slotEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        slotEl.classList.add('drag-over');
      });
      slotEl.addEventListener('dragleave', () => {
        slotEl.classList.remove('drag-over');
      });
      slotEl.addEventListener('drop', (e) => {
        e.preventDefault();
        slotEl.classList.remove('drag-over');
        const idx = parseInt(slotEl.dataset.index);
        handlePlacementClick(idx);
      });
    });
  }

  function formatTime(ms) {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return {
    init,
    renderAll,
    showHint,
    showWinModal,
    showLoseModal,
    hideModal,
    showSettingsModal,
    hideSettingsModal,
    saveSettings,
    showToast,
    startTimer,
    stopTimer,
    applyAccessibility,
  };
})();
