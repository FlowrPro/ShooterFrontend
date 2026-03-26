// ===========================
// Game Entry Point (Updated)
// ===========================

import { initializeGame, gameState, GAME_CONFIG } from './game.js';
import { currentUser, isLoggedIn, loadUserFromStorage } from './auth.js';

loadUserFromStorage();

if (!isLoggedIn()) {
  window.location.href = './index.html';
} else {
  initializeGame();

  const playerInfo = document.getElementById('playerInfo');
  setInterval(() => {
    if (gameState.localPlayer) {
      playerInfo.innerHTML = `
        <strong>${gameState.localPlayer.username}</strong><br/>
        Map: ${GAME_CONFIG.MAP_WIDTH}x${GAME_CONFIG.MAP_HEIGHT}<br/>
        <span style="color: #4a90e2;">● Players: ${gameState.otherPlayers.size + 1}</span>
      `;
    }
  }, 500);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.location.href = './index.html';
    }
  });
}
