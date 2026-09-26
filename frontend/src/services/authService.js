/**
 * Authentication Service
 * 
 * Provides clean frontend authentication boundaries:
 * - login()
 * - register()
 * - logout()
 * - getCurrentUser()
 * - restoreSession()
 * - getStoredToken()
 * 
 * Connects to real FastAPI / PostgreSQL backend via api.js:
 * - POST /auth/login
 * - GET /api/users/me
 * - POST /api/auth/register
 */

import { api } from './api.js';

const SESSION_STORAGE_KEY = 'csb_auth_session';

/**
 * Single normalization point:
 * Backend returns: id, full_name, email, role, phone, location, etc.
 * Frontend expects: id, name, email, role (while keeping all backend properties).
 */
export const normalizeUser = (backendUser) => {
  if (!backendUser) return null;
  return {
    ...backendUser,
    id: backendUser.id !== undefined && backendUser.id !== null ? String(backendUser.id) : '',
    name: backendUser.full_name || backendUser.name || 'Anonymous User',
    role: backendUser.role || 'volunteer',
    email: backendUser.email || '',
  };
};

export const authService = {
  /**
   * Login with email and password
   * Flow:
   * 1. Call POST /auth/login with JSON email/password.
   * 2. Receive access_token.
   * 3. Set the token into the existing api client.
   * 4. Call GET /api/users/me.
   * 5. Normalize the backend user for existing frontend consumers (full_name -> name).
   * 6. Preserve backend fields too where useful.
   * 7. Store the authenticated session safely.
   * 8. Return the structure expected by AuthContext.
   * 
   * @param {Object} credentials - { email, password }
   * @returns {Promise<{ user: Object, token: string }>}
   */
  async login(credentials) {
    const email = credentials?.email?.trim().toLowerCase();
    const password = credentials?.password;

    if (!email || !password) {
      throw new Error('Email address and password are required.');
    }

    try {
      // 1. Call POST /auth/login with JSON email/password
      const loginRes = await api.post('/auth/login', { email, password });

      const token = loginRes?.access_token;
      if (!token) {
        throw new Error('Authentication succeeded but no access token was returned.');
      }

      // 2. Set token on central API client
      api.setToken(token);

      // 3. Call GET /api/users/me
      const meRes = await api.get('/api/users/me');

      // 4. Normalize user model
      const user = normalizeUser(meRes);

      const sessionData = {
        token,
        user
      };

      // 5. Store session in localStorage
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
      } catch (err) {
        console.warn('[authService] Could not write session to localStorage:', err);
      }

      return sessionData;
    } catch (err) {
      api.clearToken();
      if (
        err.message &&
        (err.message.includes('Invalid') ||
          err.message.includes('Incorrect') ||
          err.message.includes('401'))
      ) {
        throw new Error('Invalid email or password. Please verify your credentials.');
      }
      if (
        err.message &&
        (err.message.includes('Failed to fetch') ||
          err.message.includes('NetworkError') ||
          err.message.includes('ECONNREFUSED'))
      ) {
        throw new Error('Unable to connect to authentication server. Please check your network connection.');
      }
      throw new Error(err.message || 'Authentication failed. Please verify your credentials.');
    }
  },

  /**
   * Register a new volunteer account
   * Flow:
   * 1. Call POST /api/auth/register.
   * 2. Do not invent a fake token.
   * 3. Return the backend registration result in a form compatible with existing AuthContext behavior.
   * 4. If the backend does not automatically authenticate after registration, preserve that behavior and let the existing login flow handle authentication.
   * 
   * @param {Object} userData - { fullName, email, password, phone, location }
   * @returns {Promise<{ user: Object, token: null, requiresLogin: boolean }>}
   */
  async register(userData) {
    const fullName = userData?.fullName?.trim() || userData?.full_name?.trim();
    const email = userData?.email?.trim().toLowerCase();
    const password = userData?.password;

    if (!fullName || !email || !password) {
      throw new Error('Full name, email address, and password are required.');
    }

    try {
      const payload = {
        full_name: fullName,
        email,
        password,
        phone: userData.phone || null,
        location: userData.location || null,
        role: userData.role || 'volunteer'
      };

      // 1. Call POST /api/auth/register
      const registerRes = await api.post('/api/auth/register', payload);

      // 2. Normalize backend user representation
      const user = normalizeUser(registerRes);

      // Backend does not issue a JWT upon registration.
      // Return structured result without fake token.
      return {
        user,
        token: null,
        requiresLogin: true
      };
    } catch (err) {
      if (
        err.message &&
        (err.message.includes('already exists') || err.message.includes('400'))
      ) {
        throw new Error(err.message || 'An account with this email address already exists.');
      }
      if (
        err.message &&
        (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))
      ) {
        throw new Error('Unable to connect to registration server. Please check your network connection.');
      }
      throw new Error(err.message || 'Registration failed. Please check your information.');
    }
  },

  /**
   * Terminate current session
   * @returns {Promise<{ success: boolean }>}
   */
  async logout() {
    api.clearToken();
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (err) {
      console.warn('[authService] Could not clear session from localStorage:', err);
    }
    return { success: true };
  },

  /**
   * Retrieve active user from stored session
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
   * Retrieve stored token from session
   * @returns {string|null}
   */
  getStoredToken() {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data?.token || null;
    } catch {
      return null;
    }
  },

  /**
   * Restore existing session on initial load or browser refresh
   * Validates token against GET /api/users/me when possible.
   * @returns {Promise<{ user: Object, token: string }|null>}
   */
  async restoreSession() {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (!session?.token) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }

      // Synchronize token on API client
      api.setToken(session.token);

      try {
        // Validate and refresh user profile from backend
        const meRes = await api.get('/api/users/me');
        const user = normalizeUser(meRes);
        const updatedSession = {
          token: session.token,
          user
        };
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
        return updatedSession;
      } catch (err) {
        console.warn('[authService] Session validation failed on restore:', err.message);
        api.clearToken();
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }
    } catch {
      api.clearToken();
      return null;
    }
  }
};

export default authService;
