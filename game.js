// ===========================
// Moborr.io Game (Multiplayer 2D)
// ===========================

import { authToken, currentUser, BACKEND_URL } from './auth.js';

const GAME_CONFIG = {
  CANVAS_WIDTH: window.innerWidth,
  CANVAS_HEIGHT: window.innerHeight,
  MAP_WIDTH: 50000,
  MAP_HEIGHT: 50000,
  PLAYER_RADIUS: 25,
  GRASS_TILE_SIZE: 50
};

const MINIMAP_CONFIG = {
  WIDTH: 200,
  HEIGHT: 200,
  X: 10,
  Y: 10,
  SCALE: 0.004,
  GRASS_TILE_SIZE: 2 // Minimap tiles
};

let gameState = {
  localPlayer: null,
  otherPlayers: new Map(),
  camera: { x: 0, y: 0 },
  keys: {},
  ws: null,
  lastInputTime: 0,
  inputDelay: 50,
  selectedCharacter: null,
  velocity: { x: 0, y: 0 }, // Smooth movement velocity
  targetVelocity: { x: 0, y: 0 }, // Target velocity based on input
  acceleration: 0.5, // How quickly we reach target velocity
  friction: 0.92 // Smoothing factor
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  GAME_CONFIG.CANVAS_WIDTH = canvas.width;
  GAME_CONFIG.CANVAS_HEIGHT = canvas.height;
}

// Procedural grass texture using seeded random
function seededRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function getTerrainColor(x, y) {
  const tileX = x / GAME_CONFIG.GRASS_TILE_SIZE;
  const tileY = y / GAME_CONFIG.GRASS_TILE_SIZE;
  const seed = tileX * 73856093 ^ tileY * 19349663;
  const rand = seededRandom(seed);

  if (rand < 0.3) {
    return '#2d5016';
  } else if (rand < 0.6) {
    return '#3d6b1f';
  } else {
    return '#2f4a13';
  }
}

