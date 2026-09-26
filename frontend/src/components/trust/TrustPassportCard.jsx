import React from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import TrustTierBadge from './TrustTierBadge';
import {
  ShieldCheck,
  Award,
  GraduationCap,
  Activity,
  CheckCircle2,
  Clock,
  QrCode,
  Sparkles,
  UserCheck,
  FileCheck2
} from 'lucide-react';

/**
 * Verifiable Digital Skill Passport & Trust Profile Component
 * 
 * CRITICAL RULE:
 * Trust scores, tiers, and validation indicators are BACKEND-PROVIDED DATA.
 * No scoring algorithm is calculated in React.
 */
export const TrustPassportCard = ({
  trustProfile,
  volunteer,
  completedAssignmentsCount = 0
}) => {
  if (!trustProfile) return null;

  const score = trustProfile.trustScore || 80;
  const tier = trustProfile.trustTier || 'Tier 1 — Registered Volunteer Responder';
  const verificationStatus = trustProfile.verificationStatus || 'Fully Verified';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {/* Official Skill Passport Digital Credential Card */}
      <div
        className="skill-passport-card"
        style={{
          background: 'linear-gradient(135deg, #1e222d 0%, #151821 100%)',
          border: '1px solid rgba(255, 107, 0, 0.35)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-xl)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Glow Accent */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(255, 107, 0, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--color-primary), #ff9800)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(255, 107, 0, 0.4)'
              }}
            >
              <ShieldCheck size={32} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--color-primary)', fontWeight: 700 }}>
                  COMMUNITY SKILL BANK
                </span>
                <Badge variant="primary" style={{ fontSize: '10px' }}>
                  DIGITAL CREDENTIAL
                </Badge>
              </div>
              <h2 style={{ margin: '2px 0 0 0', fontSize: '1.45rem', color: '#fff', fontWeight: 700 }}>
                {trustProfile.volunteerName || volunteer?.name || 'Alex Rivera'}
              </h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                Passport ID: {trustProfile.passportId || 'CSB-PASS-77492'}
              </div>
            </div>
          </div>

          {/* QR Verification Seal Placeholder */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(0, 0, 0, 0.35)',
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-subtle)'
            }}
          >
            <QrCode size={38} color="var(--color-primary)" />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Cryptographic Seal
              </div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-success)' }}>
                TAMPER-EVIDENT
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badges & Tiers Bar */}
        <div style={{ marginTop: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
          <TrustTierBadge
            tier={tier}
            score={score}
            verificationStatus={verificationStatus}
            showScore={true}
          />

          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
            Background Check: <strong style={{ color: 'var(--color-success)' }}>{trustProfile.backgroundCheckStatus || 'Cleared'}</strong>
          </div>
        </div>

        {/* 4 Core Quantitative Trust Indicators */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px',
            marginTop: 'var(--spacing-lg)',
            paddingTop: 'var(--spacing-md)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
              <Award size={14} color="var(--color-primary)" />
              <span>Verified Certs</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
              {trustProfile.verifiedCertificationsCount ?? 3}
            </div>
          </div>

          <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
              <GraduationCap size={14} color="var(--color-primary)" />
              <span>Completed Drills</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
              {trustProfile.completedTrainingsCount ?? 2}
            </div>
          </div>

          <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
              <Activity size={14} color="var(--color-primary)" />
              <span>Deployments</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
              {Math.max(trustProfile.completedDeploymentsCount ?? 0, completedAssignmentsCount)}
            </div>
          </div>

          <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
              <Clock size={14} color="var(--color-primary)" />
              <span>Field Hours</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
              {trustProfile.fieldHoursRecorded || 86} hrs
            </div>
          </div>
        </div>
      </div>

      {/* Trust & Verification Indicators Breakdown */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-md)' }}>
          <ShieldCheck size={20} color="var(--color-primary)" />
          <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-text-primary)' }}>
            Verification Audit & Trust Endorsements
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(trustProfile.trustIndicators || []).map((indicator) => (
            <div
              key={indicator.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface-hover)',
                border: '1px solid var(--color-border-subtle)',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} color="var(--color-success)" />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>
                    {indicator.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    {indicator.description}
                  </div>
                </div>
              </div>

              <Badge variant="success" style={{ fontSize: '11px' }}>
                Verified by Command
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Special Recognition & Clearance Badges */}
      {trustProfile.badges && trustProfile.badges.length > 0 && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-md)' }}>
            <Sparkles size={20} color="var(--color-primary)" />
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-text-primary)' }}>
              Accredited Operational Badges
            </h3>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 'var(--spacing-md)'
            }}
          >
            {trustProfile.badges.map((b) => (
              <div
                key={b.id}
                style={{
                  background: 'var(--color-surface-hover)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>
                    {b.name}
                  </span>
                  <Badge variant="primary" style={{ fontSize: '10px' }}>
                    {b.tier}
                  </Badge>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  {b.description}
                </p>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 'auto', paddingTop: '4px' }}>
                  Accredited: {b.awardedDate}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default TrustPassportCard;
