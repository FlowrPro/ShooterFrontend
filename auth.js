// ===========================
// Moborr.io Authentication Module
// ===========================

const BACKEND_URL = 'https://moborr-backend.onrender.com';

export let currentUser = null;
export let authToken = null;

// Load user from localStorage on page load
export function loadUserFromStorage() {
  const stored = localStorage.getItem('moborr_user');
  const token = localStorage.getItem('moborr_token');
  
  if (stored && token) {
    currentUser = JSON.parse(stored);
    authToken = token;
  }
}

// Save user to localStorage
export function saveUserToStorage(user, token) {
  localStorage.setItem('moborr_user', JSON.stringify(user));
  localStorage.setItem('moborr_token', token);
  currentUser = user;
  authToken = token;
}

// Clear user data
export function logout() {
  localStorage.removeItem('moborr_user');
  localStorage.removeItem('moborr_token');
  currentUser = null;
  authToken = null;
}

// Login user
export async function loginUser(username, password) {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      saveUserToStorage(data.user, data.token);
      return { success: true };
    } else {
      return { success: false, error: data.error || 'Login failed' };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Network error' };
  }
}

// Register user
export async function registerUser(username, password) {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      saveUserToStorage(data.user, data.token);
      return { success: true };
    } else {
      return { success: false, error: data.error || 'Registration failed' };
    }
  } catch (error) {
    console.error('Register error:', error);
    return { success: false, error: 'Network error' };
  }
}

// Check if user is logged in
export function isLoggedIn() {
  return currentUser !== null && authToken !== null;
}
