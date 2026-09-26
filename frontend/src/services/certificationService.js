/**
 * Certification Service (Stage 8)
 * 
 * Provides isolated frontend state management for disaster certifications,
 * professional emergency credentials, and administrative verification workflows.
 * 
 * Maps to future FastAPI endpoints in Stage 17:
 * - GET    /api/v1/certifications
 * - GET    /api/v1/certifications/:id
 * - POST   /api/v1/certifications
 * - POST   /api/v1/certifications/:id/verify
 * - POST   /api/v1/certifications/:id/reject
 * - POST   /api/v1/certifications/:id/revoke
 * - DELETE /api/v1/certifications/:id
 * 
 * DO NOT make real API calls or connect to backend in Stage 8.
 */

import {
  INITIAL_DEV_CERTIFICATIONS,
  CERTIFICATION_STATUSES,
  VERIFICATION_STATUSES,
  CERTIFICATION_CATEGORIES
} from '../data/devTrust.js';
import { realtimeService } from './realtimeService.js';
import { connectivityService } from './connectivityService.js';
import { offlineSyncService } from './offlineSyncService.js';

const STORAGE_KEY = 'csb_dev_certifications';

const getStoredCertifications = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_CERTIFICATIONS));
      return JSON.parse(JSON.stringify(INITIAL_DEV_CERTIFICATIONS));
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[certificationService] Error parsing localStorage certifications, resetting:', err);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_CERTIFICATIONS));
    return JSON.parse(JSON.stringify(INITIAL_DEV_CERTIFICATIONS));
  }
};

const setStoredCertifications = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('[certificationService] Error persisting certifications:', err);
  }
};

