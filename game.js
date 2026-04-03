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
  GRASS_TILE_SIZE: 128
};

const MINIMAP_CONFIG = {
  WIDTH: 200,
  HEIGHT: 200,
  X: 10,
  Y: 10,
  SCALE: 0.004,
  GRASS_TILE_SIZE: 2
};

// Movement smoothing constants
const MOVEMENT_CONFIG = {
  MAX_SPEED: 200,
  ACCELERATION: 0.15,
  DECELERATION: 0.25,
  FRICTION: 0.92
};

// Castle configuration
const CASTLE_CONFIG = {
  CENTER_X: 25000,
  CENTER_Y: 25000,
  CASTLE_SIZE: 800, // Width/height of castle
  TOWER_SIZE: 150, // Size of each tower
  WALL_THICKNESS: 40,
  INNER_RADIUS: 400 // Radius to determine if player is inside
};

let gameState = {
  localPlayer: null,
  otherPlayers: new Map(),
  camera: { x: 0, y: 0 },
  keys: {},
  ws: null,
  lastInputTime: 0,
  inputDelay: 33,
  selectedCharacter: null,
  velocity: { x: 0, y: 0 },
  targetVelocity: { x: 0, y: 0 },
  groundTexture: null,
  lastFrameTime: Date.now(),
  deltaTime: 0,
  isPlayerInCastle: false
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  GAME_CONFIG.CANVAS_WIDTH = canvas.width;
  GAME_CONFIG.CANVAS_HEIGHT = canvas.height;
}

// Load ground texture
function loadGroundTexture() {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      gameState.groundTexture = img;
      console.log('✅ Ground texture loaded');
      resolve(img);
    };
    img.onerror = () => {
      console.warn('Failed to load ground texture, will use fallback');
      resolve(null);
    };
    img.src = './assets/ground-texture.png';
  });
}

// Check if player is inside castle
function isPlayerInsideCastle(x, y) {
  const dx = x - CASTLE_CONFIG.CENTER_X;
  const dy = y - CASTLE_CONFIG.CENTER_Y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < CASTLE_CONFIG.INNER_RADIUS;
}

