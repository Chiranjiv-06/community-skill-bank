import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const AUTH_STATES = {
  UNAUTHENTICATED: 'unauthenticated',
  AUTHENTICATING: 'authenticating',
  AUTHENTICATED: 'authenticated',
  RESTORING_SESSION: 'restoring_session',
  ERROR: 'error'
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState(AUTH_STATES.RESTORING_SESSION);
  const [error, setError] = useState(null);

  /**
   * Restore existing session from storage on mount
   */
  const restoreSession = useCallback(async () => {
    setLoading(true);
    setAuthStatus(AUTH_STATES.RESTORING_SESSION);
    try {
      const session = await authService.restoreSession();
      if (session?.user) {
        setCurrentUser(session.user);
        setAuthStatus(AUTH_STATES.AUTHENTICATED);
        setError(null);
        return session.user;
      } else {
        setCurrentUser(null);
        setAuthStatus(AUTH_STATES.UNAUTHENTICATED);
        return null;
      }
    } catch (err) {
      console.warn('[AuthContext] Session restoration error:', err);
      setCurrentUser(null);
      setAuthStatus(AUTH_STATES.UNAUTHENTICATED);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  /**
   * Login user with credentials
   * @param {Object} credentials - { email, password }
   */
  const login = async (credentials) => {
    setLoading(true);
    setAuthStatus(AUTH_STATES.AUTHENTICATING);
    setError(null);
    try {
      const response = await authService.login(credentials);
      setCurrentUser(response.user);
      setAuthStatus(AUTH_STATES.AUTHENTICATED);
      return response;
    } catch (err) {
      setError(err.message || 'Authentication failed');
      setAuthStatus(AUTH_STATES.ERROR);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register a new user
   * @param {Object} userData - { fullName, email, password, phone, location }
   */
  const register = async (userData) => {
    setLoading(true);
    setAuthStatus(AUTH_STATES.AUTHENTICATING);
    setError(null);
    try {
      const response = await authService.register(userData);
      setCurrentUser(response.user);
      setAuthStatus(AUTH_STATES.AUTHENTICATED);
      return response;
    } catch (err) {
      setError(err.message || 'Registration failed');
      setAuthStatus(AUTH_STATES.ERROR);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user and reset state
   */
  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } finally {
      setCurrentUser(null);
      setError(null);
      setAuthStatus(AUTH_STATES.UNAUTHENTICATED);
      setLoading(false);
    }
  };

  const isAuthenticated = Boolean(currentUser);
  const role = currentUser ? currentUser.role : null;

  return (
    <AuthContext.Provider
      value={{
        // User identity
        currentUser,
        user: currentUser, // Alias for backward compatibility
        role,

        // Status flags
        isAuthenticated,
        loading,
        isLoading: loading, // Alias
        authStatus,
        error,

        // Actions
        login,
        register,
        logout,
        restoreSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