export const certificationService = {
  /**
   * Retrieve certifications with optional filters
   * @param {Object} filters - { status, verificationStatus, category, volunteerId, search }
   */
  async getCertifications(filters = {}) {
    let list = getStoredCertifications();

    if (filters.status && filters.status !== 'ALL') {
      list = list.filter((c) => c.status === filters.status);
    }

    if (filters.verificationStatus && filters.verificationStatus !== 'ALL') {
      list = list.filter((c) => c.verificationStatus === filters.verificationStatus);
    }

    if (filters.category && filters.category !== 'ALL') {
      list = list.filter((c) => c.category === filters.category);
    }

    if (filters.volunteerId && filters.volunteerId !== 'ALL') {
      list = list.filter(
        (c) =>
          c.volunteerId === filters.volunteerId ||
          c.volunteerEmail === filters.volunteerId ||
          (filters.volunteerId === 'dev-skl-002' && (c.volunteerName === 'Alex Rivera' || c.volunteerId === 'dev-skl-002'))
      );
    }

    if (filters.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.volunteerName?.toLowerCase().includes(q) ||
          c.issuingOrg?.toLowerCase().includes(q) ||
          c.credentialId?.toLowerCase().includes(q) ||
          c.category?.toLowerCase().includes(q)
      );
    }

    // Sort newest created first
    list.sort((a, b) => new Date(b.createdTime || 0) - new Date(a.createdTime || 0));
    return JSON.parse(JSON.stringify(list));
  },

  /**
   * Retrieve single certification by ID
   */
  async getCertificationById(id) {
    const list = getStoredCertifications();
    const found = list.find((c) => c.id === id);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  },

  /**
   * Retrieve certifications owned by a specific volunteer
   */
  async getCertificationsForVolunteer(volunteerIdOrEmail) {
    return this.getCertifications({ volunteerId: volunteerIdOrEmail });
  },

  /**
   * Retrieve all pending verification items for admin queue
   */
  async getPendingVerifications() {
    return this.getCertifications({ verificationStatus: 'pending' });
  },

  /**
   * Volunteer submits a new certification credential for review
   */
  async submitCertification(data) {
    if (!data.name || !data.name.trim()) {
      throw new Error('Certification name is required.');
    }
    if (!data.issuingOrg || !data.issuingOrg.trim()) {
      throw new Error('Issuing organization is required.');
    }

    const list = getStoredCertifications();
    const now = new Date().toISOString();

    const newCert = {
      id: `cert-${Date.now().toString().slice(-6)}`,
      volunteerId: data.volunteerId || 'dev-skl-002',
      volunteerName: data.volunteerName || 'Alex Rivera',
      volunteerEmail: data.volunteerEmail || 'alex.rivera@skillbank.org',
      name: data.name.trim(),
      category: data.category || 'Incident Command',
      issuingOrg: data.issuingOrg.trim(),
      credentialId: data.credentialId ? data.credentialId.trim() : `CERT-${Date.now().toString().slice(-5)}`,
      issueDate: data.issueDate || now.split('T')[0],
      expiryDate: data.expiryDate || null,
      status: 'pending_review',
      verificationStatus: 'pending',
      verifiedAt: null,
      verifiedBy: null,
      documentName: data.documentName || 'Credential_Document.pdf',
      documentUrl: '#',
      evidenceNotes: data.evidenceNotes ? data.evidenceNotes.trim() : 'Submitted by volunteer for clearance.',
      rejectionReason: null,
      createdTime: now
    };

    list.unshift(newCert);
    setStoredCertifications(list);

    // Stage 10 Real-time event integration
    try {
      realtimeService.dispatchRealtimeEvent({
        type: 'certification',
        priority: 'normal',
        title: 'New Credential Submitted for Review',
        message: `${newCert.volunteerName} submitted "${newCert.name}" (${newCert.issuingOrg}).`,
        targetRole: 'admin',
        entityType: 'certification',
        entityId: newCert.id,
        link: '/admin/verification-queue'
      }).catch(() => {});
    } catch (_) {}

    // Stage 11 Offline Sync queueing
    if (!connectivityService.isOnline()) {
      offlineSyncService.enqueueMutation({
        entityType: 'certification',
        entityId: newCert.id,
        operation: 'CREATE',
        description: `Submitted credential "${newCert.name}" for review`,
        payload: newCert,
        userId: newCert.volunteerId,
        role: 'volunteer'
      }).catch(() => {});
    }

    return JSON.parse(JSON.stringify(newCert));
  },

  /**
   * Admin verifies and approves a certification
   */
  async verifyCertification(id, { adminName = 'Cmdr. Sarah Vance', notes = '' } = {}) {
    const list = getStoredCertifications();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Certification with ID "${id}" not found.`);

    const now = new Date().toISOString();
    list[index].verificationStatus = 'verified';
    list[index].status = 'active';
    list[index].verifiedAt = now;
    list[index].verifiedBy = adminName;
    if (notes) {
      list[index].evidenceNotes = notes;
    }
    list[index].rejectionReason = null;

    setStoredCertifications(list);

    // Stage 10 Real-time event integration
    try {
      realtimeService.dispatchRealtimeEvent({
        type: 'certification',
        priority: 'normal',
        title: 'Credential Verified & Cleared',
        message: `Your credential "${list[index].name}" was approved by ${adminName}.`,
        targetRole: 'volunteer',
        volunteerId: list[index].volunteerId,
        entityType: 'certification',
        entityId: id,
        link: '/volunteer/certifications'
      }).catch(() => {});
    } catch (_) {}

    return JSON.parse(JSON.stringify(list[index]));
  },

  /**
   * Admin rejects a certification submission
   */
  async rejectCertification(id, { adminName = 'Cmdr. Sarah Vance', reason = 'Credential documentation insufficient or unverified.' } = {}) {
    const list = getStoredCertifications();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Certification with ID "${id}" not found.`);

    const now = new Date().toISOString();
    list[index].verificationStatus = 'rejected';
    list[index].status = 'pending_review';
    list[index].verifiedAt = now;
    list[index].verifiedBy = adminName;
    list[index].rejectionReason = reason;

    setStoredCertifications(list);
    return JSON.parse(JSON.stringify(list[index]));
  },

  /**
   * Admin revokes a previously verified certification
   */
  async revokeCertification(id, { adminName = 'Cmdr. Sarah Vance', reason = 'Certification expired or revoked by issuing authority.' } = {}) {
    const list = getStoredCertifications();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Certification with ID "${id}" not found.`);

    const now = new Date().toISOString();
    list[index].verificationStatus = 'rejected';
    list[index].status = 'expired';
    list[index].verifiedAt = now;
    list[index].verifiedBy = adminName;
    list[index].rejectionReason = reason;

    setStoredCertifications(list);
    return JSON.parse(JSON.stringify(list[index]));
  },

  /**
   * Delete or archive certification
   */
  async deleteCertification(id) {
    const list = getStoredCertifications();
    const filtered = list.filter((c) => c.id !== id);
    if (filtered.length === list.length) {
      throw new Error(`Certification with ID "${id}" not found.`);
    }
    setStoredCertifications(filtered);
    return true;
  },

  /**
   * Reset store to initial seed values
   */
  resetDevelopmentCertifications() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_CERTIFICATIONS));
    return JSON.parse(JSON.stringify(INITIAL_DEV_CERTIFICATIONS));
  }
};

export default certificationService;
