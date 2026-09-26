/**
 * Central API Client Foundation
 * Prepared for future FastAPI / REST / JWT backend integration.
 * In Stage 1, does NOT connect to the actual backend or fail if backend is offline.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.authToken = null;
  }

  setToken(token) {
    this.authToken = token;
  }

  clearToken() {
    this.authToken = null;
  }

  getHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...customHeaders
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const config = {
      ...options,
      headers: this.getHeaders(options.headers)
    };

    try {
      const response = await fetch(url, config);

      // Handle 401 Unauthorized globally
      if (response.status === 401) {
        console.warn('[ApiClient] 401 Unauthorized received. Session expired or unauthenticated.');
      }

      const contentType = response.headers.get('content-type');
      let data = null;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new Error(data?.detail || data?.message || `HTTP error ${response.status}`);
      }

      return data;
    } catch (error) {
      console.warn(`[ApiClient] Request to ${endpoint} failed:`, error.message);
      throw error;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
