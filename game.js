// ===========================
// Moborr.io Game (stub)
// Minimal placeholder — no movement, no networking.
// ===========================

import { authToken, currentUser } from './auth.js';

const GAME_CONFIG = {
  CANVAS_WIDTH: window.innerWidth,
  CANVAS_HEIGHT: window.innerHeight,
  MAP_WIDTH: 10000,
  MAP_HEIGHT: 10000,
  PLAYER_RADIUS: 25,
  STAR_COUNT: 12,
  GRASS_TILE_SIZE: 50
};

let gameState = {
  localPlayer: null,
  otherPlayers: new Map(),
  camera: { x: 0, y: 0 },
  keys: {},
  ws: null
};

function createPlaceholder() {
  const container = document.getElementById('gameContainer') || document.body;
  // Remove existing children so we show a clean placeholder
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '100vh';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.alignItems = 'center';
  wrapper.style.justifyContent = 'center';
  wrapper.style.background = 'linear-gradient(180deg,#000000,#0b1220)';
  wrapper.style.color = '#fff';
  wrapper.style.textAlign = 'center';
  wrapper.innerHTML = `
    <h1 style="font-size: 3rem; margin-bottom: 0.5rem;">MOBORR.IO</h1>
    <p style="color:#cbd5e1; margin-bottom: 1.5rem;">The game core is paused while we build features. For now this is a placeholder — coming soon.</p>
    <div style="margin-bottom:1rem;">
      <strong style="color:#fff">${currentUser?.username ?? 'Guest'}</strong>
      <div style="color:#9ca3af; font-size:0.9rem;">Avatar: ${currentUser?.avatar ?? '🔐'}</div>
    </div>
    <div style="display:flex; gap:0.5rem;">
      <button id="backToMenuBtn" style="background:#ef4444; color:#fff; padding:0.6rem 1rem; border-radius:6px; border:none; cursor:pointer;">Back to Menu</button>
    </div>
  `;

  container.appendChild(wrapper);

  document.getElementById('backToMenuBtn')?.addEventListener('click', () => {
    window.location.href = './index.html';
  });
}

export function initializeGame() {
  if (!currentUser) {
    console.error('User not logged in — redirecting to home.');
    window.location.href = './index.html';
    return;
  }

  // Create a very simple placeholder UI instead of the game
  createPlaceholder();

  // Initialize a minimal localPlayer record for UI purposes
  gameState.localPlayer = {
    id: currentUser.id,
    username: currentUser.username,
    x: GAME_CONFIG.MAP_WIDTH / 2,
    y: GAME_CONFIG.MAP_HEIGHT / 2,
    radius: GAME_CONFIG.PLAYER_RADIUS
  };

  console.log('⚪ Game placeholder initialized (no game loop, no networking).');
}

export { gameState, GAME_CONFIG };
