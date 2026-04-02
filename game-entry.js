// ===========================
// Game Entry Point
// ===========================

import { initializeGame } from './game.js';
import { isLoggedIn, loadUserFromStorage } from './auth.js';

loadUserFromStorage();

if (!isLoggedIn()) {
  window.location.href = './index.html';
} else {
  initializeGame();

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.location.href = './index.html';
    }
  });
}
