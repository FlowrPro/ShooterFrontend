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
      this.PI_2 = Math.PI / 2;
      
      // Store euler angles for proper FPS camera control
      this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
      this.yaw = 0;
      this.pitch = 0;

      const onMouseMove = (event) => {
        if (!this.isLocked) return;

        const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        // Update yaw and pitch
        this.yaw -= movementX * 0.002;
        this.pitch -= movementY * 0.002;

        // Clamp pitch to prevent flipping
        this.pitch = Math.max(-this.PI_2, Math.min(this.PI_2, this.pitch));

        // Apply rotations to camera
        this.euler.order = 'YXZ';
        this.euler.setFromQuaternion(camera.quaternion);
        this.euler.y = this.yaw;
        this.euler.x = this.pitch;
        camera.quaternion.setFromEuler(this.euler);
      };

      const onPointerlockChange = () => {
        if (document.pointerLockElement === domElement) {
          this.isLocked = true;
          document.addEventListener('mousemove', onMouseMove);
        } else {
          this.isLocked = false;
          document.removeEventListener('mousemove', onMouseMove);
        }
      };

      const onPointerlockError = () => {
        console.error('PointerLock error');
      };

      document.addEventListener('pointerlockchange', onPointerlockChange);
      document.addEventListener('pointerlockerror', onPointerlockError);

      this.dispose = function() {
        document.removeEventListener('pointerlockchange', onPointerlockChange);
        document.removeEventListener('pointerlockerror', onPointerlockError);
        document.removeEventListener('mousemove', onMouseMove);
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

      this.moveForward = function(distance) {
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(camera.quaternion);
        camera.position.addScaledVector(direction, distance);
      };

      this.moveRight = function(distance) {
        const direction = new THREE.Vector3(1, 0, 0);
        direction.applyQuaternion(camera.quaternion);
        camera.position.addScaledVector(direction, distance);
      };

      this.getDirection = function(v) {
        v = v || new THREE.Vector3(0, 0, -1);
        v.applyQuaternion(camera.quaternion);
        return v;
      };
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
    this.bulletTracers = [];
    this.gameTime = 0;
    this.matchDuration = 5 * 60; // 5 minutes in seconds
    this.isRunning = false;
    this.lastTimerUpdate = 0;
    this.matchPlayers = [];

    // Player physics
    this.playerHeight = 1.6;
    this.crouchHeight = 1.0;
    this.currentHeight = this.playerHeight;
    this.velocity = { x: 0, y: 0, z: 0 };
    this.isJumping = false;
    this.gravity = 9.8;
    this.jumpForce = 8;
    this.groundLevel = 0;

    // Input state
    this.input = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      crouch: false,
      shoot: false,
      scope: false,
      reload: false
    };

    // Weapon state
    this.weapon = {
      name: 'assault-rifle',
      ammo: 30,
      maxAmmo: 30,
      fireRate: 100, // ms between shots
      damage: 20,
      lastShotTime: 0,
      isScoped: false,
      isReloading: false,
      reloadTime: 0,
      reloadDuration: 1.5 // seconds
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
    this.camera.position.set(0, this.playerHeight, 0);

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

  createBlockyPlayerMesh(username, color = 0xff0000) {
    const group = new THREE.Group();

    // Body (main torso)
    const bodyGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.25);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    body.position.y = 0.3;
    group.add(body);

    // Head
    const headGeometry = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffb399 }); // Skin tone
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.castShadow = true;
    head.receiveShadow = true;
    head.position.y = 0.95;
    group.add(head);

    // Eyes
    const eyeGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.05);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.08, 1.0, 0.18);
    group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.08, 1.0, 0.18);
    group.add(rightEye);

    // Left Arm
    const armGeometry = new THREE.BoxGeometry(0.15, 0.5, 0.15);
    const armMaterial = new THREE.MeshStandardMaterial({ color: color });
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.castShadow = true;
    leftArm.receiveShadow = true;
    leftArm.position.set(-0.28, 0.5, 0);
    leftArm.rotation.z = 0.3;
    group.add(leftArm);

    // Right Arm
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.castShadow = true;
    rightArm.receiveShadow = true;
    rightArm.position.set(0.28, 0.5, 0);
    rightArm.rotation.z = -0.3;
    group.add(rightArm);

    // Left Leg
    const legGeometry = new THREE.BoxGeometry(0.15, 0.5, 0.15);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x1a3a52 }); // Dark blue pants
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.castShadow = true;
    leftLeg.receiveShadow = true;
    leftLeg.position.set(-0.15, -0.1, 0);
    group.add(leftLeg);

    // Right Leg
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.castShadow = true;
    rightLeg.receiveShadow = true;
    rightLeg.position.set(0.15, -0.1, 0);
    group.add(rightLeg);

    // Left Hand (small cube at end of arm)
    const handGeometry = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const handMaterial = new THREE.MeshStandardMaterial({ color: 0xffb399 });
    const leftHand = new THREE.Mesh(handGeometry, handMaterial);
    leftHand.castShadow = true;
    leftHand.position.set(-0.3, 0.15, 0);
    group.add(leftHand);

    // Right Hand
    const rightHand = new THREE.Mesh(handGeometry, handMaterial);
    rightHand.castShadow = true;
    rightHand.position.set(0.3, 0.15, 0);
    group.add(rightHand);

    // Left Foot (small cube at end of leg)
    const footGeometry = new THREE.BoxGeometry(0.15, 0.12, 0.2);
    const footMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 }); // Black shoes
    const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
    leftFoot.castShadow = true;
    leftFoot.position.set(-0.15, -0.35, 0.05);
    group.add(leftFoot);

    // Right Foot
    const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
    rightFoot.castShadow = true;
    rightFoot.position.set(0.15, -0.35, 0.05);
    group.add(rightFoot);

    // Name label above head
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#00ff00';
    ctx.font = 'Bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(username, 128, 45);

    const texture = new THREE.CanvasTexture(canvas);
    const labelGeometry = new THREE.PlaneGeometry(1.5, 0.4);
    const labelMaterial = new THREE.MeshStandardMaterial({ 
      map: texture, 
      emissive: 0x00ff00, 
      emissiveIntensity: 0.3 
    });
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.y = 1.4;
    group.add(label);

    return group;
  }

  addRemotePlayer(userId, username) {
    if (this.remotePlayers.has(userId)) return; // Already exists

    const playerMesh = this.createBlockyPlayerMesh(username, 0xff4444); // Red for enemies
    playerMesh.position.set(Math.random() * 40 - 20, 0, Math.random() * 40 - 20);
    this.scene.add(playerMesh);

    this.remotePlayers.set(userId, {
      mesh: playerMesh,
      username: username,
      lastPosition: playerMesh.position.clone(),
      targetPosition: playerMesh.position.clone(),
      lastUpdate: Date.now(),
      hp: 100
    });

    console.log(`Added remote player: ${username}`);
  }

  updateRemotePlayer(userId, position, rotation, hp) {
    const player = this.remotePlayers.get(userId);
    if (!player) return;

    player.targetPosition = new THREE.Vector3(position.x, position.y, position.z);
    player.lastUpdate = Date.now();
    player.hp = hp || 100;

    // Smooth interpolation towards target position
    player.mesh.position.lerp(player.targetPosition, 0.1);
    
    if (rotation) {
      player.mesh.rotation.y = rotation.y;
      player.mesh.rotation.x = rotation.x * 0.2; // Reduce head tilt for smoother look
    }
  }

  removeRemotePlayer(userId) {
    const player = this.remotePlayers.get(userId);
    if (player) {
      this.scene.remove(player.mesh);
      this.remotePlayers.delete(userId);
      console.log(`Removed remote player: ${player.username}`);
    }
  }

  async fetchRemotePlayers() {
    if (!this.matchId) return;

    try {
      const response = await fetch(`${BACKEND_URL}/match/${this.matchId}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });

      const data = await response.json();
      
      if (data.success && data.match && data.match.gameState && data.match.gameState.players) {
        const playersData = data.match.gameState.players;
        
        // Track which players we've seen
        const currentPlayerIds = new Set();

        // Update or create remote players
        for (const [playerId, playerState] of Object.entries(playersData)) {
          if (playerState.userId === this.localPlayer?.userId) continue; // Skip self

          currentPlayerIds.add(playerState.userId);

          if (!this.remotePlayers.has(playerState.userId)) {
            this.addRemotePlayer(playerState.userId, playerState.username);
          }
          
          this.updateRemotePlayer(playerState.userId, playerState.position, playerState.rotation, playerState.hp);
        }

        // Remove players that are no longer in the match
        for (const [userId] of this.remotePlayers) {
          if (!currentPlayerIds.has(userId)) {
            this.removeRemotePlayer(userId);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch remote players:', error);
    }
  }

  setupControls() {
    this.controls = new PointerLockControls(this.camera, document.body);
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
    if (key === 'r') this.input.reload = true;
  }

  handleKeyUp(e) {
    const key = e.key.toLowerCase();
    if (key === 'w') this.input.forward = false;
    if (key === 'a') this.input.left = false;
    if (key === 's') this.input.backward = false;
    if (key === 'd') this.input.right = false;
    if (key === ' ') this.input.jump = false;
    if (key === 'shift') this.input.crouch = false;
    if (key === 'r') this.input.reload = false;
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

    // Crosshair (only visible when locked)
    const crosshair = document.createElement('div');
    crosshair.id = 'crosshair';
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
      opacity: 0;
      transition: opacity 0.2s;
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
      opacity: 0;
      transition: opacity 0.2s;
    `;
    hudTop.innerHTML = `
      <div style="font-size: 14px; margin-bottom: 5px;">ASSAULT RIFLE</div>
      <div id="ammoDisplay" style="font-size: 18px; font-weight: bold;">AMMO: 30/30</div>
      <div id="reloadDisplay" style="font-size: 12px; color: #ffff00; margin-top: 5px;"></div>
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
      opacity: 0;
      transition: opacity 0.2s;
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
      opacity: 0;
      transition: opacity 0.2s;
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
      opacity: 0;
      transition: opacity 0.2s;
    `;
    hudBottomRight.innerHTML = `
      <div style="font-size: 12px; margin-bottom: 5px;">KILL FEED</div>
      <div id="killFeed"></div>
    `;
    uiContainer.appendChild(hudBottomRight);

    // Unlock screen (shown when pointer not locked)
    const unlockScreen = document.createElement('div');
    unlockScreen.id = 'unlockScreen';
    unlockScreen.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      border: 2px solid #00ff00;
      padding: 20px;
      min-width: 300px;
      pointer-events: auto;
      z-index: 101;
    `;
    unlockScreen.innerHTML = `
      <div style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #00ff00;">PLAYERS IN MATCH</div>
      <div id="playersList" style="margin-bottom: 15px; max-height: 300px; overflow-y: auto;">
        <div style="color: #888; font-size: 12px;">Loading players...</div>
      </div>
      <button id="leaveGameBtn" style="
        width: 100%;
        background: #ff3333;
        color: white;
        border: 2px solid #ff0000;
        padding: 10px;
        font-weight: bold;
        cursor: pointer;
        border-radius: 5px;
        font-family: 'Orbitron', monospace;
        font-size: 14px;
        pointer-events: auto;
      ">LEAVE GAME (ESC)</button>
      <div style="font-size: 11px; color: #888; margin-top: 10px; text-align: center;">Click in game to lock pointer</div>
    `;
    uiContainer.appendChild(unlockScreen);

    // ESC to exit/unlock hint
    const escapeHint = document.createElement('div');
    escapeHint.id = 'escapeHint';
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
      opacity: 0;
      transition: opacity 0.2s;
    `;
    escapeHint.textContent = 'Press ESC to unlock | WASD Move | SPACE Jump | SHIFT Crouch | R Reload | MOUSE Look';
    uiContainer.appendChild(escapeHint);

    document.body.appendChild(uiContainer);

    // Handle leave game button
    document.getElementById('leaveGameBtn').addEventListener('click', () => {
      leaveGame();
    }, { passive: true });

    // Handle ESC key to unlock/exit
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (document.pointerLockElement) {
          this.controls.unlock();
        } else {
          leaveGame();
        }
      }
    });

    // Handle pointer lock changes to show/hide UI
    document.addEventListener('pointerlockchange', () => {
      this.updateUIVisibility();
    });
  }

  updateUIVisibility() {
    const isLocked = document.pointerLockElement === document.body;
    const crosshair = document.getElementById('crosshair');
    const hudTop = document.getElementById('hudTop');
    const hudTopRight = document.getElementById('hudTopRight');
    const hudBottom = document.getElementById('hudBottom');
    const hudBottomRight = document.getElementById('hudBottomRight');
    const escapeHint = document.getElementById('escapeHint');
    const unlockScreen = document.getElementById('unlockScreen');

    if (isLocked) {
      // Show game HUD
      crosshair.style.opacity = '1';
      hudTop.style.opacity = '1';
      hudTopRight.style.opacity = '1';
      hudBottom.style.opacity = '1';
      hudBottomRight.style.opacity = '1';
      escapeHint.style.opacity = '1';
      unlockScreen.style.display = 'none';
    } else {
      // Hide game HUD, show unlock screen
      crosshair.style.opacity = '0';
      hudTop.style.opacity = '0';
      hudTopRight.style.opacity = '0';
      hudBottom.style.opacity = '0';
      hudBottomRight.style.opacity = '0';
      escapeHint.style.opacity = '0';
      unlockScreen.style.display = 'block';
      this.updatePlayersList();
    }
  }

  updatePlayersList() {
    const playersList = document.getElementById('playersList');
    if (!playersList) return;

    let html = '';
    if (this.matchPlayers && this.matchPlayers.length > 0) {
      this.matchPlayers.forEach(player => {
        const isYou = player.userId === this.localPlayer?.userId;
        const color = isYou ? '#00ff00' : '#ffffff';
        const label = isYou ? ' (YOU)' : '';
        html += `<div style="color: ${color}; padding: 5px; border-bottom: 1px solid #333;">${player.username}${label}</div>`;
      });
    } else {
      html = '<div style="color: #888; font-size: 12px;">No players in match</div>';
    }
    playersList.innerHTML = html;
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

    // Update reload display
    const reloadDisplay = document.getElementById('reloadDisplay');
    if (reloadDisplay) {
      if (this.weapon.isReloading) {
        const reloadPercent = (this.weapon.reloadTime / this.weapon.reloadDuration) * 100;
        reloadDisplay.textContent = `RELOADING... ${Math.floor(reloadPercent)}%`;
      } else {
        reloadDisplay.textContent = '';
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

    // Update match timer (only update every 500ms to avoid glitching)
    if (Date.now() - this.lastTimerUpdate > 500) {
      this.lastTimerUpdate = Date.now();
      const matchTimer = document.getElementById('matchTimer');
      if (matchTimer) {
        const remaining = Math.max(0, this.matchDuration - Math.floor(this.gameTime));
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        matchTimer.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
      }
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

    // Update reload
    if (this.weapon.isReloading) {
      this.weapon.reloadTime += deltaTime;
      if (this.weapon.reloadTime >= this.weapon.reloadDuration) {
        this.weapon.isReloading = false;
        this.weapon.reloadTime = 0;
        this.weapon.ammo = this.weapon.maxAmmo;
      }
    }

    // Handle reload input
    if (this.input.reload && !this.weapon.isReloading && this.weapon.ammo < this.weapon.maxAmmo) {
      this.weapon.isReloading = true;
      this.weapon.reloadTime = 0;
    }

    // Update player movement and physics
    this.updateMovement(deltaTime);

    // Handle shooting
    if (this.input.shoot && document.pointerLockElement && !this.weapon.isReloading) {
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

    // Update bullets
    this.updateBullets(deltaTime);

    // Fetch remote players every frame (optimized frequency)
    if (Math.floor(this.gameTime * 5) % 1 === 0) {
      this.fetchRemotePlayers();
    }

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

    // Handle jumping
    if (this.input.jump && !this.isJumping) {
      this.velocity.y = this.jumpForce;
      this.isJumping = true;
    }

    // Apply gravity
    this.velocity.y -= this.gravity * deltaTime;

    // Update vertical position
    this.camera.position.y += this.velocity.y * deltaTime;

    // Check if on ground
    if (this.camera.position.y <= this.groundLevel + this.currentHeight) {
      this.camera.position.y = this.groundLevel + this.currentHeight;
      this.velocity.y = 0;
      this.isJumping = false;
    }

    // Handle crouching
    if (this.input.crouch) {
      this.currentHeight = this.crouchHeight;
    } else {
      this.currentHeight = this.playerHeight;
    }

    // Smooth camera height transition
    const targetY = this.groundLevel + this.currentHeight;
    const currentY = this.camera.position.y;
    if (Math.abs(currentY - targetY) > 0.01) {
      this.camera.position.y += (targetY - currentY) * 0.1;
    } else {
      this.camera.position.y = targetY;
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

    // Get ray from camera position (where the player is, not offset)
    const rayOrigin = this.camera.position.clone();
    const rayDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);

    // Create bullet visual
    this.createBulletTracer(rayOrigin, rayDirection);

    // Send fire event to server
    this.sendFireEvent(rayOrigin, rayDirection);
  }

  createBulletTracer(origin, direction) {
    const length = 100;
    const endPoint = new THREE.Vector3().copy(direction).multiplyScalar(length).add(origin);

    // Create a line for the bullet tracer
    const geometry = new THREE.BufferGeometry().setFromPoints([origin, endPoint]);
    const material = new THREE.LineBasicMaterial({ 
      color: 0xffff00,
      linewidth: 3,
      transparent: true,
      opacity: 0.8
    });
    const line = new THREE.Line(geometry, material);
    this.scene.add(line);

    // Create a glowing sphere at the end point
    const sphereGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const sphereMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffff00,
      emissive: 0xffff00
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.copy(endPoint);
    this.scene.add(sphere);

    this.bulletTracers.push({
      line: line,
      sphere: sphere,
      createdAt: Date.now()
    });
  }

  updateBullets(deltaTime) {
    const now = Date.now();
    for (let i = this.bulletTracers.length - 1; i >= 0; i--) {
      const tracer = this.bulletTracers[i];
      const age = now - tracer.createdAt;

      if (age > 150) {
        this.scene.remove(tracer.line);
        this.scene.remove(tracer.sphere);
        this.bulletTracers.splice(i, 1);
      } else {
        // Fade out tracer
        const fadeProgress = age / 150;
        tracer.line.material.opacity = 0.8 * (1 - fadeProgress);
        tracer.sphere.material.opacity = 1 - fadeProgress;
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
    // Remove all remote players
    for (const [userId, player] of this.remotePlayers) {
      this.scene.remove(player.mesh);
    }
    this.remotePlayers.clear();

    this.controls.dispose();
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
    console.log('Starting game with region:', region);

    // Wait for THREE.js to load if needed
    let attempts = 0;
    while (!window.THREE && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!window.THREE) {
      throw new Error('Three.js failed to load');
    }

    console.log('THREE.js loaded');

    // Create canvas first
    const canvas = document.createElement('canvas');
    canvas.id = 'gameCanvas';
    document.body.innerHTML = '';
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    document.body.appendChild(canvas);

    console.log('Canvas created');

    // Cleanup any old match first (without waiting too long)
    try {
      console.log('Attempting cleanup...');
      const cleanupResponse = await Promise.race([
        fetch(`${BACKEND_URL}/match/cleanup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Cleanup timeout')), 2000))
      ]);
      console.log('Cleanup response:', cleanupResponse.ok);
    } catch (error) {
      console.log('Cleanup skipped or timed out:', error.message);
    }

    console.log('Requesting match from backend...');

    // Request match from backend
    const response = await fetch(`${BACKEND_URL}/match/queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ region })
    });

    console.log('Match response status:', response.status);

    const data = await response.json();

    console.log('Match response data:', data);

    if (!data.success) {
      console.error('Failed to join match:', data.error);
      alert('Failed to join match: ' + (data.error || 'Unknown error'));
      window.location.reload();
      return;
    }

    console.log('Match created/joined successfully');

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
      userId: data.gameState.players[Object.keys(data.gameState.players)[0]]?.userId,
      username: Object.values(data.gameState.players)[0]?.username,
      hp: 100,
      kills: 0,
      deaths: 0,
      position: new THREE.Vector3(0, game.playerHeight, 0),
      rotation: { x: 0, y: 0 }
    };

    // Store all players in match
    game.matchPlayers = data.match?.players || [];

    game.matchId = data.matchId;
    game.playerId = data.playerId;
    game.isRunning = true;

    // Update UI visibility
    game.updateUIVisibility();

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
    window.location.reload();
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
