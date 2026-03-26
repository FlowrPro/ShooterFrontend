// ===========================
// Moborr.io Game Engine
// Three.js FPS Implementation
// ===========================

const THREE = window.THREE;

// Load Three.js from CDN if not already loaded
if (!THREE) {
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  script.async = true;
  document.head.appendChild(script);
}

const PointerLockControls = (function() {
  class PointerLockControls {
    constructor(camera, domElement) {
      this.camera = camera;
      this.domElement = domElement;
      this.isLocked = false;

      const euler = new THREE.Euler(0, 0, 0, 'YXZ');
      const PI_2 = Math.PI / 2;

      const changeEvent = { type: 'change' };
      const lockEvent = { type: 'lock' };
      const unlockEvent = { type: 'unlock' };

      const onMouseMove = (event) => {
        if (!this.isLocked) return;

        const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        euler.setFromQuaternion(camera.quaternion);
        euler.rotateY(-movementX * 0.002);
        euler.rotateX(-movementY * 0.002);
        euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));
        camera.quaternion.setFromEuler(euler);

        this.dispatchEvent(changeEvent);
      };

      const onPointerlockChange = () => {
        if (document.pointerLockElement === domElement) {
          this.isLocked = true;
          this.dispatchEvent(lockEvent);
        } else {
          this.isLocked = false;
          this.dispatchEvent(unlockEvent);
        }
      };

      const onPointerlockError = () => {
        console.error('PointerLock error');
      };

      this.connect = function() {
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('pointerlockchange', onPointerlockChange);
        document.addEventListener('pointerlockerror', onPointerlockError);
      };

      this.disconnect = function() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('pointerlockchange', onPointerlockChange);
        document.removeEventListener('pointerlockerror', onPointerlockError);
      };

      this.dispose = function() {
        this.disconnect();
      };

      this.getObject = function() {
        return camera;
      };

      this.lock = function() {
        domElement.requestPointerLock = domElement.requestPointerLock || domElement.mozRequestPointerLock || domElement.webkitRequestPointerLock;
        if (domElement.requestPointerLock) {
          domElement.requestPointerLock();
        }
      };

      this.unlock = function() {
        document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;
        if (document.exitPointerLock) {
          document.exitPointerLock();
        }
      };

      this.connect();

      this._listeners = {};
    }

    addEventListener(type, listener) {
      if (!this._listeners[type]) this._listeners[type] = [];
      this._listeners[type].push(listener);
    }

    removeEventListener(type, listener) {
      if (this._listeners[type]) {
        const index = this._listeners[type].indexOf(listener);
        if (index > -1) this._listeners[type].splice(index, 1);
      }
    }

    dispatchEvent(event) {
      if (this._listeners[event.type]) {
        this._listeners[event.type].forEach(listener => listener(event));
      }
    }

    moveForward(distance) {
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(this.camera.quaternion);
      this.camera.position.addScaledVector(direction, distance);
    }

    moveRight(distance) {
      const direction = new THREE.Vector3(1, 0, 0);
      direction.applyQuaternion(this.camera.quaternion);
      this.camera.position.addScaledVector(direction, distance);
    }
  }

  return PointerLockControls;
})();

const BACKEND_URL = 'https://moborr-backend.onrender.com';

// Game state
let gameState = {
  isInGame: false,
  matchId: null,
  playerId: null,
  authToken: null,
  region: 'north-america',
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  gameInstance: null
};

// ============================================
// GAME ENGINE CLASS
// ============================================

class FPSGame {
  constructor(canvas, token, region) {
    this.canvas = canvas;
    this.token = token;
    this.region = region;
    this.matchId = null;
    this.playerId = null;
    this.localPlayer = null;
    this.remotePlayers = new Map();
    this.bullets = [];
    this.gameTime = 0;
    this.matchDuration = 5 * 60; // 5 minutes in seconds
    this.isRunning = false;

    // Input state
    this.input = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      crouch: false,
      shoot: false,
      scope: false
    };

    // Weapon state
    this.weapon = {
      name: 'assault-rifle',
      ammo: 30,
      maxAmmo: 30,
      fireRate: 100, // ms between shots
      damage: 20,
      lastShotTime: 0,
      isScoped: false
    };

