import React, { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Application Crash Detected]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: '#0B0F17',
            color: '#F9FAFB',
            fontFamily: 'Inter, sans-serif'
          }}
        >
          <div
            style={{
              maxWidth: '560px',
              width: '100%',
              background: '#111827',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '12px',
              padding: '32px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#EF4444' }}>
              Application Render Error
            </h2>
            <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => { window.location.href = '/login'; }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: '#F97316',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Go to Sign In
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#F9FAFB',
                  fontWeight: 600,
                  fontSize: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  cursor: 'pointer'
                }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
