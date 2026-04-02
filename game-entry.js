// ===========================
// Game Entry Point (stub-friendly)
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
    if (playerInfo) {
      // Show the logged-in user's info since there is no real localPlayer movement
      playerInfo.innerHTML = `
        <strong>${currentUser.username}</strong><br/>
        Map: ${GAME_CONFIG.MAP_WIDTH}x${GAME_CONFIG.MAP_HEIGHT}<br/>
        <span style="color: #4a90e2;">● Players: ${gameState.otherPlayers.size + (gameState.localPlayer ? 1 : 0)}</span>
      `;
    }
  }, 500);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.location.href = './index.html';
    }
  });
}
