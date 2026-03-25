// ===========================
// Moborr.io Home Screen
// Emoji-Only Version - No Asset Files
// ===========================

const mockUser = {
  nickname: "#PLAYER123",
  level: 7,
  avatar: "😎"
};

function renderSidebar(): string {
  return `
    <nav class="sidebar flex flex-col gap-4 bg-black bg-opacity-60 text-white w-44 p-4 min-h-screen shadow-xl border-r border-purple-500 border-opacity-30">
      <div class="flex items-center mb-6 pb-4 border-b border-purple-400 border-opacity-30">
        <div class="text-3xl mr-3">${mockUser.avatar}</div>
        <div>
          <div class="font-bold text-sm">${mockUser.nickname}</div>
          <div class="text-xs text-yellow-400">Lv. ${mockUser.level}</div>
        </div>
      </div>
      <button class="nav-item active py-2 px-3 rounded flex items-center gap-2 hover:bg-purple-600 hover:bg-opacity-50 transition">
        🏠 <span>Hub</span>
      </button>
      <button class="nav-item py-2 px-3 rounded flex items-center gap-2 hover:bg-purple-600 hover:bg-opacity-50 transition">
        🛒 <span>Store</span>
      </button>
      <button class="nav-item py-2 px-3 rounded flex items-center gap-2 hover:bg-purple-600 hover:bg-opacity-50 transition">
        🔫 <span>Servers</span>
      </button>
      <button class="nav-item py-2 px-3 rounded flex items-center gap-2 hover:bg-purple-600 hover:bg-opacity-50 transition">
        🎯 <span>Quests</span>
      </button>
      <button class="nav-item py-2 px-3 rounded flex items-center gap-2 hover:bg-purple-600 hover:bg-opacity-50 transition">
        👥 <span>Friends</span>
      </button>
      <button class="nav-item py-2 px-3 rounded flex items-center gap-2 hover:bg-purple-600 hover:bg-opacity-50 transition">
        📦 <span>Inventory</span>
      </button>
      <button class="nav-item py-2 px-3 rounded flex items-center gap-2 hover:bg-purple-600 hover:bg-opacity-50 transition">
        🗺️ <span>Map</span>
      </button>
      <div class="mt-auto pt-4 border-t border-purple-400 border-opacity-30">
        <button class="nav-item py-2 px-3 rounded flex items-center gap-2 w-full hover:bg-red-600 hover:bg-opacity-50 transition">
          ⚙️ <span>Settings</span>
        </button>
      </div>
    </nav>
  `;
}

function renderCenter(): string {
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
        <div class="mb-6 text-[6rem]" title="Your hero character">🤖</div>
        <button id="playBtn" class="bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-black font-black rounded-full px-12 py-4 text-2xl shadow-lg transition transform hover:scale-105 mb-6">
          ► PLAY NOW
        </button>
        <div class="flex justify-center gap-3 mb-6">
          <button class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold transition">Leaderboards</button>
          <button class="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded font-bold transition">Settings</button>
        </div>
        <div class="text-center text-gray-300 text-xs">
          <p>v0.1 Alpha • Inspired by Krunker & Kirka</p>
          <p class="mt-1 text-green-400">🟢 Server Online</p>
        </div>
      </div>
    </main>
  `;
}

function renderRightPanel(): string {
  return `
    <aside class="flex flex-col gap-6 bg-black bg-opacity-60 w-72 p-5 text-white min-h-screen shadow-xl border-l border-purple-500 border-opacity-30 overflow-y-auto">
      <div>
        <div class="flex justify-between items-center mb-3">
          <div>
            <div class="font-bold text-lg">📋 Daily Quests</div>
            <div class="text-xs text-gray-400">⏱️ Expire in 12:45:31</div>
          </div>
          <button class="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded font-bold text-xs transition">View</button>
        </div>
        <div class="mb-4 p-3 bg-gray-800 bg-opacity-50 rounded">
          <div class="text-sm font-semibold mb-1">🔫 Get 100 Kills</div>
          <div class="bg-gray-900 rounded h-2 relative w-full mb-2 overflow-hidden">
            <div class="bg-yellow-400 h-2 rounded" style="width: 30%;"></div>
          </div>
          <div class="text-xs text-gray-400">30/100 • +500 XP</div>
        </div>
        <div class="mb-4 p-3 bg-gray-800 bg-opacity-50 rounded">
          <div class="text-sm font-semibold mb-1">⭐ Earn 5000 Score</div>
          <div class="bg-gray-900 rounded h-2 relative w-full mb-2 overflow-hidden">
            <div class="bg-green-400 h-2 rounded" style="width: 65%;"></div>
          </div>
          <div class="text-xs text-gray-400">3250/5000 • +750 XP</div>
        </div>
      </div>
      <div>
        <div class="font-bold mb-3 text-lg">🎮 Game Mode</div>
        <div class="flex gap-2">
          <button class="flex-1 bg-purple-600 hover:bg-purple-500 py-2 rounded font-bold text-sm transition">Create</button>
          <button class="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded font-bold text-sm transition">Join</button>
        </div>
      </div>
      <button id="quickMatchBtn" class="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 py-3 rounded-lg text-lg font-black text-black shadow-lg transition transform hover:scale-105">
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

function setupEventListeners() {
  const playBtn = document.getElementById("playBtn");
  const quickMatchBtn = document.getElementById("quickMatchBtn");
  
  playBtn?.addEventListener("click", () => {
    alert("🎮 Loading gameplay scene...\n(Main FPS game coming next!)");
  });
  
  quickMatchBtn?.addEventListener("click", () => {
    alert("⚡ Searching for a quick match...");
  });
}

function renderApp() {
  const app = document.getElementById("app");
  if (app) {
    app.innerHTML = `${renderSidebar()}${renderCenter()}${renderRightPanel()}`;
    setupEventListeners();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderApp);
} else {
  renderApp();
}

export {};
