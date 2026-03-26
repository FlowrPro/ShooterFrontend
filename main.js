// ===========================
// Moborr.io Home Screen
// Emoji-Only Version - Frontend Auth
// ===========================

import { 
  currentUser, 
  authToken, 
  loadUserFromStorage, 
  logout, 
  loginUser, 
  registerUser, 
  isLoggedIn 
} from './auth.js';

import { joinQueue, leaveQueue, isInQueue, getQueueStatus } from './queue.js';
import { startGame, leaveGame, isInGame } from './game.js';

function renderSidebar() {
  const profileName = isLoggedIn() ? currentUser.username : 'Login/Register';
  const profileAvatar = isLoggedIn() ? currentUser.avatar : '🔐';

  return `
    <nav class="sidebar flex flex-col gap-4 bg-black bg-opacity-60 text-white w-44 p-4 min-h-screen shadow-xl border-r border-purple-500 border-opacity-30">
      <button class="nav-item-btn flex items-center mb-6 pb-4 border-b border-purple-400 border-opacity-30 w-full hover:bg-purple-600 hover:bg-opacity-50 rounded p-2 transition overflow-hidden" data-modal="profile">
        <div class="text-3xl mr-2 flex-shrink-0">${profileAvatar}</div>
        <div class="text-left min-w-0">
          <div class="font-bold text-sm truncate">${profileName}</div>
        </div>
      </button>
      <button class="nav-item-btn active py-2 px-3 rounded flex items-center gap-2 hover:bg-purple-600 hover:bg-opacity-50 transition" data-modal="hub">
        🏠 <span>Hub</span>
      </button>
      <button class="nav-item-btn py-2 px-3 rounded flex items-center gap-2 hover:bg-purple-600 hover:bg-opacity-50 transition" data-modal="store">
        🛒 <span>Store</span>
      </button>
      <button class="nav-item-btn py-2 px-3 rounded flex items-center gap-2 hover:bg-purple-600 hover:bg-opacity-50 transition" data-modal="servers">
        🔫 <span>Servers</span>
      </button>
      <button class="nav-item-btn py-2 px-3 rounded flex items-center gap-2 hover:bg-purple-600 hover:bg-opacity-50 transition" data-modal="quests">
        🎯 <span>Quests</span>
      </button>
      <button class="nav-item-btn py-2 px-3 rounded flex items-center gap-2 hover:bg-purple-600 hover:bg-opacity-50 transition" data-modal="friends">
        👥 <span>Friends</span>
      </button>
      <button class="nav-item-btn py-2 px-3 rounded flex items-center gap-2 hover:bg-purple-600 hover:bg-opacity-50 transition" data-modal="inventory">
        📦 <span>Inventory</span>
      </button>
      <button class="nav-item-btn py-2 px-3 rounded flex items-center gap-2 hover:bg-purple-600 hover:bg-opacity-50 transition" data-modal="map">
        🗺️ <span>Map</span>
      </button>
      <div class="mt-auto pt-4 border-t border-purple-400 border-opacity-30">
        <button class="nav-item-btn py-2 px-3 rounded flex items-center gap-2 w-full hover:bg-red-600 hover:bg-opacity-50 transition" data-modal="settings">
          ⚙️ <span>Settings</span>
        </button>
      </div>
    </nav>
  `;
}

function renderCenter() {
  const queueStatus = getQueueStatus();
  
  return `
    <main class="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
      ${queueStatus.isQueued ? `
        <div class="fixed bottom-0 left-1/2 transform -translate-x-1/2 bg-purple-600 border-2 border-purple-400 text-white px-8 py-3 rounded-t-lg mb-0 text-center shadow-lg z-40">
          <div class="text-sm font-bold">🎮 MATCH QUEUE</div>
          <div id="queueTimer" class="text-lg font-black text-yellow-300">${queueStatus.formattedTime}</div>
        </div>
      ` : ''}
      
      <div class="absolute inset-0 opacity-10 pointer-events-none">
        <div class="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
        <div class="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
      </div>
      <div class="relative z-10 flex flex-col items-center">
        <div class="moborr-logo text-white mb-8 text-6xl font-black">
          MOBORR.IO
        </div>
        <div class="text-purple-300 text-sm tracking-widest mb-6">BROWSER FPS • ALPHA</div>
        <div class="mb-6" title="Your hero character">
          <img src="./assets/logo.png" class="w-48 h-48 object-contain drop-shadow-lg" alt="Moborr Logo"/>
        </div>
        <button id="playBtn" class="bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-black font-black rounded-full px-12 py-4 text-2xl shadow-lg transition transform hover:scale-105 mb-6">
          ${isInGame() ? '🎮 IN GAME' : '► PLAY NOW'}
        </button>
        <div class="flex justify-center gap-3 mb-6">
          <button class="center-btn bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold transition" data-modal="leaderboards">Leaderboards</button>
          <button class="center-btn bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded font-bold transition" data-modal="settings">Settings</button>
        </div>
        <div class="text-center text-gray-300 text-xs">
          <p>v0.1 Alpha • Inspired by Krunker & Kirka</p>
          <p class="mt-1 text-green-400">🟢 Server Online</p>
        </div>
      </div>
    </main>
  `;
}

