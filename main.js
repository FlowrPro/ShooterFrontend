// ===========================
// Moborr.io Home Screen
// Emoji-Only Version - No Asset Files
// ===========================

const mockUser = {
  nickname: "#PLAYER123",
  level: 7,
  avatar: "😎"
};

let currentModal = null;

function renderSidebar() {
  return `
    <nav class="sidebar flex flex-col gap-4 bg-black bg-opacity-60 text-white w-44 p-4 min-h-screen shadow-xl border-r border-purple-500 border-opacity-30">
      <button class="nav-item-btn flex items-center mb-6 pb-4 border-b border-purple-400 border-opacity-30 w-full hover:bg-purple-600 hover:bg-opacity-50 rounded p-2 transition" data-modal="profile">
  <div class="text-3xl mr-3">${mockUser.avatar}</div>
  <div>
    <div class="font-bold text-sm">${mockUser.nickname}</div>
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
  return `
    <main class="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
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
          ► PLAY NOW
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
          <select class="w-full bg-gray-900 text-white px-2 py-1 rounded text-sm">
            <option>🌍 North America</option>
            <option>🌍 Europe</option>
            <option>🌍 Asia</option>
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
    profile: "PROFILE",
    servers: "SERVERS",
    quests: "QUESTS",
    friends: "FRIENDS",
    inventory: "INVENTORY",
    map: "MAP",
    settings: "SETTINGS",
    leaderboards: "LEADERBOARDS",
    "create-game": "CREATE GAME",
    "join-game": "JOIN GAME",
    "quick-match": "QUICK MATCH"
  };

  return `
    <div class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" id="modalOverlay">
      <div class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-2xl border-2 border-purple-500 w-96 p-6 relative">
        <!-- Close Button -->
        <button id="closeModal" class="absolute top-4 right-4 bg-red-600 hover:bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg">
          ✕
        </button>

        <!-- Modal Title -->
        <h2 class="text-center text-2xl font-black text-white mb-6 mt-2">
          ${modalTitles[modalName] || modalName.toUpperCase()}
        </h2>

        <!-- Modal Content -->
        <div class="text-white text-center">
          <p class="text-gray-300 mb-6">Content for ${modalTitles[modalName] || modalName.toUpperCase()} coming soon...</p>
        </div>

        <!-- Footer Button -->
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
  // Remove existing modal if any
  const existingModal = document.getElementById("modalOverlay");
  if (existingModal) {
    existingModal.remove();
  }

  // Create and insert new modal
  const modalHTML = getModalContent(modalName);
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // Setup close button listeners
  document.getElementById("closeModal").addEventListener("click", closeModal);
  document.getElementById("closeModalBtn").addEventListener("click", closeModal);
  document.getElementById("modalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "modalOverlay") {
      closeModal();
    }
  });
}

function closeModal() {
  const modal = document.getElementById("modalOverlay");
  if (modal) {
    modal.remove();
  }
}

function setupEventListeners() {
  // Sidebar nav items
  document.querySelectorAll(".nav-item-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const modalName = e.currentTarget.getAttribute("data-modal");
      openModal(modalName);
    });
  });

  // Center buttons
  document.querySelectorAll(".center-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const modalName = e.currentTarget.getAttribute("data-modal");
      openModal(modalName);
    });
  });

  // Play button
  const playBtn = document.getElementById("playBtn");
  playBtn?.addEventListener("click", () => {
    alert("🎮 Loading gameplay scene...\n(Main FPS game coming next!)");
  });
}

function renderApp() {
  const app = document.getElementById("app");
  if (app) {
    app.innerHTML = renderSidebar() + renderCenter() + renderRightPanel();
    setupEventListeners();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderApp);
} else {
  renderApp();
}