    this.setupScene();
    this.setupControls();
    this.setupInput();
    this.setupUI();
  }

  setupScene() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.Fog(0x1a1a2e, 100, 1000);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 1.6, 0);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x2d3561 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Spawn a few cubes as obstacles
    this.createObstacles();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  createObstacles() {
    const obstacles = [
      { pos: [0, 0, -20], scale: [10, 10, 10] },
      { pos: [30, 0, -30], scale: [8, 8, 8] },
      { pos: [-30, 0, -30], scale: [8, 8, 8] },
      { pos: [20, 0, 20], scale: [6, 6, 6] },
      { pos: [-20, 0, 20], scale: [6, 6, 6] }
    ];

    obstacles.forEach(obs => {
      const geometry = new THREE.BoxGeometry(...obs.scale);
      const material = new THREE.MeshStandardMaterial({ color: 0x7c3aed });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...obs.pos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    });
  }

  setupControls() {
    this.controls = new PointerLockControls(this.camera, document.body);
    this.scene.add(this.controls.getObject());
  }

  setupInput() {
    // Keyboard input
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));

    // Mouse input
    document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    document.addEventListener('mouseup', (e) => this.handleMouseUp(e));

    // Prevent context menu on right click
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    // Click to lock pointer
    document.addEventListener('click', () => {
      this.controls.lock();
    });

    // Pointer lock change
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement === document.body) {
        console.log('Pointer locked');
      } else {
        console.log('Pointer unlocked');
      }
    });
  }

  handleKeyDown(e) {
    const key = e.key.toLowerCase();
    if (key === 'w') this.input.forward = true;
    if (key === 'a') this.input.left = true;
    if (key === 's') this.input.backward = true;
    if (key === 'd') this.input.right = true;
    if (key === ' ') {
      this.input.jump = true;
      e.preventDefault();
    }
    if (key === 'shift') this.input.crouch = true;
  }

  handleKeyUp(e) {
    const key = e.key.toLowerCase();
    if (key === 'w') this.input.forward = false;
    if (key === 'a') this.input.left = false;
    if (key === 's') this.input.backward = false;
    if (key === 'd') this.input.right = false;
    if (key === ' ') this.input.jump = false;
    if (key === 'shift') this.input.crouch = false;
  }

  handleMouseDown(e) {
    if (e.button === 0) this.input.shoot = true;
    if (e.button === 2) this.input.scope = true;
  }

  handleMouseUp(e) {
    if (e.button === 0) this.input.shoot = false;
    if (e.button === 2) this.input.scope = false;
  }

  setupUI() {
    // Create UI canvas overlay
    const uiContainer = document.createElement('div');
    uiContainer.id = 'gameUI';
    uiContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 100;
      font-family: 'Orbitron', monospace;
      color: #00ff00;
    `;

    // Crosshair
    const crosshair = document.createElement('div');
    crosshair.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 20px;
      height: 20px;
      border: 2px solid #00ff00;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
      pointer-events: none;
    `;
    uiContainer.appendChild(crosshair);

    // HUD - Top left
    const hudTop = document.createElement('div');
    hudTop.id = 'hudTop';
    hudTop.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.7);
      border: 2px solid #00ff00;
      padding: 10px;
      min-width: 200px;
      pointer-events: none;
    `;
    hudTop.innerHTML = `
      <div style="font-size: 14px; margin-bottom: 5px;">ASSAULT RIFLE</div>
      <div id="ammoDisplay" style="font-size: 18px; font-weight: bold;">AMMO: 30/30</div>
    `;
    uiContainer.appendChild(hudTop);

    // HUD - Top right (Match time)
    const hudTopRight = document.createElement('div');
    hudTopRight.id = 'hudTopRight';
    hudTopRight.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.7);
      border: 2px solid #00ff00;
      padding: 10px;
      text-align: center;
      min-width: 150px;
      pointer-events: none;
    `;
    hudTopRight.innerHTML = `
      <div id="matchTimer" style="font-size: 20px; font-weight: bold;">5:00</div>
      <div style="font-size: 12px; color: #00aa00;">MATCH TIME</div>
    `;
    uiContainer.appendChild(hudTopRight);

    // HUD - Bottom left (Health/Status)
    const hudBottom = document.createElement('div');
    hudBottom.id = 'hudBottom';
    hudBottom.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.7);
      border: 2px solid #00ff00;
      padding: 10px;
      min-width: 200px;
      pointer-events: none;
    `;
    hudBottom.innerHTML = `
      <div id="healthBar" style="margin-bottom: 10px;">
        <div style="font-size: 12px;">HP</div>
        <div style="width: 150px; height: 20px; background: #1a1a1a; border: 1px solid #00ff00;">
          <div id="healthFill" style="width: 100%; height: 100%; background: #00ff00; transition: width 0.1s;"></div>
        </div>
      </div>
      <div id="statusText" style="font-size: 12px;">Ready</div>
    `;
    uiContainer.appendChild(hudBottom);

    // HUD - Bottom right (Kill feed)
    const hudBottomRight = document.createElement('div');
    hudBottomRight.id = 'hudBottomRight';
    hudBottomRight.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.7);
      border: 2px solid #00ff00;
      padding: 10px;
      max-height: 200px;
      overflow-y: auto;
      min-width: 250px;
      pointer-events: none;
    `;
    hudBottomRight.innerHTML = `
      <div style="font-size: 12px; margin-bottom: 5px;">KILL FEED</div>
      <div id="killFeed"></div>
    `;
    uiContainer.appendChild(hudBottomRight);

    // ESC to exit game
    const escapeHint = document.createElement('div');
    escapeHint.style.cssText = `
      position: fixed;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.7);
      border: 1px solid #00ff00;
      padding: 5px 10px;
      font-size: 12px;
      pointer-events: none;
    `;
    escapeHint.textContent = 'Press ESC to exit game';
    uiContainer.appendChild(escapeHint);

    document.body.appendChild(uiContainer);

    // Handle ESC key to exit
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        leaveGame();
      }
    });
  }

  updateUI() {
    // Update ammo display
    const ammoDisplay = document.getElementById('ammoDisplay');
    if (ammoDisplay) {
      ammoDisplay.textContent = `AMMO: ${this.weapon.ammo}/${this.weapon.maxAmmo}`;
      if (this.weapon.ammo <= 10) {
        ammoDisplay.style.color = '#ff0000';
      } else {
        ammoDisplay.style.color = '#00ff00';
      }
    }

    // Update health display
    const healthFill = document.getElementById('healthFill');
    if (healthFill && this.localPlayer) {
      const healthPercent = (this.localPlayer.hp / 100) * 100;
      healthFill.style.width = healthPercent + '%';
      if (healthPercent > 50) {
        healthFill.style.background = '#00ff00';
      } else if (healthPercent > 25) {
        healthFill.style.background = '#ffff00';
      } else {
        healthFill.style.background = '#ff0000';
      }
    }

    // Update match timer
    const matchTimer = document.getElementById('matchTimer');
    if (matchTimer) {
      const remaining = this.matchDuration - this.gameTime;
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      matchTimer.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  }

  async update(deltaTime) {
    if (!this.isRunning) return;

    this.gameTime += deltaTime;

    // Check if match is over
    if (this.gameTime >= this.matchDuration) {
      this.endGame();
      return;
    }

    // Update player movement
    this.updateMovement(deltaTime);

    // Handle shooting
    if (this.input.shoot && document.pointerLockElement) {
      this.fire();
    }

    // Update weapon scope
    if (this.input.scope) {
      this.weapon.isScoped = true;
      this.camera.fov = 30;
    } else {
      this.weapon.isScoped = false;
      this.camera.fov = 75;
    }
    this.camera.updateProjectionMatrix();

    // Update UI
    this.updateUI();

    // Update bullets (visual only, server handles hit detection)
    this.updateBullets(deltaTime);

    // Send position to server periodically
    if (Math.floor(this.gameTime * 10) % 5 === 0) {
      this.sendPositionUpdate();
    }
  }

  updateMovement(deltaTime) {
    const speed = this.input.crouch ? 3 : 6;
    const direction = new THREE.Vector3();

    if (this.input.forward) direction.z -= 1;
    if (this.input.backward) direction.z += 1;
    if (this.input.left) direction.x -= 1;
    if (this.input.right) direction.x += 1;

    if (direction.length() > 0) {
      direction.normalize();
      this.controls.moveRight(direction.x * speed * deltaTime);
      this.controls.moveForward(direction.z * speed * deltaTime);
    }

    if (this.input.jump) {
      this.camera.position.y += 0.15;
      this.input.jump = false;
    }

    // Gravity
    if (this.camera.position.y > 1.6) {
      this.camera.position.y -= 0.1;
    }

    // Update local player state
    if (this.localPlayer) {
      this.localPlayer.position = this.camera.position.clone();
      this.localPlayer.rotation = {
        x: this.camera.rotation.x,
        y: this.camera.rotation.y
      };
    }
  }

  fire() {
    const now = Date.now();
    
    // Check fire rate
    if (now - this.weapon.lastShotTime < this.weapon.fireRate) {
      return;
    }

    // Check ammo
    if (this.weapon.ammo <= 0) {
      console.log('No ammo!');
      return;
    }

    this.weapon.ammo -= 1;
    this.weapon.lastShotTime = now;

    // Get ray from camera
    const rayOrigin = this.camera.position;
    const rayDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);

    // Create bullet visual
    this.createBulletTracer(rayOrigin, rayDirection);

    // Send fire event to server
    this.sendFireEvent(rayOrigin, rayDirection);
  }

  createBulletTracer(origin, direction) {
    const length = 100;
    const endPoint = new THREE.Vector3().copy(direction).multiplyScalar(length).add(origin);

    const geometry = new THREE.BufferGeometry().setFromPoints([origin, endPoint]);
    const material = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 });
    const line = new THREE.Line(geometry, material);
    this.scene.add(line);

    this.bullets.push({
      object: line,
      createdAt: Date.now()
    });
  }

  updateBullets(deltaTime) {
    const now = Date.now();
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      if (now - this.bullets[i].createdAt > 200) {
        this.scene.remove(this.bullets[i].object);
        this.bullets.splice(i, 1);
      }
    }
  }

  async sendPositionUpdate() {
    if (!this.matchId || !this.playerId) return;

    try {
      await fetch(`${BACKEND_URL}/match/${this.matchId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          playerId: this.playerId,
          position: this.camera.position,
          rotation: {
            x: this.camera.rotation.x,
            y: this.camera.rotation.y
          },
          isShooting: this.input.shoot,
          isCrouching: this.input.crouch,
          isScoped: this.weapon.isScoped,
          ammo: this.weapon.ammo,
          hp: this.localPlayer?.hp || 100
        })
      });
    } catch (error) {
      console.error('Failed to send position update:', error);
    }
  }

  async sendFireEvent(rayOrigin, rayDirection) {
    if (!this.matchId || !this.playerId) return;

    try {
      await fetch(`${BACKEND_URL}/match/${this.matchId}/fire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          playerId: this.playerId,
          rayOrigin: rayOrigin,
          rayDirection: rayDirection
        })
      });
    } catch (error) {
      console.error('Failed to send fire event:', error);
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  endGame() {
    this.isRunning = false;
    console.log('Match ended!');
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.controls.disconnect();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    document.getElementById('gameUI')?.remove();
  }
}