function renderRightPanel() {
  return `
    <aside class="flex flex-col gap-6 bg-black bg-opacity-60 w-72 p-5 text-white min-h-screen shadow-xl border-l border-purple-500 border-opacity-30 overflow-y-auto">
      <div>
        <div class="flex justify-between items-center mb-3">
          <div>
            <div class="font-bold text-lg">📋 Daily Quests</div>
          </div>
        </div>
        <div class="mb-4 p-3 bg-gray-800 bg-opacity-50 rounded text-center">
          <p class="text-sm text-gray-300">Daily Quests - Coming Soon</p>
        </div>
      </div>
      <div>
        <div class="font-bold mb-3 text-lg">🎮 Game Mode</div>
        <div class="flex gap-2">
          <button class="flex-1 bg-purple-600 hover:bg-purple-500 py-2 rounded font-bold text-sm transition center-btn" data-modal="create-game">Create</button>
          <button class="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded font-bold text-sm transition center-btn" data-modal="join-game">Join</button>
        </div>
      </div>
      <button id="quickMatchBtn" class="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 py-3 rounded-lg text-lg font-black text-black shadow-lg transition transform hover:scale-105 center-btn" data-modal="quick-match">
        🚀 QUICK MATCH
      </button>
      <div>
        <div class="font-bold mb-2 text-sm">🌍 Region</div>
        <div class="bg-gray-800 bg-opacity-50 rounded p-2">
          <select id="regionSelect" class="w-full bg-gray-900 text-white px-2 py-1 rounded text-sm">
            <option value="north-america">🌍 North America</option>
            <option value="europe">🌍 Europe</option>
            <option value="asia">🌍 Asia</option>
          </select>
        </div>
      </div>
      <div class="mt-auto text-xs text-gray-500 border-t border-purple-400 border-opacity-30 pt-3">
        <p>© 2026 Moborr.io</p>
        <a href="#" class="text-blue-400 hover:text-blue-300">Terms</a> • 
        <a href="#" class="text-blue-400 hover:text-blue-300">Privacy</a>
      </div>
    </aside>
  `;
}

function getModalContent(modalName) {
  const modalTitles = {
    hub: "HUB",
    store: "STORE",
    servers: "SERVERS",
    quests: "QUESTS",
    friends: "FRIENDS",
    inventory: "INVENTORY",
    map: "MAP",
    settings: "SETTINGS",
    leaderboards: "LEADERBOARDS",
    "create-game": "CREATE GAME",
    "join-game": "JOIN GAME",
    "quick-match": "QUICK MATCH",
    profile: "PROFILE"
  };

  // Profile Modal (Login/Register)
  if (modalName === 'profile') {
    if (isLoggedIn()) {
      // Logged in view
      return `
        <div class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" id="modalOverlay">
          <div class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-2xl border-2 border-purple-500 w-96 p-6 relative">
            <button id="closeModal" class="absolute top-4 right-4 bg-red-600 hover:bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg">
              ✕
            </button>
            <h2 class="text-center text-2xl font-black text-white mb-6 mt-2">PROFILE</h2>
            
            <div class="text-center">
              <div class="text-6xl mb-4">${currentUser.avatar}</div>
              <p class="text-xl font-bold text-white mb-4">${currentUser.username}</p>
              <p class="text-gray-400 mb-6">User ID: ${currentUser.id}</p>
              
              <button id="logoutBtn" class="w-full bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded font-bold mb-4">
                🚪 Logout
              </button>
              <button id="closeProfileBtn" class="w-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      `;
    } else {
      // Not logged in view - show login/register form
      return `
        <div class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" id="modalOverlay">
          <div class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-2xl border-2 border-purple-500 w-96 p-6 relative">
            <button id="closeModal" class="absolute top-4 right-4 bg-red-600 hover:bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg">
              ✕
            </button>
            <h2 class="text-center text-2xl font-black text-white mb-6 mt-2">LOGIN / REGISTER</h2>
            
            <div class="space-y-4">
              <input type="text" id="authUsername" placeholder="Username" class="w-full bg-gray-800 text-white px-4 py-2 rounded border border-purple-500 focus:outline-none focus:border-purple-300">
              <input type="password" id="authPassword" placeholder="Password" class="w-full bg-gray-800 text-white px-4 py-2 rounded border border-purple-500 focus:outline-none focus:border-purple-300">
              
              <button id="loginBtn" class="w-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold">
                🔓 Login
              </button>
              <button id="registerBtn" class="w-full bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold">
                ✨ Register
              </button>
            </div>
            
            <div id="authMessage" class="mt-4 text-center text-sm text-yellow-300"></div>
          </div>
        </div>
      `;
    }
  }

  // Default modal for other screens
  return `
    <div class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" id="modalOverlay">
      <div class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-2xl border-2 border-purple-500 w-96 p-6 relative">
        <button id="closeModal" class="absolute top-4 right-4 bg-red-600 hover:bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg">
          ✕
        </button>
        <h2 class="text-center text-2xl font-black text-white mb-6 mt-2">
          ${modalTitles[modalName] || modalName.toUpperCase()}
        </h2>
        <div class="text-white text-center">
          <p class="text-gray-300 mb-6">Content for ${modalTitles[modalName] || modalName.toUpperCase()} coming soon...</p>
        </div>
        <div class="mt-6 flex justify-center">
          <button id="closeModalBtn" class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold">
            Close
          </button>
        </div>
      </div>
    </div>
  `;
}

