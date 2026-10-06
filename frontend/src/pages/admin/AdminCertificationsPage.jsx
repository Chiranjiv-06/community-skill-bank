import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Award, ShieldCheck, Calendar, BookOpen, ExternalLink, Plus } from 'lucide-react';

const RECOGNIZED_STANDARDS = [
  {
    id: 'std-1',
    name: 'FEMA ICS-100: Introduction to Incident Command System',
    category: 'Incident Command',
    issuingAgency: 'Federal Emergency Management Agency (FEMA EMI)',
    accreditationBody: 'National Incident Management System (NIMS)',
    validityYears: 'Non-Expiring (Refresher Recommended Every 4 Years)',
    requiredDocs: 'Official EMI Completion Transcript or Digital Certificate PDF',
    applicableRoles: 'All Incident Command Personnel, Field Responders',
    holdersCount: 142
  },
  {
    id: 'std-2',
    name: 'FEMA ICS-200: ICS for Single Resources and Initial Action Incidents',
    category: 'Incident Command',
    issuingAgency: 'Federal Emergency Management Agency (FEMA EMI)',
    accreditationBody: 'NIMS / National Fire Academy',
    validityYears: 'Non-Expiring',
    requiredDocs: 'Official EMI Certificate with Student ID Verification',
    applicableRoles: 'Staging Area Managers, Task Force Leaders',
    holdersCount: 48
  },
  {
    id: 'std-3',
    name: 'BLS / ACLS Healthcare Provider & Advanced Life Support',
    category: 'Medical & Triage',
    issuingAgency: 'American Heart Association (AHA) / Red Cross',
    accreditationBody: 'International Liaison Committee on Resuscitation (ILCOR)',
    validityYears: '2 Years (Mandatory Biennial Renewal)',
    requiredDocs: 'Official eCard QR code or verified instructor signed card',
    applicableRoles: 'Emergency Medical Technicians, Triage Nurses, Paramedics',
    holdersCount: 86
  },
  {
    id: 'std-4',
    name: 'Swift Water Rescue Technician (NFPA 1670)',
    category: 'Search & Rescue',
    issuingAgency: 'Rescue 3 International / State Fire Marshal',
    accreditationBody: 'National Fire Protection Association (NFPA)',
    validityYears: '3 Years (Practical Recertification Required)',
    requiredDocs: 'Practical Field Evaluation Log & Certified Instructor Stamp',
    applicableRoles: 'Swift Water Rescue Specialists, Flood Evacuation Operators',
    holdersCount: 22
  },
  {
    id: 'std-5',
    name: 'FAA Part 107 Commercial Remote Drone Pilot',
    category: 'Drone & Aerial',
    issuingAgency: 'Federal Aviation Administration (FAA)',
    accreditationBody: 'United States Department of Transportation',
    validityYears: '24 Calendar Months (Recurrent Aeronautical Exam)',
    requiredDocs: 'FAA Airman Certificate Plastic Card or IACRA Temporary Certificate',
    applicableRoles: 'Aerial Thermal Reconnaissance, Hazard Perimeter Scouting',
    holdersCount: 15
  },
  {
    id: 'std-6',
    name: 'FCC Amateur Radio Operator License (Technician / General)',
    category: 'Telecommunications',
    issuingAgency: 'Federal Communications Commission (FCC)',
    accreditationBody: 'National Radio Regulatory Authority',
    validityYears: '10 Years',
    requiredDocs: 'Official FCC License with valid callsign and ULS verification',
    applicableRoles: 'Emergency Mesh Net Operators, Tactical Comm Relay',
    holdersCount: 39
  }
];

export const AdminCertificationsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStandards = RECOGNIZED_STANDARDS.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      s.name.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.issuingAgency.toLowerCase().includes(q)
    );
  });

  return (
    <div className="admin-certifications-page" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {/* Header */}
      <PageHeader
        title="Certification Standards & Accreditation"
        description="Standardized emergency credentials, compliance guidelines, accepted documentation formats, and accreditation authorities."
      />

      {/* Standards Search */}
      <div
        style={{
          background: 'var(--color-surface)',
          padding: '14px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-subtle)'
        }}
      >
        <Input
          placeholder="Search recognized certification standards by title, issuing agency, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Standards Catalog */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
          gap: 'var(--spacing-md)'
        }}
      >
        {filteredStandards.map((std) => (
          <Card
            key={std.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-md)',
              borderLeft: '4px solid var(--color-primary)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <Badge variant="primary" style={{ fontSize: '11px', marginBottom: '6px' }}>
                  {std.category}
                </Badge>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-text-primary)' }}>
                  {std.name}
                </h3>
              </div>
              <Badge variant="success" style={{ fontSize: '11px' }}>
                {std.holdersCount} Active Holders
              </Badge>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '0.86rem',
                color: 'var(--color-text-secondary)',
                background: 'var(--color-surface-hover)',
                padding: '12px',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <div>
                <strong style={{ color: 'var(--color-text-primary)' }}>Issuing Agency:</strong> {std.issuingAgency}
              </div>
              <div>
                <strong style={{ color: 'var(--color-text-primary)' }}>Accreditation:</strong> {std.accreditationBody}
              </div>
              <div>
                <strong style={{ color: 'var(--color-text-primary)' }}>Renewal Cycle:</strong> {std.validityYears}
              </div>
              <div>
                <strong style={{ color: 'var(--color-text-primary)' }}>Target Clearances:</strong> {std.applicableRoles}
              </div>
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
              <strong>Required Evidence:</strong> {std.requiredDocs}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminCertificationsPage;