// ============================================
// GAME INITIALIZATION
// ============================================

export async function startGame(token, region = 'north-america') {
  try {
    // Wait for THREE.js to load if needed
    let attempts = 0;
    while (!window.THREE && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.THREE) {
      throw new Error('Three.js failed to load');
    }

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'gameCanvas';
    document.body.innerHTML = '';
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    document.body.appendChild(canvas);

    // Request match from backend
    const response = await fetch(`${BACKEND_URL}/match/queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ region })
    });

    const data = await response.json();

    if (!data.success) {
      console.error('Failed to join match:', data.error);
      alert('Failed to join match: ' + (data.error || 'Unknown error'));
      return;
    }

    // Initialize game
    gameState.matchId = data.matchId;
    gameState.playerId = data.playerId;
    gameState.authToken = token;
    gameState.region = region;
    gameState.isInGame = true;

    const game = new FPSGame(canvas, token, region);
    gameState.gameInstance = game;

    // Set up local player
    game.localPlayer = {
      id: data.playerId,
      hp: 100,
      kills: 0,
      deaths: 0,
      position: new THREE.Vector3(0, 1.6, 0),
      rotation: { x: 0, y: 0 }
    };

    game.matchId = data.matchId;
    game.playerId = data.playerId;
    game.isRunning = true;

    // Game loop
    let lastTime = Date.now();
    const gameLoop = () => {
      if (!game.isRunning) return;

      const now = Date.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;

      game.update(deltaTime);
      game.render();

      requestAnimationFrame(gameLoop);
    };

    gameLoop();

    console.log('🎮 Game started!', data);
  } catch (error) {
    console.error('Error starting game:', error);
    alert('Error starting game: ' + error.message);
  }
}

export async function leaveGame() {
  if (gameState.gameInstance) {
    gameState.gameInstance.dispose();
  }

  // Tell server we're leaving the match
  if (gameState.matchId && gameState.authToken) {
    try {
      await fetch(`${BACKEND_URL}/match/${gameState.matchId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${gameState.authToken}`
        }
      });
    } catch (error) {
      console.error('Error leaving match:', error);
    }
  }

  gameState.isInGame = false;
  gameState.matchId = null;
  gameState.playerId = null;
  gameState.gameInstance = null;
  
  // Reload the app
  window.location.reload();
}

export function isInGame() {
  return gameState.isInGame;
}
