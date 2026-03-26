// Updated game.js - for combined server

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
  ws: null,
  lastInputTime: 0,
  inputDelay: 50
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  GAME_CONFIG.CANVAS_WIDTH = canvas.width;
  GAME_CONFIG.CANVAS_HEIGHT = canvas.height;
}

function drawGrassyGround() {
  const startX = Math.floor(gameState.camera.x / GAME_CONFIG.GRASS_TILE_SIZE) * GAME_CONFIG.GRASS_TILE_SIZE;
  const startY = Math.floor(gameState.camera.y / GAME_CONFIG.GRASS_TILE_SIZE) * GAME_CONFIG.GRASS_TILE_SIZE;

  for (let x = startX; x < gameState.camera.x + GAME_CONFIG.CANVAS_WIDTH; x += GAME_CONFIG.GRASS_TILE_SIZE) {
    for (let y = startY; y < gameState.camera.y + GAME_CONFIG.CANVAS_HEIGHT; y += GAME_CONFIG.GRASS_TILE_SIZE) {
      const isEvenX = Math.floor(x / GAME_CONFIG.GRASS_TILE_SIZE) % 2 === 0;
      const isEvenY = Math.floor(y / GAME_CONFIG.GRASS_TILE_SIZE) % 2 === 0;
      
      if (isEvenX === isEvenY) {
        ctx.fillStyle = '#2d5016';
      } else {
        ctx.fillStyle = '#3d6b1f';
      }

      const screenX = x - gameState.camera.x;
      const screenY = y - gameState.camera.y;
      ctx.fillRect(screenX, screenY, GAME_CONFIG.GRASS_TILE_SIZE, GAME_CONFIG.GRASS_TILE_SIZE);
    }
  }

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

function drawPlayer(player, isLocal = false) {
  const screenX = player.x - gameState.camera.x;
  const screenY = player.y - gameState.camera.y;

  if (screenX < -GAME_CONFIG.PLAYER_RADIUS * 2 || screenX > GAME_CONFIG.CANVAS_WIDTH + GAME_CONFIG.PLAYER_RADIUS * 2 ||
      screenY < -GAME_CONFIG.PLAYER_RADIUS * 2 || screenY > GAME_CONFIG.CANVAS_HEIGHT + GAME_CONFIG.PLAYER_RADIUS * 2) {
    return;
  }

  ctx.fillStyle = '#4a90e2';
  ctx.beginPath();
  ctx.arc(screenX, screenY, GAME_CONFIG.PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#2e5c8a';
  ctx.lineWidth = 2;
  ctx.stroke();

  const starRadius = GAME_CONFIG.PLAYER_RADIUS + 8;
  ctx.fillStyle = '#ffeb3b';
  for (let i = 0; i < GAME_CONFIG.STAR_COUNT; i++) {
    const angle = (i / GAME_CONFIG.STAR_COUNT) * Math.PI * 2;
    const x = screenX + Math.cos(angle) * starRadius;
    const y = screenY + Math.sin(angle) * starRadius;
    drawStar(x, y, 5, 4);
  }

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

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(screenX, screenY + 3, 8, 0, Math.PI);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(player.username, screenX, screenY - GAME_CONFIG.PLAYER_RADIUS - 10);

  if (isLocal) {
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(screenX, screenY, GAME_CONFIG.PLAYER_RADIUS + 3, 0, Math.PI * 2);
    ctx.stroke();
  }
}

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

function updateCamera() {
  if (!gameState.localPlayer) return;

  gameState.camera.x = gameState.localPlayer.x - GAME_CONFIG.CANVAS_WIDTH / 2;
  gameState.camera.y = gameState.localPlayer.y - GAME_CONFIG.CANVAS_HEIGHT / 2;

  gameState.camera.x = Math.max(0, Math.min(gameState.camera.x, GAME_CONFIG.MAP_WIDTH - GAME_CONFIG.CANVAS_WIDTH));
  gameState.camera.y = Math.max(0, Math.min(gameState.camera.y, GAME_CONFIG.MAP_HEIGHT - GAME_CONFIG.CANVAS_HEIGHT));
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
  updateCamera();

  if (gameState.localPlayer) {
    drawPlayer(gameState.localPlayer, true);
  }
  gameState.otherPlayers.forEach((player) => {
    drawPlayer(player, false);
  });

  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Position: ${gameState.localPlayer?.x.toFixed(0)}, ${gameState.localPlayer?.y.toFixed(0)}`, 10, 20);
  ctx.fillText(`Players: ${gameState.otherPlayers.size + 1}`, 10, 35);
  ctx.fillText(`WS: ${gameState.ws?.readyState === WebSocket.OPEN ? '🟢' : '🔴'}`, 10, 50);

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
  // For production, detect from window.location
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host; // This will be your Render URL
  const wsURL = `${protocol}//${host}`;

  console.log(`Connecting to WebSocket: ${wsURL}`);

  gameState.ws = new WebSocket(wsURL);

  gameState.ws.onopen = () => {
    console.log('🟢 Connected to game server');
    gameState.ws.send(JSON.stringify({
      type: 'join',
      token: authToken,
      username: currentUser.username
    }));
  };

  gameState.ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);

      if (message.type === 'playerJoined') {
        gameState.otherPlayers.set(message.playerId, {
          id: message.playerId,
          username: message.username,
          x: message.x,
          y: message.y,
          radius: GAME_CONFIG.PLAYER_RADIUS
        });
      } else if (message.type === 'playerLeft') {
        gameState.otherPlayers.delete(message.playerId);
      } else if (message.type === 'playerUpdate') {
        if (message.playerId === currentUser.id) {
          gameState.localPlayer.x = message.x;
          gameState.localPlayer.y = message.y;
        } else {
          const player = gameState.otherPlayers.get(message.playerId);
          if (player) {
            player.x = message.x;
            player.y = message.y;
          }
        }
      } else if (message.type === 'gameState') {
        gameState.localPlayer = {
          id: message.you.id,
          username: message.you.username,
          x: message.you.x,
          y: message.you.y,
          radius: GAME_CONFIG.PLAYER_RADIUS
        };

        gameState.otherPlayers.clear();
        message.players.forEach((player) => {
          if (player.id !== currentUser.id) {
            gameState.otherPlayers.set(player.id, {
              id: player.id,
              username: player.username,
              x: player.x,
              y: player.y,
              radius: GAME_CONFIG.PLAYER_RADIUS
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
  if (!currentUser) {
    console.error('User not logged in!');
    return;
  }

  resizeCanvas();
  setupKeyboardInput();
  window.addEventListener('resize', resizeCanvas);

  connectWebSocket();

  setInterval(sendInputToServer, gameState.inputDelay);

  console.log('🎮 Game initialized! Connecting to server...');
  gameLoop();
}

export { gameState, GAME_CONFIG };
