// ===========================
// Moborr.io Home Screen
// Character selection in center (3 slots)
// ===========================

import { 
  currentUser, 
  authToken, 
  loadUserFromStorage, 
  logout, 
  loginUser, 
  registerUser, 
  isLoggedIn,
  BACKEND_URL
} from './auth.js';

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

// Center: Character selection (3 slots)
function renderCenter() {
  return `
    <main class="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
      <div class="absolute inset-0 opacity-10 pointer-events-none">
        <div class="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
        <div class="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
      </div>

      <div class="relative z-10 flex flex-col items-center w-full">
        <div class="moborr-logo text-white mb-6 text-6xl font-black">
          MOBORR.IO
        </div>

        <div id="characterSelectionWrapper" class="w-full max-w-3xl px-6">
          <div class="bg-black bg-opacity-60 rounded-xl p-6 border border-purple-500 border-opacity-30 shadow-lg">
            <h2 class="text-white text-2xl font-bold mb-4">Select Your Character</h2>

            <div id="characterSlots" class="grid grid-cols-3 gap-4">
              <!-- Character slots will be injected here -->
              <div class="character-slot p-4 rounded bg-gray-900 bg-opacity-40 flex flex-col items-center justify-center cursor-pointer select-none" data-slot="0">
                <div class="text-5xl mb-3">🔲</div>
                <div class="text-gray-300">Loading...</div>
              </div>
              <div class="character-slot p-4 rounded bg-gray-900 bg-opacity-40 flex flex-col items-center justify-center cursor-pointer select-none" data-slot="1">
                <div class="text-5xl mb-3">🔲</div>
                <div class="text-gray-300">Loading...</div>
              </div>
              <div class="character-slot p-4 rounded bg-gray-900 bg-opacity-40 flex flex-col items-center justify-center cursor-pointer select-none" data-slot="2">
                <div class="text-5xl mb-3">🔲</div>
                <div class="text-gray-300">Loading...</div>
              </div>
            </div>

            <div class="mt-6 text-center">
              <button id="enterWorldBtn" class="bg-yellow-400 text-black font-black rounded-full px-6 py-2 shadow hover:scale-105 transition disabled:opacity-60" disabled>
                Enter World
              </button>
            </div>
          </div>
        </div>

        <div class="text-center text-gray-300 text-xs mt-6">
          <p>v0.1 Alpha • Character system</p>
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

// Reuse profile modal logic from previous implementation if needed (keeps login/register)
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

// Modal helper used for character name entry (custom)
function openCharacterNameModal(slot, currentName = '') {
  // If not logged in, open profile modal instead
  if (!isLoggedIn()) {
    openModal('profile');
    return;
  }

  // remove if exists
  document.getElementById('charNameModal')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'charNameModal';
  overlay.className = 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50';
  overlay.innerHTML = `
    <div class="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-2xl border-2 border-purple-500 w-96 p-6 relative">
      <button id="closeCharModal" class="absolute top-4 right-4 bg-red-600 hover:bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg">✕</button>
      <h2 class="text-center text-2xl font-black text-white mb-4">Name Character</h2>
      <p class="text-center text-gray-300 mb-4">Assign a permanent name to this character slot.</p>
      <input id="charNameInput" type="text" maxlength="24" placeholder="Character Name" class="w-full bg-gray-800 text-white px-4 py-2 rounded border border-purple-500 focus:outline-none mb-4" value="${currentName ? currentName : ''}" />
      <div class="flex gap-2">
        <button id="saveCharBtn" class="flex-1 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold">Save</button>
        <button id="cancelCharBtn" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-bold">Cancel</button>
      </div>
      <div id="charSaveMessage" class="mt-3 text-sm text-yellow-300"></div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('closeCharModal')?.addEventListener('click', () => overlay.remove());
  document.getElementById('cancelCharBtn')?.addEventListener('click', () => overlay.remove());

  document.getElementById('saveCharBtn')?.addEventListener('click', async () => {
    const input = document.getElementById('charNameInput');
    const message = document.getElementById('charSaveMessage');
    const name = input.value.trim();

    if (!name) {
      message.textContent = '❌ Name cannot be empty';
      return;
    }
    if (name.length < 2) {
      message.textContent = '❌ Must be at least 2 characters';
      return;
    }

    message.textContent = '🔄 Saving...';

    try {
      const res = await fetch(`${BACKEND_URL}/characters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ slot, name, avatar: currentUser?.avatar ?? '😎' })
      });

      const data = await res.json();
      if (!res.ok) {
        message.textContent = `❌ ${data.error || 'Save failed'}`;
        return;
      }

      // success
      message.textContent = '✅ Saved!';
      // refresh character slots UI
      await loadCharacterSlots();
      setTimeout(() => overlay.remove(), 500);
    } catch (err) {
      console.error('Save character error:', err);
      message.textContent = '❌ Network error';
    }
  });
}

async function loadCharacterSlots() {
  const container = document.getElementById('characterSlots');
  if (!container) return;

  // show loading placeholders
  container.querySelectorAll('.character-slot').forEach((el) => {
    el.innerHTML = `<div class="text-5xl mb-3">⏳</div><div class="text-gray-300">Loading...</div>`;
  });

  if (!isLoggedIn()) {
    // Not logged in — show empty slots and prompt to login on click
    container.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const slotEl = document.createElement('div');
      slotEl.className = 'character-slot p-6 rounded bg-gray-900 bg-opacity-40 flex flex-col items-center justify-center cursor-pointer select-none';
      slotEl.dataset.slot = String(i);
      slotEl.innerHTML = `<div class="text-5xl mb-3">🔒</div><div class="text-gray-300">Login to create</div>`;
      slotEl.addEventListener('click', () => openModal('profile'));
      container.appendChild(slotEl);
    }
    (document.getElementById('enterWorldBtn') || {}).disabled = true;
    return;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/characters`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (!res.ok) {
      console.error('Failed to fetch characters', await res.text());
      // fallback: show empty slots
      container.innerHTML = '';
      for (let i = 0; i < 3; i++) {
        const slotEl = document.createElement('div');
        slotEl.className = 'character-slot p-6 rounded bg-gray-900 bg-opacity-40 flex flex-col items-center justify-center cursor-pointer select-none';
        slotEl.dataset.slot = String(i);
        slotEl.innerHTML = `<div class="text-5xl mb-3">🟦</div><div class="text-gray-300">Empty<br/><span class="text-xs text-gray-400">Click to create</span></div>`;
        slotEl.addEventListener('click', () => openCharacterNameModal(i));
        container.appendChild(slotEl);
      }
      (document.getElementById('enterWorldBtn') || {}).disabled = true;
      return;
    }

    const data = await res.json();
    const chars = data.characters || [null, null, null];
    container.innerHTML = '';

    chars.forEach((c, i) => {
      const slotEl = document.createElement('div');
      slotEl.className = 'character-slot p-6 rounded bg-gray-900 bg-opacity-40 flex flex-col items-center justify-center cursor-pointer select-none hover:bg-gray-800';
      slotEl.dataset.slot = String(i);

      if (c) {
        slotEl.innerHTML = `
          <div class="text-5xl mb-3">${c.avatar ?? '😎'}</div>
          <div class="text-white font-bold">${c.name}</div>
          <div class="text-xs text-gray-400 mt-1">Slot ${i + 1}</div>
        `;
        slotEl.addEventListener('click', () => openCharacterNameModal(i, c.name));
      } else {
        slotEl.innerHTML = `
          <div class="text-5xl mb-3">➕</div>
          <div class="text-gray-300 font-bold">Empty</div>
          <div class="text-xs text-gray-400 mt-1">Click to create character</div>
        `;
        slotEl.addEventListener('click', () => openCharacterNameModal(i));
      }

      container.appendChild(slotEl);
    });

    // enable Enter World if at least one character exists
    const any = chars.some(Boolean);
    const enterBtn = document.getElementById('enterWorldBtn');
    if (enterBtn) {
      enterBtn.disabled = !any;
      enterBtn.onclick = () => {
        // Choose first non-null character for now (we'll expand later)
        const first = chars.find(Boolean);
        if (!first) return;
        // store selected character id temporarily and proceed (we'll implement next steps later)
        localStorage.setItem('moborr_selected_character', JSON.stringify(first));
        // For now just alert and keep user on the home screen
        alert(`Selected ${first.name} (slot ${first.slot}). We'll continue flow later.`);
      };
    }
  } catch (err) {
    console.error('Error loading characters:', err);
  }
}

// Open generic modal (profile etc.)
function openModal(modalName) {
  const existingModal = document.getElementById("modalOverlay");
  if (existingModal) existingModal.remove();

  const modalHTML = getModalContent(modalName);
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  document.getElementById("closeModal")?.addEventListener("click", closeModal);
  document.getElementById("closeModalBtn")?.addEventListener("click", closeModal);
  document.getElementById("closeProfileBtn")?.addEventListener("click", closeModal);
  document.getElementById("modalOverlay")?.addEventListener("click", (e) => {
    if (e.target.id === "modalOverlay") closeModal();
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
  if (modal) modal.remove();
}

// Setup nav/modal event listeners and center slot clicks are attached in loadCharacterSlots
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
  playBtn?.addEventListener("click", () => {
    // Navigate to game page
    window.location.href = './game.html';
  });
}

function renderApp() {
  const app = document.getElementById("app");
  if (!app) return;
  app.innerHTML = renderSidebar() + renderCenter() + renderRightPanel();
  setupEventListeners();
  // after DOM inserted, populate dynamic character slots
  loadCharacterSlots();
}

// Initialize
loadUserFromStorage();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderApp);
} else {
  renderApp();
}
