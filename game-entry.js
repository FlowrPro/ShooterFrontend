// ===========================
// Game Entry Point
// ===========================

import { initializeGame, gameState, GAME_CONFIG } from './game.js';
import { currentUser, isLoggedIn, loadUserFromStorage } from './auth.js';

// Load user from storage
loadUserFromStorage();

// Check if logged in
if (!isLoggedIn()) {
  window.location.href = './index.html';
} else {
  // Initialize game
  initializeGame();

  // Update HUD
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

  // ESC to return to menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.location.href = './index.html';
    }
  });
}