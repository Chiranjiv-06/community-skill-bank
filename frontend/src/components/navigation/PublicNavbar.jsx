import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, ArrowRight, ShieldCheck, HeartHandshake } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Button from '../common/Button';
import IconButton from '../common/IconButton';

export const PublicNavbar = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="public-header">
      <div className="public-header-inner">
        <Link to="/" className="public-brand">
          <img src="/logo.svg" alt="Community Skill Bank Shield" width="38" height="38" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 800, fontSize: 'var(--font-base)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              COMMUNITY SKILL BANK
            </span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.06em' }}>
              DISASTER & EMERGENCY RESPONSE
            </span>
          </div>
        </Link>

        <nav>
          <ul className="public-nav-links">
            <li><a href="#how-it-works" className="public-nav-link">How It Works</a></li>
            <li><a href="#capabilities" className="public-nav-link">Capabilities</a></li>
            <li><a href="#value" className="public-nav-link">Community Impact</a></li>
            <li><Link to="/volunteer/dashboard" className="public-nav-link">Volunteer Demo</Link></li>
            <li><Link to="/admin/dashboard" className="public-nav-link">Command Center</Link></li>
          </ul>
        </nav>

        <div className="public-header-actions">
          <IconButton
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            size="md"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </IconButton>

          <Link to="/login">
            <Button variant="ghost" size="sm">
              Login
            </Button>
          </Link>

          <Link to="/register">
            <Button variant="primary" size="sm" endIcon={<ArrowRight size={15} />}>
              Register
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default PublicNavbar;
