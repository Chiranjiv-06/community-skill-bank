import React from 'react';
import Badge from '../common/Badge';
import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

/**
 * Visual badge for certification verification and validity states
 * @param {string} verificationStatus - 'verified' | 'pending' | 'rejected'
 * @param {string} status - 'active' | 'expired' | 'pending_review'
 */
export const CertificationStatusBadge = ({
  verificationStatus = 'pending',
  status = 'active',
  size = 'md'
}) => {
  if (verificationStatus === 'verified') {
    if (status === 'expired') {
      return (
        <Badge variant="warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <AlertCircle size={13} />
          <span>Expired (Previously Verified)</span>
        </Badge>
      );
    }
    return (
      <Badge variant="success" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
        <CheckCircle2 size={13} />
        <span>Verified Active</span>
      </Badge>
    );
  }

  if (verificationStatus === 'rejected') {
    return (
      <Badge variant="critical" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
        <XCircle size={13} />
        <span>Verification Rejected</span>
      </Badge>
    );
  }

  // Pending
  return (
    <Badge variant="warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
      <Clock size={13} />
      <span>Pending Verification</span>
    </Badge>
  );
};

export default CertificationStatusBadge;
