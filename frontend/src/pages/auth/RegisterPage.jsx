import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    location: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Backend registers account and assigns default volunteer role
      await register(formData);
      navigate('/volunteer/dashboard');
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please check your information.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card" style={{ maxWidth: '540px' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
            <ArrowLeft size={14} /> Back to Public Home
          </Link>
        </div>

        <div className="auth-header">
          <img src="/logo.svg" alt="CSB Shield Logo" className="auth-logo" />
          <h2 style={{ fontSize: 'var(--font-2xl)' }}>Volunteer Registration</h2>
          <p className="auth-subtitle">
            Join the Community Disaster & Emergency Response Bank
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
            label="Full Name"
            id="reg-fullname"
            required
            placeholder="e.g. Maria Gonzalez"
            value={formData.fullName}
            onChange={handleChange('fullName')}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <Input
              label="Email Address"
              id="reg-email"
              type="email"
              required
              placeholder="maria@example.com"
              value={formData.email}
              onChange={handleChange('email')}
            />
            <Input
              label="Phone Number"
              id="reg-phone"
              type="tel"
              required
              placeholder="+1 (555) 000-0000"
              value={formData.phone}
              onChange={handleChange('phone')}
            />
          </div>

          <Input
            label="Home Sector / Municipality Location"
            id="reg-location"
            required
            placeholder="e.g. District 4 - Northern Basin"
            helperText="Used for automated incident proximity calculation"
            value={formData.location}
            onChange={handleChange('location')}
          />

          <Input
            label="Password"
            id="reg-password"
            type="password"
            required
            placeholder="Create secure password"
            value={formData.password}
            onChange={handleChange('password')}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            style={{ width: '100%', marginTop: 'var(--space-2)' }}
            isLoading={isSubmitting}
            endIcon={<ArrowRight size={18} />}
          >
            Complete Registration
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
