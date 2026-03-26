// ===========================
// Moborr.io Game Engine
// ===========================

import { authToken, currentUser } from './auth.js';

// Game configuration
const GAME_CONFIG = {
  CANVAS_WIDTH: window.innerWidth,
  CANVAS_HEIGHT: window.innerHeight,
  MAP_WIDTH: 10000,  // VERY large map
  MAP_HEIGHT: 10000,
  PLAYER_RADIUS: 25,
  PLAYER_SPEED: 5,
  STAR_COUNT: 12,     // Star-like dots around player
  GRASS_TILE_SIZE: 50 // For grassy pattern
};

// Game state
let gameState = {
  localPlayer: null,
  otherPlayers: new Map(),
  camera: { x: 0, y: 0 },
  keys: {}
};

// Initialize canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas to window
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  GAME_CONFIG.CANVAS_WIDTH = canvas.width;
  GAME_CONFIG.CANVAS_HEIGHT = canvas.height;
}

// Draw grassy ground pattern
function drawGrassyGround() {
  const startX = Math.floor(gameState.camera.x / GAME_CONFIG.GRASS_TILE_SIZE) * GAME_CONFIG.GRASS_TILE_SIZE;
  const startY = Math.floor(gameState.camera.y / GAME_CONFIG.GRASS_TILE_SIZE) * GAME_CONFIG.GRASS_TILE_SIZE;

  for (let x = startX; x < gameState.camera.x + GAME_CONFIG.CANVAS_WIDTH; x += GAME_CONFIG.GRASS_TILE_SIZE) {
    for (let y = startY; y < gameState.camera.y + GAME_CONFIG.CANVAS_HEIGHT; y += GAME_CONFIG.GRASS_TILE_SIZE) {
      // Checkerboard grass pattern
      const isEvenX = Math.floor(x / GAME_CONFIG.GRASS_TILE_SIZE) % 2 === 0;
      const isEvenY = Math.floor(y / GAME_CONFIG.GRASS_TILE_SIZE) % 2 === 0;
      
      if (isEvenX === isEvenY) {
        ctx.fillStyle = '#2d5016'; // Dark grass
      } else {
        ctx.fillStyle = '#3d6b1f'; // Light grass
      }

      const screenX = x - gameState.camera.x;
      const screenY = y - gameState.camera.y;
      ctx.fillRect(screenX, screenY, GAME_CONFIG.GRASS_TILE_SIZE, GAME_CONFIG.GRASS_TILE_SIZE);
    }
  }

  // Draw grass detail lines
  ctx.strokeStyle = 'rgba(0, 100, 0, 0.1)';
  ctx.lineWidth = 1;
  for (let x = startX; x < gameState.camera.x + GAME_CONFIG.CANVAS_WIDTH; x += GAME_CONFIG.GRASS_TILE_SIZE) {
    const screenX = x - gameState.camera.x;
    ctx.beginPath();
    ctx.moveTo(screenX, 0);
    ctx.lineTo(screenX, GAME_CONFIG.CANVAS_HEIGHT);
    ctx.stroke();
  }
  for (let y = startY; y < gameState.camera.y + GAME_CONFIG.CANVAS_HEIGHT; y += GAME_CONFIG.GRASS_TILE_SIZE) {
    const screenY = y - gameState.camera.y;
    ctx.beginPath();
    ctx.moveTo(0, screenY);
    ctx.lineTo(GAME_CONFIG.CANVAS_WIDTH, screenY);
    ctx.stroke();
  }
}