function openModal(modalName) {
  const existingModal = document.getElementById("modalOverlay");
  if (existingModal) {
    existingModal.remove();
  }

  const modalHTML = getModalContent(modalName);
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Close button handlers
  document.getElementById("closeModal")?.addEventListener("click", closeModal);
  document.getElementById("closeModalBtn")?.addEventListener("click", closeModal);
  document.getElementById("closeProfileBtn")?.addEventListener("click", closeModal);
  document.getElementById("modalOverlay")?.addEventListener("click", (e) => {
    if (e.target.id === "modalOverlay") {
      closeModal();
    }
  });

  // Auth handlers (if profile modal)
  if (modalName === 'profile' && !isLoggedIn()) {
    document.getElementById("loginBtn")?.addEventListener("click", async () => {
      const username = document.getElementById("authUsername").value;
      const password = document.getElementById("authPassword").value;
      const message = document.getElementById("authMessage");

      if (!username || !password) {
        message.textContent = "❌ Please fill in all fields";
        return;
      }

      message.textContent = "🔄 Logging in...";
      const result = await loginUser(username, password);
      
      if (result.success) {
        renderApp();
        closeModal();
      } else {
        message.textContent = `❌ ${result.error}`;
      }
    });

    document.getElementById("registerBtn")?.addEventListener("click", async () => {
      const username = document.getElementById("authUsername").value;
      const password = document.getElementById("authPassword").value;
      const message = document.getElementById("authMessage");

      if (!username || !password) {
        message.textContent = "❌ Please fill in all fields";
        return;
      }

      if (password.length < 6) {
        message.textContent = "❌ Password must be at least 6 characters";
        return;
      }

      message.textContent = "🔄 Registering...";
      const result = await registerUser(username, password);
      
      if (result.success) {
        renderApp();
        closeModal();
      } else {
        message.textContent = `❌ ${result.error}`;
      }
    });
  }

  // Logout handler
  if (modalName === 'profile' && isLoggedIn()) {
    document.getElementById("logoutBtn")?.addEventListener("click", () => {
      logout();
      renderApp();
      closeModal();
    });
  }
}

function closeModal() {
  const modal = document.getElementById("modalOverlay");
  if (modal) {
    modal.remove();
  }
}

function setupEventListeners() {
  document.querySelectorAll(".nav-item-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const modalName = e.currentTarget.getAttribute("data-modal");
      openModal(modalName);
    });
  });

  document.querySelectorAll(".center-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const modalName = e.currentTarget.getAttribute("data-modal");
      openModal(modalName);
    });
  });

  const playBtn = document.getElementById("playBtn");
  playBtn?.addEventListener("click", async () => {
    if (!isLoggedIn()) {
      alert("❌ Please login first!");
      return;
    }

    if (isInGame()) {
      leaveGame();
      return;
    }

    // Get selected region
    const regionSelect = document.getElementById("regionSelect");
    const region = regionSelect ? regionSelect.value : 'north-america';

    // Start the game
    try {
      await startGame(authToken, region);
    } catch (error) {
      console.error('Failed to start game:', error);
      alert('❌ Failed to start game. Please try again.');
    }
  });
}

function renderApp() {
  const app = document.getElementById("app");
  if (app) {
    app.innerHTML = renderSidebar() + renderCenter() + renderRightPanel();
    setupEventListeners();
  }
}

// Initialize
loadUserFromStorage();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderApp);
} else {
  renderApp();
}
