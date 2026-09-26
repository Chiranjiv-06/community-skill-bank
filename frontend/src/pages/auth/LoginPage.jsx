import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/roles';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Authenticates with backend (role is determined by backend user record)
      const result = await login({ email, password });
      
      // Route user to appropriate application area based on backend-provided role
      if (result?.user?.role === ROLES.ADMIN) {
        navigate('/admin/dashboard');
      } else {
        navigate('/volunteer/dashboard');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
            <ArrowLeft size={14} /> Back to Public Home
          </Link>
        </div>

        <div className="auth-header">
          <img src="/logo.svg" alt="CSB Shield Logo" className="auth-logo" />
          <h2 style={{ fontSize: 'var(--font-2xl)' }}>Sign In to Skill Bank</h2>
          <p className="auth-subtitle">
            Disaster & Emergency Response Coordination
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--badge-critical-bg)',
              border: '1px solid var(--badge-critical-border)',
              color: 'var(--badge-critical-text)',
              fontSize: 'var(--font-xs)',
              marginBottom: 'var(--space-4)'
            }}
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            id="login-email"
            type="email"
            required
            placeholder="responder@skillbank.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Password"
            id="login-password"
            type="password"
            required
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-5)' }}>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', cursor: 'pointer' }}>
              Forgot credentials? Contact Incident Command
            </span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            style={{ width: '100%' }}
            isLoading={isSubmitting}
            endIcon={<ArrowRight size={18} />}
          >
            Sign In to Console
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
          New emergency responder?{' '}
          <Link to="/register" style={{ fontWeight: 600 }}>
            Register as Volunteer
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
