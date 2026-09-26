import React from 'react';
import Badge from '../common/Badge';
import { ShieldCheck, ShieldAlert, Award } from 'lucide-react';

/**
 * Trust Tier & Score Badge
 * CRITICAL: Trust score is backend-provided data; NOT calculated in React.
 */
export const TrustTierBadge = ({
  tier = 'Tier 1 — Registered Volunteer',
  score = 70,
  verificationStatus = 'Fully Verified',
  showScore = true
}) => {
  const isTier3 = tier.includes('Tier 3');
  const isTier2 = tier.includes('Tier 2');

  const variant = isTier3 ? 'primary' : isTier2 ? 'info' : 'neutral';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <Badge variant={variant} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
        <Award size={13} />
        <span>{tier.split('—')[0].trim()}</span>
      </Badge>

      {showScore && typeof score === 'number' && (
        <Badge variant={score >= 90 ? 'success' : score >= 75 ? 'primary' : 'warning'} style={{ fontWeight: 700 }}>
          Trust Score: {score}/100
        </Badge>
      )}

      {verificationStatus === 'Fully Verified' ? (
        <Badge variant="success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <ShieldCheck size={12} />
          <span>{verificationStatus}</span>
        </Badge>
      ) : (
        <Badge variant="warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <ShieldAlert size={12} />
          <span>{verificationStatus}</span>
        </Badge>
      )}
    </div>
  );
};

export default TrustTierBadge;