function drawGrassyGround() {
  const startX = Math.floor(gameState.camera.x / GAME_CONFIG.GRASS_TILE_SIZE) * GAME_CONFIG.GRASS_TILE_SIZE;
  const startY = Math.floor(gameState.camera.y / GAME_CONFIG.GRASS_TILE_SIZE) * GAME_CONFIG.GRASS_TILE_SIZE;

  for (let x = startX; x < gameState.camera.x + GAME_CONFIG.CANVAS_WIDTH; x += GAME_CONFIG.GRASS_TILE_SIZE) {
    for (let y = startY; y < gameState.camera.y + GAME_CONFIG.CANVAS_HEIGHT; y += GAME_CONFIG.GRASS_TILE_SIZE) {
      ctx.fillStyle = getTerrainColor(x, y);
      const screenX = x - gameState.camera.x;
      const screenY = y - gameState.camera.y;
      ctx.fillRect(screenX, screenY, GAME_CONFIG.GRASS_TILE_SIZE, GAME_CONFIG.GRASS_TILE_SIZE);

      // Add subtle grass texture details
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      const tileX = x / GAME_CONFIG.GRASS_TILE_SIZE;
      const tileY = y / GAME_CONFIG.GRASS_TILE_SIZE;
      const seed = tileX * 73856093 ^ tileY * 19349663;
      for (let i = 0; i < 3; i++) {
        const detailX = screenX + seededRandom(seed + i) * GAME_CONFIG.GRASS_TILE_SIZE;
        const detailY = screenY + seededRandom(seed + i + 100) * GAME_CONFIG.GRASS_TILE_SIZE;
        ctx.fillRect(detailX, detailY, 2, 2);
      }
    }
  }

  // Draw grid lines
  ctx.strokeStyle = 'rgba(0, 100, 0, 0.08)';
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

function drawPlayer(player, isLocal = false) {
  const screenX = player.x - gameState.camera.x;
  const screenY = player.y - gameState.camera.y;

  if (screenX < -GAME_CONFIG.PLAYER_RADIUS * 2 || screenX > GAME_CONFIG.CANVAS_WIDTH + GAME_CONFIG.PLAYER_RADIUS * 2 ||
      screenY < -GAME_CONFIG.PLAYER_RADIUS * 2 || screenY > GAME_CONFIG.CANVAS_HEIGHT + GAME_CONFIG.PLAYER_RADIUS * 2) {
    return;
  }

  // Player body
  ctx.fillStyle = isLocal ? '#22c55e' : '#16a34a';
  ctx.beginPath();
  ctx.arc(screenX, screenY, GAME_CONFIG.PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Eyes
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(screenX - 8, screenY - 5, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(screenX - 8, screenY - 5, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(screenX + 8, screenY - 5, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(screenX + 8, screenY - 5, 2, 0, Math.PI * 2);
  ctx.fill();

  // Character name label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(player.characterName || player.username, screenX, screenY - GAME_CONFIG.PLAYER_RADIUS - 10);

  // Local player indicator
  if (isLocal) {
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(screenX, screenY, GAME_CONFIG.PLAYER_RADIUS + 3, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawMinimap() {
  const minimapX = GAME_CONFIG.CANVAS_WIDTH - MINIMAP_CONFIG.WIDTH - 10;
  const minimapY = 10;

  // Draw minimap terrain
  const minimapStartX = Math.floor((minimapX * GAME_CONFIG.MAP_WIDTH / GAME_CONFIG.CANVAS_WIDTH) / (MINIMAP_CONFIG.GRASS_TILE_SIZE / MINIMAP_CONFIG.SCALE));
  const minimapStartY = Math.floor((minimapY * GAME_CONFIG.MAP_HEIGHT / GAME_CONFIG.CANVAS_HEIGHT) / (MINIMAP_CONFIG.GRASS_TILE_SIZE / MINIMAP_CONFIG.SCALE));

  for (let px = 0; px < MINIMAP_CONFIG.WIDTH; px += MINIMAP_CONFIG.GRASS_TILE_SIZE) {
    for (let py = 0; py < MINIMAP_CONFIG.HEIGHT; py += MINIMAP_CONFIG.GRASS_TILE_SIZE) {
      const worldX = (px / MINIMAP_CONFIG.WIDTH) * GAME_CONFIG.MAP_WIDTH;
      const worldY = (py / MINIMAP_CONFIG.HEIGHT) * GAME_CONFIG.MAP_HEIGHT;
      const color = getTerrainColor(worldX, worldY);

      ctx.fillStyle = color;
      ctx.fillRect(minimapX + px, minimapY + py, MINIMAP_CONFIG.GRASS_TILE_SIZE, MINIMAP_CONFIG.GRASS_TILE_SIZE);
    }
  }

  // Border
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 2;
  ctx.strokeRect(minimapX, minimapY, MINIMAP_CONFIG.WIDTH, MINIMAP_CONFIG.HEIGHT);

  // Draw viewport indicator (where player is looking)
  const viewportX = minimapX + (gameState.camera.x / GAME_CONFIG.MAP_WIDTH) * MINIMAP_CONFIG.WIDTH;
  const viewportY = minimapY + (gameState.camera.y / GAME_CONFIG.MAP_HEIGHT) * MINIMAP_CONFIG.HEIGHT;
  const viewportW = (GAME_CONFIG.CANVAS_WIDTH / GAME_CONFIG.MAP_WIDTH) * MINIMAP_CONFIG.WIDTH;
  const viewportH = (GAME_CONFIG.CANVAS_HEIGHT / GAME_CONFIG.MAP_HEIGHT) * MINIMAP_CONFIG.HEIGHT;

  ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(viewportX, viewportY, viewportW, viewportH);

  // Draw local player
  if (gameState.localPlayer) {
    const localX = minimapX + (gameState.localPlayer.x / GAME_CONFIG.MAP_WIDTH) * MINIMAP_CONFIG.WIDTH;
    const localY = minimapY + (gameState.localPlayer.y / GAME_CONFIG.MAP_HEIGHT) * MINIMAP_CONFIG.HEIGHT;

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(localX, localY, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw other players
  gameState.otherPlayers.forEach((player) => {
    const playerX = minimapX + (player.x / GAME_CONFIG.MAP_WIDTH) * MINIMAP_CONFIG.WIDTH;
    const playerY = minimapY + (player.y / GAME_CONFIG.MAP_HEIGHT) * MINIMAP_CONFIG.HEIGHT;

    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.arc(playerX, playerY, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function updateCamera() {
  if (!gameState.localPlayer) return;

  gameState.camera.x = gameState.localPlayer.x - GAME_CONFIG.CANVAS_WIDTH / 2;
  gameState.camera.y = gameState.localPlayer.y - GAME_CONFIG.CANVAS_HEIGHT / 2;

  gameState.camera.x = Math.max(0, Math.min(gameState.camera.x, GAME_CONFIG.MAP_WIDTH - GAME_CONFIG.CANVAS_WIDTH));
  gameState.camera.y = Math.max(0, Math.min(gameState.camera.y, GAME_CONFIG.MAP_HEIGHT - GAME_CONFIG.CANVAS_HEIGHT));
}

function updateLocalPlayerMovement() {
  if (!gameState.localPlayer) return;

  // Calculate target velocity based on input (slower speed)
  const speed = 3; // Reduced from 7 to 3
  gameState.targetVelocity.x = 0;
  gameState.targetVelocity.y = 0;

  if (gameState.keys['w'] || gameState.keys['W']) {
    gameState.targetVelocity.y -= speed;
  }
  if (gameState.keys['s'] || gameState.keys['S']) {
    gameState.targetVelocity.y += speed;
  }
  if (gameState.keys['a'] || gameState.keys['A']) {
    gameState.targetVelocity.x -= speed;
  }
  if (gameState.keys['d'] || gameState.keys['D']) {
    gameState.targetVelocity.x += speed;
  }

  // Smoothly interpolate velocity toward target
  gameState.velocity.x += (gameState.targetVelocity.x - gameState.velocity.x) * gameState.acceleration;
  gameState.velocity.y += (gameState.targetVelocity.y - gameState.velocity.y) * gameState.acceleration;

  // Apply friction to make movement feel smooth
  gameState.velocity.x *= gameState.friction;
  gameState.velocity.y *= gameState.friction;

  // Update position
  gameState.localPlayer.x += gameState.velocity.x;
  gameState.localPlayer.y += gameState.velocity.y;

  // Clamp to map bounds
  gameState.localPlayer.x = Math.max(GAME_CONFIG.PLAYER_RADIUS, Math.min(GAME_CONFIG.MAP_WIDTH - GAME_CONFIG.PLAYER_RADIUS, gameState.localPlayer.x));
  gameState.localPlayer.y = Math.max(GAME_CONFIG.PLAYER_RADIUS, Math.min(GAME_CONFIG.MAP_HEIGHT - GAME_CONFIG.PLAYER_RADIUS, gameState.localPlayer.y));
}

function sendInputToServer() {
  if (!gameState.ws || gameState.ws.readyState !== WebSocket.OPEN || !gameState.localPlayer) return;

  const now = Date.now();
  if (now - gameState.lastInputTime < gameState.inputDelay) return;

  const input = {
    type: 'move',
    w: gameState.keys['w'] || gameState.keys['W'],
    a: gameState.keys['a'] || gameState.keys['A'],
    s: gameState.keys['s'] || gameState.keys['S'],
    d: gameState.keys['d'] || gameState.keys['D']
  };

  gameState.ws.send(JSON.stringify(input));
  gameState.lastInputTime = now;
}

function gameLoop() {
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

  drawGrassyGround();
  updateLocalPlayerMovement();
  updateCamera();

  if (gameState.localPlayer) {
    drawPlayer(gameState.localPlayer, true);
  }
  gameState.otherPlayers.forEach((player) => {
    drawPlayer(player, false);
  });

  // Draw minimap
  drawMinimap();

  requestAnimationFrame(gameLoop);
}

function setupKeyboardInput() {
  document.addEventListener('keydown', (e) => {
    gameState.keys[e.key] = true;
  });

  document.addEventListener('keyup', (e) => {
    gameState.keys[e.key] = false;
  });
}

function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = BACKEND_URL.replace('https://', '').replace('http://', '');
  const wsURL = `${protocol}//${host}`;

  console.log(`Connecting to WebSocket: ${wsURL}`);

  gameState.ws = new WebSocket(wsURL);

  gameState.ws.onopen = () => {
    console.log('🟢 Connected to game server');
    gameState.ws.send(JSON.stringify({
      type: 'join',
      token: authToken,
      username: currentUser.username,
      characterName: gameState.selectedCharacter?.name || currentUser.username,
      avatar: gameState.selectedCharacter?.avatar || currentUser.avatar
    }));
  };

  gameState.ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);

      if (message.type === 'playerJoined') {
        gameState.otherPlayers.set(message.playerId, {
          id: message.playerId,
          username: message.username,
          characterName: message.characterName,
          x: message.x,
          y: message.y,
          avatar: message.avatar
        });
      } else if (message.type === 'playerLeft') {
        gameState.otherPlayers.delete(message.playerId);
      } else if (message.type === 'playerUpdate') {
        if (Array.isArray(message.players)) {
          message.players.forEach((p) => {
            if (p.id === currentUser.id) {
              if (gameState.localPlayer) {
                gameState.localPlayer.x = p.x;
                gameState.localPlayer.y = p.y;
              }
            } else {
              const existing = gameState.otherPlayers.get(p.id);
              if (existing) {
                existing.x = p.x;
                existing.y = p.y;
              } else {
                gameState.otherPlayers.set(p.id, {
                  id: p.id,
                  username: p.username,
                  characterName: p.characterName,
                  x: p.x,
                  y: p.y,
                  avatar: p.avatar
                });
              }
            }
          });
        }
      } else if (message.type === 'gameState') {
        gameState.localPlayer = {
          id: message.you.id,
          username: message.you.username,
          characterName: message.you.characterName,
          x: message.you.x,
          y: message.you.y,
          avatar: message.you.avatar
        };

        gameState.otherPlayers.clear();
        message.players.forEach((player) => {
          if (player.id !== currentUser.id) {
            gameState.otherPlayers.set(player.id, {
              id: player.id,
              username: player.username,
              characterName: player.characterName,
              x: player.x,
              y: player.y,
              avatar: player.avatar
            });
          }
        });
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  };

  gameState.ws.onerror = (error) => {
    console.error('🔴 WebSocket error:', error);
  };

  gameState.ws.onclose = () => {
    console.log('🔴 Disconnected from game server');
    setTimeout(connectWebSocket, 3000);
  };
}

export function initializeGame() {
  const selectedChar = localStorage.getItem('moborr_selected_character');
  if (!selectedChar) {
    window.location.href = './index.html';
    return;
  }

  gameState.selectedCharacter = JSON.parse(selectedChar);

  resizeCanvas();
  setupKeyboardInput();
  window.addEventListener('resize', resizeCanvas);

  connectWebSocket();
  setInterval(sendInputToServer, gameState.inputDelay);

  console.log('🎮 Game initialized!');
  gameLoop();
}

export { gameState, GAME_CONFIG };
