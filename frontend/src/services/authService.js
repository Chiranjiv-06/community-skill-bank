/**
 * Authentication Service
 * 
 * Provides clean frontend authentication boundaries:
 * - login()
 * - register()
 * - logout()
 * - getCurrentUser()
 * - restoreSession()
 * 
 * In Stage 2, uses an isolated frontend development authentication layer.
 * In Stage 17, these methods will be swapped to call api.js (FastAPI + PostgreSQL)
 * without requiring changes to components or AuthContext.
 */

import { ROLES } from '../utils/roles.js';
import { DEV_USERS } from '../data/devUsers.js';

const SESSION_STORAGE_KEY = 'csb_auth_session';
const REGISTERED_USERS_KEY = 'csb_dev_registered_users';

/**
 * Retrieve any registered users stored during development sessions
 */
const getRegisteredUsers = () => {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

/**
 * Save newly registered user to development storage
 */
const saveRegisteredUser = (userRecord) => {
  try {
    const existing = getRegisteredUsers();
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify([...existing, userRecord]));
  } catch (err) {
    console.warn('[authService] Failed to persist development user:', err);
  }
};

export const authService = {
  /**
   * Login with email and password
   * @param {Object} credentials - { email, password }
   * @returns {Promise<{ user: Object, token: string }>}
   */
  async login(credentials) {
    const email = credentials?.email?.trim().toLowerCase();
    const password = credentials?.password;

    if (!email || !password) {
      throw new Error('Email address and password are required.');
    }

    // Look up in development fixtures first, then in dynamically registered accounts
    const allUsers = [...DEV_USERS, ...getRegisteredUsers()];
    const matched = allUsers.find((u) => u.email.toLowerCase() === email);

    if (!matched) {
      throw new Error('Invalid email or password. Please verify your credentials.');
    }

    if (matched.password !== password) {
      throw new Error('Invalid email or password. Please verify your credentials.');
    }

    // Standard frontend user shape: { id, name, email, role }
    const user = {
      id: matched.id,
      name: matched.name,
      email: matched.email,
      role: matched.role
    };

    const sessionData = {
      token: `dev-token-${user.id}-${Date.now()}`,
      user
    };

    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    } catch (err) {
      console.warn('[authService] Could not write session to localStorage:', err);
    }

    return sessionData;
  },

  /**
   * Register a new volunteer account
   * @param {Object} userData - { fullName, email, password, phone, location }
   * @returns {Promise<{ user: Object, token: string }>}
   */
  async register(userData) {
    const fullName = userData?.fullName?.trim();
    const email = userData?.email?.trim().toLowerCase();
    const password = userData?.password;

    if (!fullName || !email || !password) {
      throw new Error('Full name, email address, and password are required.');
    }

    // Check for existing account
    const allUsers = [...DEV_USERS, ...getRegisteredUsers()];
    if (allUsers.some((u) => u.email.toLowerCase() === email)) {
      throw new Error('An account with this email address already exists.');
    }

    // Newly registered users receive standard volunteer role per Stage 2 requirements
    const newUser = {
      id: `dev-usr-${Date.now()}`,
      name: fullName,
      email: email,
      role: ROLES.VOLUNTEER
    };

    // Save credentials in development account pool
    saveRegisteredUser({
      ...newUser,
      password: password,
      phone: userData.phone || '',
      location: userData.location || ''
    });

    const sessionData = {
      token: `dev-token-${newUser.id}-${Date.now()}`,
      user: newUser
    };

    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    } catch (err) {
      console.warn('[authService] Could not write session to localStorage:', err);
    }

    return sessionData;
  },

  /**
   * Terminate current session
   * @returns {Promise<{ success: boolean }>}
   */
  async logout() {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (err) {
      console.warn('[authService] Could not clear session from localStorage:', err);
    }
    return { success: true };
  },

  /**
   * Retrieve active user from development session
   * @returns {Object|null}
   */
  getCurrentUser() {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data?.user || null;
    } catch {
      return null;
    }
  },

  /**
   * Restore existing session on initial load or browser refresh
   * @returns {Promise<{ user: Object, token: string }|null>}
   */
  async restoreSession() {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (session?.user && session?.user?.id && session?.user?.role) {
        return session;
      }
      return null;
    } catch {
      return null;
    }
  }
};

export default authService;