// Draw a player circle with eyes, smile, and stars
function drawPlayer(player, isLocal = false) {
  const screenX = player.x - gameState.camera.x;
  const screenY = player.y - gameState.camera.y;

  // Skip if off-screen (optimization)
  if (screenX < -GAME_CONFIG.PLAYER_RADIUS * 2 || screenX > GAME_CONFIG.CANVAS_WIDTH + GAME_CONFIG.PLAYER_RADIUS * 2 ||
      screenY < -GAME_CONFIG.PLAYER_RADIUS * 2 || screenY > GAME_CONFIG.CANVAS_HEIGHT + GAME_CONFIG.PLAYER_RADIUS * 2) {
    return;
  }

  // Draw main circle (blue)
  ctx.fillStyle = '#4a90e2';
  ctx.beginPath();
  ctx.arc(screenX, screenY, GAME_CONFIG.PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // Draw border
  ctx.strokeStyle = '#2e5c8a';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw stars around player
  const starRadius = GAME_CONFIG.PLAYER_RADIUS + 8;
  ctx.fillStyle = '#ffeb3b';
  for (let i = 0; i < GAME_CONFIG.STAR_COUNT; i++) {
    const angle = (i / GAME_CONFIG.STAR_COUNT) * Math.PI * 2;
    const x = screenX + Math.cos(angle) * starRadius;
    const y = screenY + Math.sin(angle) * starRadius;
    drawStar(x, y, 5, 4);
  }

  // Draw left eye
  const eyeOffsetX = 8;
  const eyeOffsetY = -5;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(screenX - eyeOffsetX, screenY + eyeOffsetY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(screenX - eyeOffsetX, screenY + eyeOffsetY, 2, 0, Math.PI * 2);
  ctx.fill();

  // Draw right eye
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(screenX + eyeOffsetX, screenY + eyeOffsetY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(screenX + eyeOffsetX, screenY + eyeOffsetY, 2, 0, Math.PI * 2);
  ctx.fill();

  // Draw smile
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(screenX, screenY + 3, 8, 0, Math.PI);
  ctx.stroke();

  // Draw username above player
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(player.username, screenX, screenY - GAME_CONFIG.PLAYER_RADIUS - 10);

  // Highlight local player with glow
  if (isLocal) {
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(screenX, screenY, GAME_CONFIG.PLAYER_RADIUS + 3, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// Draw a star shape
function drawStar(x, y, outerRadius, innerRadius) {
  const points = 5;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fill();
}

// Update local player position based on keys
function updateLocalPlayer() {
  if (!gameState.localPlayer) return;

  const speed = GAME_CONFIG.PLAYER_SPEED;

  if (gameState.keys['w'] || gameState.keys['W']) {
    gameState.localPlayer.y = Math.max(GAME_CONFIG.PLAYER_RADIUS, gameState.localPlayer.y - speed);
  }
  if (gameState.keys['s'] || gameState.keys['S']) {
    gameState.localPlayer.y = Math.min(GAME_CONFIG.MAP_HEIGHT - GAME_CONFIG.PLAYER_RADIUS, gameState.localPlayer.y + speed);
  }
  if (gameState.keys['a'] || gameState.keys['A']) {
    gameState.localPlayer.x = Math.max(GAME_CONFIG.PLAYER_RADIUS, gameState.localPlayer.x - speed);
  }
  if (gameState.keys['d'] || gameState.keys['D']) {
    gameState.localPlayer.x = Math.min(GAME_CONFIG.MAP_WIDTH - GAME_CONFIG.PLAYER_RADIUS, gameState.localPlayer.x + speed);
  }
}

// Update camera to follow local player
function updateCamera() {
  if (!gameState.localPlayer) return;

  gameState.camera.x = gameState.localPlayer.x - GAME_CONFIG.CANVAS_WIDTH / 2;
  gameState.camera.y = gameState.localPlayer.y - GAME_CONFIG.CANVAS_HEIGHT / 2;

  // Clamp camera to map bounds
  gameState.camera.x = Math.max(0, Math.min(gameState.camera.x, GAME_CONFIG.MAP_WIDTH - GAME_CONFIG.CANVAS_WIDTH));
  gameState.camera.y = Math.max(0, Math.min(gameState.camera.y, GAME_CONFIG.MAP_HEIGHT - GAME_CONFIG.CANVAS_HEIGHT));
}

// Main render loop
function gameLoop() {
  // Clear canvas
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

  // Draw ground
  drawGrassyGround();

  // Update local player
  updateLocalPlayer();
  updateCamera();

  // Draw all players
  if (gameState.localPlayer) {
    drawPlayer(gameState.localPlayer, true);
  }
  gameState.otherPlayers.forEach((player) => {
    drawPlayer(player, false);
  });

  // Draw debug info
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Position: ${gameState.localPlayer?.x.toFixed(0)}, ${gameState.localPlayer?.y.toFixed(0)}`, 10, 20);
  ctx.fillText(`Players: ${gameState.otherPlayers.size + 1}`, 10, 35);

  requestAnimationFrame(gameLoop);
}

// Keyboard input handlers
function setupKeyboardInput() {
  document.addEventListener('keydown', (e) => {
    gameState.keys[e.key] = true;
  });

  document.addEventListener('keyup', (e) => {
    gameState.keys[e.key] = false;
  });
}

// Initialize game
export function initializeGame() {
  if (!currentUser) {
    console.error('User not logged in!');
    return;
  }

  // Create local player
  gameState.localPlayer = {
    id: currentUser.id,
    username: currentUser.username,
    x: GAME_CONFIG.MAP_WIDTH / 2,
    y: GAME_CONFIG.MAP_HEIGHT / 2,
    radius: GAME_CONFIG.PLAYER_RADIUS
  };

  resizeCanvas();
  setupKeyboardInput();
  window.addEventListener('resize', resizeCanvas);

  console.log('🎮 Game initialized! Use WASD to move.');
  gameLoop();
}

export { gameState, GAME_CONFIG };