// Draw ground using texture
function drawGrassyGround() {
  if (gameState.groundTexture) {
    const pattern = ctx.createPattern(gameState.groundTexture, 'repeat');
    ctx.save();
    ctx.translate(-gameState.camera.x, -gameState.camera.y);
    ctx.fillStyle = pattern;
    ctx.fillRect(gameState.camera.x, gameState.camera.y, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
    ctx.restore();
  } else {
    ctx.fillStyle = '#26a55f';
    ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
  }
}

// Draw castle interior (wood floor, viewed from above inside)
function drawCastleInterior() {
  const castleScreenX = CASTLE_CONFIG.CENTER_X - gameState.camera.x;
  const castleScreenY = CASTLE_CONFIG.CENTER_Y - gameState.camera.y;
  
  // Wood floor with planks
  ctx.fillStyle = '#8B6F47';
  ctx.beginPath();
  ctx.arc(castleScreenX, castleScreenY, CASTLE_CONFIG.INNER_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  
  // Add wood plank details
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.lineWidth = 2;
  for (let i = -CASTLE_CONFIG.INNER_RADIUS; i < CASTLE_CONFIG.INNER_RADIUS; i += 30) {
    ctx.beginPath();
    ctx.moveTo(castleScreenX + i, castleScreenY - CASTLE_CONFIG.INNER_RADIUS);
    ctx.lineTo(castleScreenX + i, castleScreenY + CASTLE_CONFIG.INNER_RADIUS);
    ctx.stroke();
  }
  
  // Inner circle highlight (roof edges visible from inside)
  ctx.strokeStyle = 'rgba(139, 111, 71, 0.6)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(castleScreenX, castleScreenY, CASTLE_CONFIG.INNER_RADIUS - 10, 0, Math.PI * 2);
  ctx.stroke();
}

// Draw castle exterior (proper castle with towers)
function drawCastleExterior() {
  const castleScreenX = CASTLE_CONFIG.CENTER_X - gameState.camera.x;
  const castleScreenY = CASTLE_CONFIG.CENTER_Y - gameState.camera.y;
  const halfSize = CASTLE_CONFIG.CASTLE_SIZE / 2;
  
  // Draw 4 towers at corners
  const towers = [
    { x: -halfSize, y: -halfSize }, // Top-left
    { x: halfSize, y: -halfSize },  // Top-right
    { x: halfSize, y: halfSize },   // Bottom-right
    { x: -halfSize, y: halfSize }   // Bottom-left
  ];
  
  towers.forEach((tower) => {
    drawTower(
      castleScreenX + tower.x,
      castleScreenY + tower.y
    );
  });
  
  // Draw castle walls between towers
  ctx.fillStyle = '#A0826D';
  ctx.strokeStyle = '#6B5D52';
  ctx.lineWidth = 2;
  
  // Top wall
  ctx.fillRect(
    castleScreenX - halfSize + CASTLE_CONFIG.TOWER_SIZE,
    castleScreenY - halfSize,
    CASTLE_CONFIG.CASTLE_SIZE - CASTLE_CONFIG.TOWER_SIZE * 2,
    CASTLE_CONFIG.WALL_THICKNESS
  );
  ctx.strokeRect(
    castleScreenX - halfSize + CASTLE_CONFIG.TOWER_SIZE,
    castleScreenY - halfSize,
    CASTLE_CONFIG.CASTLE_SIZE - CASTLE_CONFIG.TOWER_SIZE * 2,
    CASTLE_CONFIG.WALL_THICKNESS
  );
  
  // Bottom wall
  ctx.fillRect(
    castleScreenX - halfSize + CASTLE_CONFIG.TOWER_SIZE,
    castleScreenY + halfSize - CASTLE_CONFIG.WALL_THICKNESS,
    CASTLE_CONFIG.CASTLE_SIZE - CASTLE_CONFIG.TOWER_SIZE * 2,
    CASTLE_CONFIG.WALL_THICKNESS
  );
  ctx.strokeRect(
    castleScreenX - halfSize + CASTLE_CONFIG.TOWER_SIZE,
    castleScreenY + halfSize - CASTLE_CONFIG.WALL_THICKNESS,
    CASTLE_CONFIG.CASTLE_SIZE - CASTLE_CONFIG.TOWER_SIZE * 2,
    CASTLE_CONFIG.WALL_THICKNESS
  );
  
  // Left wall
  ctx.fillRect(
    castleScreenX - halfSize,
    castleScreenY - halfSize + CASTLE_CONFIG.TOWER_SIZE,
    CASTLE_CONFIG.WALL_THICKNESS,
    CASTLE_CONFIG.CASTLE_SIZE - CASTLE_CONFIG.TOWER_SIZE * 2
  );
  ctx.strokeRect(
    castleScreenX - halfSize,
    castleScreenY - halfSize + CASTLE_CONFIG.TOWER_SIZE,
    CASTLE_CONFIG.WALL_THICKNESS,
    CASTLE_CONFIG.CASTLE_SIZE - CASTLE_CONFIG.TOWER_SIZE * 2
  );
  
  // Right wall
  ctx.fillRect(
    castleScreenX + halfSize - CASTLE_CONFIG.WALL_THICKNESS,
    castleScreenY - halfSize + CASTLE_CONFIG.TOWER_SIZE,
    CASTLE_CONFIG.WALL_THICKNESS,
    CASTLE_CONFIG.CASTLE_SIZE - CASTLE_CONFIG.TOWER_SIZE * 2
  );
  ctx.strokeRect(
    castleScreenX + halfSize - CASTLE_CONFIG.WALL_THICKNESS,
    castleScreenY - halfSize + CASTLE_CONFIG.TOWER_SIZE,
    CASTLE_CONFIG.WALL_THICKNESS,
    CASTLE_CONFIG.CASTLE_SIZE - CASTLE_CONFIG.TOWER_SIZE * 2
  );
}

// Draw a single tower (pointed roof visible from outside, wood floor from inside)
function drawTower(screenX, screenY) {
  const towerSize = CASTLE_CONFIG.TOWER_SIZE;
  
  // Tower base (stone)
  ctx.fillStyle = '#8B7355';
  ctx.fillRect(
    screenX - towerSize / 2,
    screenY - towerSize / 2,
    towerSize,
    towerSize
  );
  
  // Tower outline
  ctx.strokeStyle = '#5C4A42';
  ctx.lineWidth = 2;
  ctx.strokeRect(
    screenX - towerSize / 2,
    screenY - towerSize / 2,
    towerSize,
    towerSize
  );
  
  // Pointed roof (always visible, points upward)
  ctx.fillStyle = '#CD5C5C';
  ctx.beginPath();
  ctx.moveTo(screenX - towerSize / 2, screenY - towerSize / 2); // Top-left
  ctx.lineTo(screenX + towerSize / 2, screenY - towerSize / 2); // Top-right
  ctx.lineTo(screenX, screenY - towerSize); // Peak point
  ctx.closePath();
  ctx.fill();
  
  // Roof outline
  ctx.strokeStyle = '#8B3A3A';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  // Add some castle details (crenellations)
  const crenelSize = towerSize / 5;
  ctx.fillStyle = '#5C4A42';
  ctx.fillRect(screenX - towerSize / 2, screenY - towerSize / 2 - crenelSize, crenelSize, crenelSize);
  ctx.fillRect(screenX + towerSize / 2 - crenelSize, screenY - towerSize / 2 - crenelSize, crenelSize, crenelSize);
}

// Draw player character (top-down with wizard hat)
function drawPlayerCharacter(screenX, screenY, isLocal = false) {
  const radius = GAME_CONFIG.PLAYER_RADIUS;
  
  // Draw left arm
  ctx.fillStyle = isLocal ? '#86efac' : '#4ade80';
  ctx.beginPath();
  ctx.ellipse(screenX - radius * 0.75, screenY, radius * 0.5, radius * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  // Draw right arm
  ctx.fillStyle = isLocal ? '#86efac' : '#4ade80';
  ctx.beginPath();
  ctx.ellipse(screenX + radius * 0.75, screenY, radius * 0.5, radius * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  // Draw main circle head
  ctx.fillStyle = isLocal ? '#22c55e' : '#16a34a';
  ctx.beginPath();
  ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Draw wizard hat brim
  ctx.fillStyle = '#6366f1';
  ctx.beginPath();
  ctx.ellipse(screenX, screenY - radius * 0.95, radius * 0.65, radius * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.strokeStyle = '#4f46e5';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  // Hat point (cone)
  ctx.fillStyle = '#6366f1';
  ctx.beginPath();
  ctx.moveTo(screenX - radius * 0.6, screenY - radius * 0.95);
  ctx.lineTo(screenX + radius * 0.6, screenY - radius * 0.95);
  ctx.lineTo(screenX, screenY - radius * 1.7);
  ctx.closePath();
  ctx.fill();
  
  ctx.strokeStyle = '#4f46e5';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  // Hat band
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.ellipse(screenX, screenY - radius * 0.95, radius * 0.65, radius * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Hat star
  const starX = screenX;
  const starY = screenY - radius * 1.4;
  const starSize = radius * 0.15;
  drawStar(starX, starY, 5, starSize, starSize * 0.5, '#fbbf24');
}

// Helper function to draw a star
function drawStar(cx, cy, spikes, outerRadius, innerRadius, color) {
  let rot = Math.PI / 2 * 3;
  let step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
    rot += step;

    ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

function drawPlayer(player, isLocal = false) {
  const screenX = player.x - gameState.camera.x;
  const screenY = player.y - gameState.camera.y;

  if (screenX < -GAME_CONFIG.PLAYER_RADIUS * 3 || screenX > GAME_CONFIG.CANVAS_WIDTH + GAME_CONFIG.PLAYER_RADIUS * 3 ||
      screenY < -GAME_CONFIG.PLAYER_RADIUS * 3 || screenY > GAME_CONFIG.CANVAS_HEIGHT + GAME_CONFIG.PLAYER_RADIUS * 3) {
    return;
  }

  drawPlayerCharacter(screenX, screenY, isLocal);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(player.characterName || player.username, screenX, screenY - GAME_CONFIG.PLAYER_RADIUS - 25);

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

  ctx.fillStyle = '#404040';
  ctx.fillRect(minimapX, minimapY, MINIMAP_CONFIG.WIDTH, MINIMAP_CONFIG.HEIGHT);

  // Draw castle on minimap
  const castleMinimapX = minimapX + (CASTLE_CONFIG.CENTER_X / GAME_CONFIG.MAP_WIDTH) * MINIMAP_CONFIG.WIDTH;
  const castleMinimapY = minimapY + (CASTLE_CONFIG.CENTER_Y / GAME_CONFIG.MAP_HEIGHT) * MINIMAP_CONFIG.HEIGHT;
  const castleMinimapSize = (CASTLE_CONFIG.CASTLE_SIZE / GAME_CONFIG.MAP_WIDTH) * MINIMAP_CONFIG.WIDTH;
  
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(
    castleMinimapX - castleMinimapSize / 2,
    castleMinimapY - castleMinimapSize / 2,
    castleMinimapSize,
    castleMinimapSize
  );

  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 2;
  ctx.strokeRect(minimapX, minimapY, MINIMAP_CONFIG.WIDTH, MINIMAP_CONFIG.HEIGHT);

  const viewportX = minimapX + (gameState.camera.x / GAME_CONFIG.MAP_WIDTH) * MINIMAP_CONFIG.WIDTH;
  const viewportY = minimapY + (gameState.camera.y / GAME_CONFIG.MAP_HEIGHT) * MINIMAP_CONFIG.HEIGHT;
  const viewportW = (GAME_CONFIG.CANVAS_WIDTH / GAME_CONFIG.MAP_WIDTH) * MINIMAP_CONFIG.WIDTH;
  const viewportH = (GAME_CONFIG.CANVAS_HEIGHT / GAME_CONFIG.MAP_HEIGHT) * MINIMAP_CONFIG.HEIGHT;

  ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(viewportX, viewportY, viewportW, viewportH);

  if (gameState.localPlayer) {
    const localX = minimapX + (gameState.localPlayer.x / GAME_CONFIG.MAP_WIDTH) * MINIMAP_CONFIG.WIDTH;
    const localY = minimapY + (gameState.localPlayer.y / GAME_CONFIG.MAP_HEIGHT) * MINIMAP_CONFIG.HEIGHT;

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(localX, localY, 3, 0, Math.PI * 2);
    ctx.fill();
  }

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

function updateLocalPlayerMovement(deltaTime) {
  if (!gameState.localPlayer) return;

  // Calculate target velocity based on input
  gameState.targetVelocity.x = 0;
  gameState.targetVelocity.y = 0;

  if (gameState.keys['w'] || gameState.keys['W']) {
    gameState.targetVelocity.y -= MOVEMENT_CONFIG.MAX_SPEED;
  }
  if (gameState.keys['s'] || gameState.keys['S']) {
    gameState.targetVelocity.y += MOVEMENT_CONFIG.MAX_SPEED;
  }
  if (gameState.keys['a'] || gameState.keys['A']) {
    gameState.targetVelocity.x -= MOVEMENT_CONFIG.MAX_SPEED;
  }
  if (gameState.keys['d'] || gameState.keys['D']) {
    gameState.targetVelocity.x += MOVEMENT_CONFIG.MAX_SPEED;
  }

  // Normalize diagonal movement
  const targetMagnitude = Math.sqrt(gameState.targetVelocity.x ** 2 + gameState.targetVelocity.y ** 2);
  if (targetMagnitude > MOVEMENT_CONFIG.MAX_SPEED) {
    gameState.targetVelocity.x = (gameState.targetVelocity.x / targetMagnitude) * MOVEMENT_CONFIG.MAX_SPEED;
    gameState.targetVelocity.y = (gameState.targetVelocity.y / targetMagnitude) * MOVEMENT_CONFIG.MAX_SPEED;
  }

  // Smooth acceleration/deceleration
  const isMoving = gameState.targetVelocity.x !== 0 || gameState.targetVelocity.y !== 0;
  const accel = isMoving ? MOVEMENT_CONFIG.ACCELERATION : MOVEMENT_CONFIG.DECELERATION;

  gameState.velocity.x += (gameState.targetVelocity.x - gameState.velocity.x) * accel;
  gameState.velocity.y += (gameState.targetVelocity.y - gameState.velocity.y) * accel;

  // Apply friction for smooth gliding
  gameState.velocity.x *= MOVEMENT_CONFIG.FRICTION;
  gameState.velocity.y *= MOVEMENT_CONFIG.FRICTION;

  // Stop if velocity is very small
  if (Math.abs(gameState.velocity.x) < 0.5) gameState.velocity.x = 0;
  if (Math.abs(gameState.velocity.y) < 0.5) gameState.velocity.y = 0;

  // Update position based on deltaTime for frame-rate independent movement
  gameState.localPlayer.x += gameState.velocity.x * (deltaTime / 1000);
  gameState.localPlayer.y += gameState.velocity.y * (deltaTime / 1000);

  // Clamp to map bounds
  gameState.localPlayer.x = Math.max(GAME_CONFIG.PLAYER_RADIUS, Math.min(GAME_CONFIG.MAP_WIDTH - GAME_CONFIG.PLAYER_RADIUS, gameState.localPlayer.x));
  gameState.localPlayer.y = Math.max(GAME_CONFIG.PLAYER_RADIUS, Math.min(GAME_CONFIG.MAP_HEIGHT - GAME_CONFIG.PLAYER_RADIUS, gameState.localPlayer.y));

  // Update castle inside/outside state
  gameState.isPlayerInCastle = isPlayerInsideCastle(gameState.localPlayer.x, gameState.localPlayer.y);
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
    d: gameState.keys['d'] || gameState.keys['D'],
    x: gameState.localPlayer.x,
    y: gameState.localPlayer.y
  };

  gameState.ws.send(JSON.stringify(input));
  gameState.lastInputTime = now;
}

function gameLoop() {
  const now = Date.now();
  gameState.deltaTime = now - gameState.lastFrameTime;
  gameState.lastFrameTime = now;

  const dt = Math.min(gameState.deltaTime, 50);

  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

  drawGrassyGround();
  updateLocalPlayerMovement(dt);
  updateCamera();

  // Draw castle (exterior or interior based on player position)
  if (gameState.isPlayerInCastle) {
    drawCastleInterior();
  } else {
    drawCastleExterior();
  }

  if (gameState.localPlayer) {
    drawPlayer(gameState.localPlayer, true);
  }
  gameState.otherPlayers.forEach((player) => {
    drawPlayer(player, false);
  });

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

export async function initializeGame() {
  const selectedChar = localStorage.getItem('moborr_selected_character');
  if (!selectedChar) {
    window.location.href = './index.html';
    return;
  }

  gameState.selectedCharacter = JSON.parse(selectedChar);

  await loadGroundTexture();

  resizeCanvas();
  setupKeyboardInput();
  window.addEventListener('resize', resizeCanvas);

  connectWebSocket();
  setInterval(sendInputToServer, gameState.inputDelay);

  console.log('🎮 Game initialized!');
  gameLoop();
}

export { gameState, GAME_CONFIG };
