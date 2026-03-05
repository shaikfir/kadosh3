/* Main app orchestration */

const App = (() => {
  function init() {
    const options = Storage.loadOptions();
    UI.init(options);
    newGame();
    bindControls();
  }

  function newGame(gameId) {
    UI.hideModal();
    const game = State.newGame(gameId);
    UI.renderAll(game);
    UI.startTimer();
  }

  function restartGame() {
    const game = State.getGame();
    if (game) newGame(game.gameId);
  }

  function startGameById() {
    const input = document.getElementById('game-id-input');
    const val = parseInt(input.value, 10);
    if (isNaN(val) || val < 1) {
      UI.showToast('Enter a valid Game ID (positive number)');
      return;
    }
    newGame(val);
    input.value = '';
  }

  function undo() {
    const game = State.getGame();
    if (!game) return;
    if (State.undo()) {
      UI.renderAll(game);
    }
  }

  function hint() {
    UI.showHint();
  }

  function bindControls() {
    document.getElementById('btn-new-game').addEventListener('click', () => newGame());
    document.getElementById('btn-restart').addEventListener('click', restartGame);
    document.getElementById('btn-undo').addEventListener('click', undo);
    document.getElementById('btn-hint').addEventListener('click', hint);
    document.getElementById('btn-settings').addEventListener('click', UI.showSettingsModal);
    document.getElementById('btn-save-settings').addEventListener('click', UI.saveSettings);
    document.getElementById('btn-cancel-settings').addEventListener('click', UI.hideSettingsModal);
    document.getElementById('btn-start-by-id').addEventListener('click', startGameById);

    document.getElementById('game-id-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') startGameById();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        undo();
      }
      if (e.key === 'h' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;
        hint();
      }
    });
  }

  return { init, newGame, restartGame, undo, hint };
})();

document.addEventListener('DOMContentLoaded', App.init);
