import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Flame,
  Users,
  Award,
  Zap,
  ArrowRight,
  CheckCircle2,
  Clock,
  Radio,
  FileCheck2,
  Compass,
  HeartHandshake,
  Activity,
  Layers,
  ChevronRight,
  BadgeAlert
} from 'lucide-react';
import PublicNavbar from '../../components/navigation/PublicNavbar';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { MOCK_STATISTICS } from '../../data/mockData';

export const LandingPage = () => {
  return (
    <div className="landing-wrapper">
      <div className="landing-ambient-glow" aria-hidden="true" />
      <PublicNavbar />

      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-pill">
          <BadgeAlert size={14} />
          <span>Active Civil Defense & Emergency Network</span>
        </div>

        <h1 className="hero-title">
          Mobilizing <span className="text-gradient">Community Skills</span> When Every Second Counts.
        </h1>

        <p className="hero-subtitle">
          Community Skill Bank is an intelligent, high-readiness emergency response platform that
          maps certified volunteer capabilities—from swift-water rescue to trauma care—and rapidly
          mobilizes them to active crisis zones.
        </p>

        <div className="hero-cta-group">
          <Link to="/register">
            <Button variant="primary" size="lg" endIcon={<ArrowRight size={18} />}>
              Register as Volunteer
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" size="lg">
              Access Responder Portal
            </Button>
          </Link>
          <Link to="/admin/dashboard">
            <Button variant="outline" size="lg">
              Incident Command Console
            </Button>
          </Link>
        </div>

        {/* HERO METRICS STRIP */}
        <div className="hero-metrics-strip">
          <div className="metric-card">
            <div className="metric-icon">
              <Flame size={22} />
            </div>
            <div>
              <div className="metric-value">{MOCK_STATISTICS.activeEmergencies} Active</div>
              <div className="metric-label">Incident Dispatches</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">
              <Users size={22} />
            </div>
            <div>
              <div className="metric-value">{MOCK_STATISTICS.registeredVolunteers.toLocaleString()}</div>
              <div className="metric-label">Verified Volunteers</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">
              <Zap size={22} />
            </div>
            <div>
              <div className="metric-value">{MOCK_STATISTICS.skillsIndexed}+</div>
              <div className="metric-label">Emergency Skill Types</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">
              <Clock size={22} />
            </div>
            <div>
              <div className="metric-value">{MOCK_STATISTICS.averageResponseMinutes} min</div>
              <div className="metric-label">Avg. Dispatch Speed</div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM / PURPOSE SECTION */}
      <section className="landing-section" id="purpose" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="landing-section-header">
          <div className="section-tag">THE MISSION</div>
          <h2>Bridging the Vital Gap in First-Hours Disaster Response</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Traditional disaster logistics often face bottlenecks during the golden hour. By maintaining
            a pre-verified repository of citizen skills, emergency services can instantly dispatch
            certified civilian responders to stabilize situations before large-scale units arrive.
          </p>
        </div>

        <div className="value-split">
          <div className="value-card value-card-highlight">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Badge variant="critical">CRITICAL CHALLENGE</Badge>
              <h3 style={{ fontSize: 'var(--font-xl)' }}>Uncoordinated Emergency Volunteerism</h3>
            </div>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
              When a cyclone or seismic incident strikes, thousands of willing citizens arrive at disaster zones,
              yet emergency coordinators have no instant way to verify medical licenses, equipment proficiencies, or
              match skills to acute zone requirements.
            </p>
            <ul className="value-points">
              <li className="value-point-item">
                <CheckCircle2 size={16} className="value-point-icon" />
                <span>Misaligned volunteer assignments causing logistical traffic jams</span>
              </li>
              <li className="value-point-item">
                <CheckCircle2 size={16} className="value-point-icon" />
                <span>Unverified certifications leading to liability and safety risks</span>
              </li>
              <li className="value-point-item">
                <CheckCircle2 size={16} className="value-point-icon" />
                <span>Lack of real-time geo-located dispatch intelligence</span>
              </li>
            </ul>
          </div>

          <div className="value-card" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Badge variant="success">OUR SOLUTION</Badge>
              <h3 style={{ fontSize: 'var(--font-xl)' }}>Algorithmic Skill Bank & Verification</h3>
            </div>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
              Community Skill Bank creates a verified, auditable Skill Passport for every responder.
              When an incident is reported, requirements are parsed and matched with nearby verified
              specialists within seconds.
            </p>
            <ul className="value-points">
              <li className="value-point-item">
                <CheckCircle2 size={16} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }} />
                <span>Instant automated matching based on proximity, credentials & severity</span>
              </li>
              <li className="value-point-item">
                <CheckCircle2 size={16} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }} />
                <span>Standardized FEMA / CERT verified digital Skill Passports</span>
              </li>
              <li className="value-point-item">
                <CheckCircle2 size={16} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }} />
                <span>Offline-ready incident response checklists and mesh sync</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="landing-section" id="how-it-works">
        <div className="landing-section-header">
          <div className="section-tag">WORKFLOW</div>
          <h2>How The Skill Bank Operates</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            A streamlined 4-stage pipeline connecting citizen readiness directly to Incident Command.
          </p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">01</div>
            <h4 className="step-title">Register & Verify</h4>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
              Volunteers input certifications (EMT, radio, heavy machinery) and submit documentation for administrative verification.
            </p>
          </div>

          <div className="step-card">
            <div className="step-num">02</div>
            <h4 className="step-title">Emergency Triaged</h4>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
              Incident Command logs an emergency with exact personnel criteria, skill requirements, and severity classification.
            </p>
          </div>

          <div className="step-card">
            <div className="step-num">03</div>
            <h4 className="step-title">Smart Match & Alert</h4>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
              The platform identifies qualified responders within range and dispatches immediate deployment requests.
            </p>
          </div>

          <div className="step-card">
            <div className="step-num">04</div>
            <h4 className="step-title">On-Ground Action</h4>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
              Volunteers check into staging areas, coordinate tasks, log hours, and build community resilience records.
            </p>
          </div>
        </div>
      </section>

      {/* KEY CAPABILITIES */}
      <section className="landing-section" id="capabilities" style={{ background: 'var(--bg-surface)' }}>
        <div className="landing-section-header">
          <div className="section-tag">CAPABILITIES</div>
          <h2>Engineered for High-Stakes Coordination</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Purpose-built tools designed for both field volunteers and municipal emergency operations centers.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-box">
              <Zap size={24} />
            </div>
            <h3 className="feature-title">Verified Skill Bank</h3>
            <p className="feature-description">
              Multi-tiered taxonomy cataloging over 80+ disaster disciplines: swift water rescue, emergency trauma triage, ham radio, logistics, and counseling.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <Flame size={24} />
            </div>
            <h3 className="feature-title">Incident Command Monitoring</h3>
            <p className="feature-description">
              Real-time situational dashboards for emergency managers to monitor active dispatches, fulfillment quotas, and field volunteer safety.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <Award size={24} />
            </div>
            <h3 className="feature-title">Digital Skill Passport</h3>
            <p className="feature-description">
              Tamper-evident volunteer records showcasing accredited training, active hours, peer endorsements, and incident response histories.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <Compass size={24} />
            </div>
            <h3 className="feature-title">Disaster Simulation</h3>
            <p className="feature-description">
              Pre-disaster scenario stress-testing to detect community skill shortages before actual flood or earthquake events hit.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <Radio size={24} />
            </div>
            <h3 className="feature-title">Offline Field Sync</h3>
            <p className="feature-description">
              Local-first architecture designed to operate seamlessly when cellular towers and power grids are temporarily compromised.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-box">
              <Activity size={24} />
            </div>
            <h3 className="feature-title">Auditable Resilience Metrics</h3>
            <p className="feature-description">
              Comprehensive analytics, system metrics, and audit logs ensuring full transparency and compliance with civil defense guidelines.
            </p>
          </div>
        </div>
      </section>

      {/* COMMUNITY VALUE & EMERGENCY RESPONSE VALUE */}
      <section className="landing-section" id="value">
        <div className="value-split">
          <div className="value-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <HeartHandshake size={24} color="var(--color-primary)" />
              <h3 style={{ fontSize: 'var(--font-xl)' }}>Volunteer & Citizen Value</h3>
            </div>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Empowering individuals to protect their neighbors with structure, purpose, and recognized credentials.
            </p>
            <ul className="value-points">
              <li className="value-point-item">
                <CheckCircle2 size={16} className="value-point-icon" />
                <span>Direct, meaningful deployment where your specific abilities are desperately needed</span>
              </li>
              <li className="value-point-item">
                <CheckCircle2 size={16} className="value-point-icon" />
                <span>Earn recognized CERT and emergency management training hours</span>
              </li>
              <li className="value-point-item">
                <CheckCircle2 size={16} className="value-point-icon" />
                <span>Build lasting neighbourhood resilience networks and community trust</span>
              </li>
            </ul>
          </div>

          <div className="value-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <ShieldAlert size={24} color="var(--color-primary)" />
              <h3 style={{ fontSize: 'var(--font-xl)' }}>Emergency Agency Value</h3>
            </div>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Giving fire departments, municipalities, and disaster response directors force-multiplier capabilities.
            </p>
            <ul className="value-points">
              <li className="value-point-item">
                <CheckCircle2 size={16} className="value-point-icon" />
                <span>Reduce surge dispatch times from hours to under 15 minutes</span>
              </li>
              <li className="value-point-item">
                <CheckCircle2 size={16} className="value-point-icon" />
                <span>Ensure legal and safety compliance through verified credentials before mobilization</span>
              </li>
              <li className="value-point-item">
                <CheckCircle2 size={16} className="value-point-icon" />
                <span>Gain bird’s-eye analytics of community preparedness and resource gaps</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="landing-section" style={{ textAlign: 'center', padding: 'var(--space-16) var(--space-6)' }}>
        <div
          className="glass-panel-elevated"
          style={{
            maxWidth: '920px',
            margin: '0 auto',
            padding: 'var(--space-12) var(--space-8)',
            border: '1px solid var(--border-highlight)',
            background: 'linear-gradient(145deg, rgba(249, 115, 22, 0.08) 0%, rgba(14, 19, 31, 0.95) 100%)'
          }}
        >
          <div className="hero-pill" style={{ margin: '0 auto var(--space-4)' }}>
            <span>Join The Frontline of Community Defense</span>
          </div>
          <h2 style={{ fontSize: 'var(--font-3xl)', marginBottom: 'var(--space-4)' }}>
            Be Ready Before The Siren Sounds.
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto var(--space-6)' }}>
            Whether you have specialized medical training, search rescue capabilities, or simply a willing hand to organize emergency distribution, your community needs you.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register">
              <Button variant="primary" size="lg" endIcon={<ArrowRight size={18} />}>
                Create Volunteer Account
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg">
                Sign In to Skill Bank
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="public-footer">
        <div className="footer-content">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/logo.svg" alt="CSB Shield" width="32" height="32" />
              <span style={{ fontWeight: 800, fontSize: 'var(--font-base)' }}>COMMUNITY SKILL BANK</span>
            </div>
            <p className="footer-brand-desc">
              A specialized civil response platform dedicated to organizing, verifying, and mobilizing citizen skills during natural disasters and civic emergencies.
            </p>
          </div>

          <div>
            <div className="footer-col-title">Responders</div>
            <ul className="footer-links">
              <li><Link to="/register" className="footer-link">Register Volunteer</Link></li>
              <li><Link to="/volunteer/dashboard" className="footer-link">Volunteer Dashboard</Link></li>
              <li><Link to="/volunteer/skills" className="footer-link">Skill Registry</Link></li>
              <li><Link to="/volunteer/skill-passport" className="footer-link">Skill Passport</Link></li>
            </ul>
          </div>

          <div>
            <div className="footer-col-title">Incident Command</div>
            <ul className="footer-links">
              <li><Link to="/admin/dashboard" className="footer-link">Command Center</Link></li>
              <li><Link to="/admin/emergencies" className="footer-link">Active Emergencies</Link></li>
              <li><Link to="/admin/matching" className="footer-link">Matching Engine</Link></li>
              <li><Link to="/admin/analytics" className="footer-link">Readiness Analytics</Link></li>
            </ul>
          </div>

          <div>
            <div className="footer-col-title">Platform</div>
            <ul className="footer-links">
              <li><Link to="/login" className="footer-link">Responder Login</Link></li>
              <li><a href="#how-it-works" className="footer-link">How It Works</a></li>
              <li><a href="#capabilities" className="footer-link">Capabilities</a></li>
              <li><span className="footer-link" style={{ opacity: 0.6 }}>Stage 1 Foundation</span></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} Community Skill Bank — Disaster & Emergency Response. All rights reserved.</div>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <span>Civil Protection Directive</span>
            <span>·</span>
            <span>Emergency Protocols</span>
            <span>·</span>
            <span>Verified System Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
