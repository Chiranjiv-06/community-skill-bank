/**
 * Isolated Development Data for Stage 8 — Certification + Training + Trust
 * 
 * IMPORTANT:
 * - This file contains development fixtures for frontend state initialization.
 * - Trust scores and metrics are development/backend-provided fixtures.
 * - DO NOT calculate trust scores in React.
 */

export const CERTIFICATION_CATEGORIES = [
  'Incident Command',
  'Medical & Triage',
  'Search & Rescue',
  'Telecommunications',
  'Hazardous Materials',
  'Logistics & Shelter',
  'Drone & Aerial'
];

export const CERTIFICATION_STATUSES = ['active', 'expired', 'pending_review'];

export const VERIFICATION_STATUSES = ['verified', 'pending', 'rejected'];

export const TRAINING_STATUSES = ['not_started', 'in_progress', 'completed'];

export const INITIAL_DEV_CERTIFICATIONS = [
  {
    id: 'cert-801',
    volunteerId: 'dev-skl-002',
    volunteerName: 'Alex Rivera',
    volunteerEmail: 'alex.rivera@skillbank.org',
    name: 'FEMA ICS-100: Introduction to Incident Command',
    category: 'Incident Command',
    issuingOrg: 'Federal Emergency Management Agency (FEMA)',
    credentialId: 'FEMA-EMI-ICS100-994821',
    issueDate: '2023-04-12',
    expiryDate: '2027-04-12',
    status: 'active',
    verificationStatus: 'verified',
    verifiedAt: '2023-04-14T09:30:00Z',
    verifiedBy: 'Cmdr. Sarah Vance',
    documentName: 'FEMA_ICS100_ARivera.pdf',
    documentUrl: '#',
    evidenceNotes: 'Official Emergency Management Institute certificate verified via EMI student transcript portal.',
    rejectionReason: null,
    createdTime: '2023-04-12T14:20:00Z'
  },
  {
    id: 'cert-802',
    volunteerId: 'dev-skl-002',
    volunteerName: 'Alex Rivera',
    volunteerEmail: 'alex.rivera@skillbank.org',
    name: 'Swift Water Rescue Technician (NFPA 1670)',
    category: 'Search & Rescue',
    issuingOrg: 'Rescue 3 International',
    credentialId: 'R3I-SRT-2023-8812',
    issueDate: '2023-08-20',
    expiryDate: '2026-08-20',
    status: 'active',
    verificationStatus: 'verified',
    verifiedAt: '2023-08-22T11:15:00Z',
    verifiedBy: 'Cmdr. Sarah Vance',
    documentName: 'Rescue3_SRT_ARivera.pdf',
    documentUrl: '#',
    evidenceNotes: 'Practical river operations and high-line rescue qualification checked against national instructor database.',
    rejectionReason: null,
    createdTime: '2023-08-20T16:00:00Z'
  },
  {
    id: 'cert-803',
    volunteerId: 'dev-skl-002',
    volunteerName: 'Alex Rivera',
    volunteerEmail: 'alex.rivera@skillbank.org',
    name: 'BLS / ACLS Healthcare Provider & CPR',
    category: 'Medical & Triage',
    issuingOrg: 'American Heart Association (AHA)',
    credentialId: 'AHA-BLS-449102-AR',
    issueDate: '2024-01-10',
    expiryDate: '2026-01-10',
    status: 'active',
    verificationStatus: 'verified',
    verifiedAt: '2024-01-12T10:00:00Z',
    verifiedBy: 'Cmdr. Sarah Vance',
    documentName: 'AHA_BLS_Card_2024.pdf',
    documentUrl: '#',
    evidenceNotes: 'eCard verified via AHA verification portal; ACLS adult resuscitation module completed.',
    rejectionReason: null,
    createdTime: '2024-01-10T11:00:00Z'
  },
  {
    id: 'cert-804',
    volunteerId: 'dev-skl-002',
    volunteerName: 'Alex Rivera',
    volunteerEmail: 'alex.rivera@skillbank.org',
    name: 'FAA Part 107 Remote Pilot (Drone Operations)',
    category: 'Drone & Aerial',
    issuingOrg: 'Federal Aviation Administration (FAA)',
    credentialId: 'FAA-RP-4820199',
    issueDate: '2024-09-18',
    expiryDate: '2026-09-18',
    status: 'pending_review',
    verificationStatus: 'pending',
    verifiedAt: null,
    verifiedBy: null,
    documentName: 'FAA_Part107_License_Copy.pdf',
    documentUrl: '#',
    evidenceNotes: 'Submitted for night flight and disaster thermal reconnaissance clearance. Awaiting admin review.',
    rejectionReason: null,
    createdTime: '2026-09-18T10:30:00Z'
  },
  {
    id: 'cert-805',
    volunteerId: 'vol-rec-001',
    volunteerName: 'Marcus Vance',
    volunteerEmail: 'marcus.vance@incidentops.net',
    name: 'FEMA ICS-200: ICS for Single Resources',
    category: 'Incident Command',
    issuingOrg: 'Federal Emergency Management Agency (FEMA)',
    credentialId: 'FEMA-EMI-ICS200-551928',
    issueDate: '2023-02-14',
    expiryDate: '2027-02-14',
    status: 'active',
    verificationStatus: 'verified',
    verifiedAt: '2023-02-16T14:00:00Z',
    verifiedBy: 'Cmdr. Sarah Vance',
    documentName: 'ICS200_MVance.pdf',
    documentUrl: '#',
    evidenceNotes: 'Verified via FEMA EMI National Registry.',
    rejectionReason: null,
    createdTime: '2023-02-14T08:00:00Z'
  },
  {
    id: 'cert-806',
    volunteerId: 'dev-cit-003',
    volunteerName: 'Maria Gonzalez',
    volunteerEmail: 'maria.gonzalez@skillbank.org',
    name: 'Community Emergency Response Team (CERT) Core',
    category: 'Preparedness',
    issuingOrg: 'State Citizen Corps Council',
    credentialId: 'CERT-CA-88219',
    issueDate: '2024-05-10',
    expiryDate: '2027-05-10',
    status: 'active',
    verificationStatus: 'verified',
    verifiedAt: '2024-05-12T15:30:00Z',
    verifiedBy: 'Cmdr. Sarah Vance',
    documentName: 'CERT_Certificate_MGonzalez.pdf',
    documentUrl: '#',
    evidenceNotes: 'Local municipal CERT academy graduation record verified.',
    rejectionReason: null,
    createdTime: '2024-05-10T12:00:00Z'
  },
  {
    id: 'cert-807',
    volunteerId: 'dev-vol-004',
    volunteerName: 'Jordan Lee',
    volunteerEmail: 'jordan.lee@skillbank.org',
    name: 'FCC Amateur Radio Operator — Technician Class',
    category: 'Telecommunications',
    issuingOrg: 'Federal Communications Commission (FCC)',
    credentialId: 'FCC-CALL-KN4XYZ',
    issueDate: '2023-11-05',
    expiryDate: '2033-11-05',
    status: 'pending_review',
    verificationStatus: 'pending',
    verifiedAt: null,
    verifiedBy: null,
    documentName: 'FCC_License_KN4XYZ.pdf',
    documentUrl: '#',
    evidenceNotes: 'Submitted callsign KN4XYZ for emergency mesh network deployment.',
    rejectionReason: null,
    createdTime: '2026-09-20T16:45:00Z'
  },
  {
    id: 'cert-808',
    volunteerId: 'vol-rec-002',
    volunteerName: 'Dr. Elena Rostova',
    volunteerEmail: 'elena.rostova@metrohealth.org',
    name: 'Emergency Medical Dispatch & Advanced Trauma (ATLS)',
    category: 'Medical & Triage',
    issuingOrg: 'American College of Surgeons',
    credentialId: 'ACS-ATLS-99104',
    issueDate: '2024-02-18',
    expiryDate: '2028-02-18',
    status: 'active',
    verificationStatus: 'verified',
    verifiedAt: '2024-02-20T09:00:00Z',
    verifiedBy: 'Cmdr. Sarah Vance',
    documentName: 'ATLS_Certificate_ERostova.pdf',
    documentUrl: '#',
    evidenceNotes: 'Board medical license verified against state medical registry.',
    rejectionReason: null,
    createdTime: '2024-02-18T10:00:00Z'
  }
];

export const INITIAL_DEV_TRAINING_MODULES = [
  {
    id: 'trn-101',
    title: 'Disaster Triage & Mass Casualty Incident (MCI) Protocol',
    category: 'Medical & Triage',
    description: 'Covers START / JumpSTART adult and pediatric triage algorithms, rapid casualty tag prioritization, triage sieve sorting, and evacuation routing under austere disaster conditions.',
    durationHours: 6,
    modulesCount: 4,
    level: 'Advanced',
    certificationRelationship: 'Required for Medical Triage & First Aid Field Deployment',
    prerequisite: 'BLS / ACLS Healthcare Provider',
    coverImage: '/assets/training/triage.svg'
  },
  {
    id: 'trn-102',
    title: 'Emergency Mesh Radio & Tactical Communications Drill',
    category: 'Telecommunications',
    description: 'Hands-on protocols for VHF/UHF tactical repeaters, emergency packet data networks, standardized NATO phonetic transmissions, and off-grid command net operations.',
    durationHours: 4,
    modulesCount: 3,
    level: 'Intermediate',
    certificationRelationship: 'Credits towards Emergency Telecommunications Clearance',
    prerequisite: 'None',
    coverImage: '/assets/training/radio.svg'
  },
  {
    id: 'trn-103',
    title: 'Swift Water & Urban Flood Staging Safety',
    category: 'Search & Rescue',
    description: 'Comprehensive river hazard identification, personal flotation equipment (PPE) inspection, throw-bag rescue dynamics, and perimeter safety zones for rapid flood surges.',
    durationHours: 8,
    modulesCount: 5,
    level: 'Advanced',
    certificationRelationship: 'Refresher for Swift Water Rescue Technician (NFPA 1670)',
    prerequisite: 'Swift Water Certification',
    coverImage: '/assets/training/water.svg'
  },
  {
    id: 'trn-104',
    title: 'Community Emergency Response Team (CERT) Basics',
    category: 'Preparedness',
    description: 'Foundational citizen disaster readiness: utility shutoffs, basic fire suppression, disaster psychology, light search and rescue, and team organization.',
    durationHours: 16,
    modulesCount: 8,
    level: 'Foundational',
    certificationRelationship: 'Pre-requisite for CERT National Badge',
    prerequisite: 'None',
    coverImage: '/assets/training/cert.svg'
  },
  {
    id: 'trn-105',
    title: 'Incident Command Post (ICP) Staging & Logistics Management',
    category: 'Incident Command',
    description: 'Covers resource staging, responder credential check-in, tracking demobilization phases, and incident briefing dissemination in accordance with NIMS guidelines.',
    durationHours: 5,
    modulesCount: 4,
    level: 'Intermediate',
    certificationRelationship: 'NIMS / FEMA ICS-100 Compliant Refresher',
    prerequisite: 'FEMA ICS-100',
    coverImage: '/assets/training/logistics.svg'
  },
  {
    id: 'trn-106',
    title: 'Hazardous Materials Awareness & Evacuation Boundaries',
    category: 'Hazardous Materials',
    description: 'DOT Emergency Response Guidebook (ERG) navigation, chemical plume perimeter calculations, and civilian evacuation safety corridors.',
    durationHours: 6,
    modulesCount: 4,
    level: 'Intermediate',
    certificationRelationship: 'HAZMAT Operations Pre-Requisite',
    prerequisite: 'None',
    coverImage: '/assets/training/hazmat.svg'
  }
];

export const INITIAL_DEV_VOLUNTEER_TRAINING = [
  {
    id: 'vtr-901',
    volunteerId: 'dev-skl-002',
    trainingId: 'trn-101',
    status: 'completed',
    progressPercentage: 100,
    startedAt: '2024-03-01T08:00:00Z',
    completedAt: '2024-03-05T17:30:00Z',
    score: '98%',
    lastModuleCompleted: 4
  },
  {
    id: 'vtr-902',
    volunteerId: 'dev-skl-002',
    trainingId: 'trn-103',
    status: 'completed',
    progressPercentage: 100,
    startedAt: '2024-04-10T09:00:00Z',
    completedAt: '2024-04-12T16:00:00Z',
    score: '100%',
    lastModuleCompleted: 5
  },
  {
    id: 'vtr-903',
    volunteerId: 'dev-skl-002',
    trainingId: 'trn-102',
    status: 'in_progress',
    progressPercentage: 66,
    startedAt: '2026-09-10T14:00:00Z',
    completedAt: null,
    score: null,
    lastModuleCompleted: 2
  },
  {
    id: 'vtr-904',
    volunteerId: 'dev-skl-002',
    trainingId: 'trn-105',
    status: 'not_started',
    progressPercentage: 0,
    startedAt: null,
    completedAt: null,
    score: null,
    lastModuleCompleted: 0
  },
  {
    id: 'vtr-905',
    volunteerId: 'dev-cit-003',
    trainingId: 'trn-104',
    status: 'completed',
    progressPercentage: 100,
    startedAt: '2024-05-01T09:00:00Z',
    completedAt: '2024-05-08T18:00:00Z',
    score: '92%',
    lastModuleCompleted: 8
  },
  {
    id: 'vtr-906',
    volunteerId: 'dev-vol-004',
    trainingId: 'trn-102',
    status: 'in_progress',
    progressPercentage: 33,
    startedAt: '2026-09-15T11:00:00Z',
    completedAt: null,
    score: null,
    lastModuleCompleted: 1
  }
];

export const INITIAL_DEV_TRUST_PROFILES = [
  {
    volunteerId: 'dev-skl-002',
    volunteerName: 'Alex Rivera',
    volunteerEmail: 'alex.rivera@skillbank.org',
    passportId: 'CSB-PASS-77492',
    trustTier: 'Tier 3 — Verified Tactical Specialist',
    trustScore: 96, // Backend-provided fixture. NOT calculated in React.
    verificationStatus: 'Fully Verified',
    identityVerified: true,
    backgroundCheckStatus: 'Cleared (National FBI/DOJ, Valid thru 2027)',
    backgroundCheckDate: '2024-01-15',
    lastAuditDate: '2026-09-22T08:00:00Z',
    verifiedCertificationsCount: 3,
    pendingCertificationsCount: 1,
    completedTrainingsCount: 2,
    inProgressTrainingsCount: 1,
    completedDeploymentsCount: 14,
    fieldHoursRecorded: 86,
    trustIndicators: [
      {
        id: 'ind-1',
        title: 'National Identity Verification',
        category: 'Identity',
        status: 'verified',
        description: 'Government ID and biometric identity check verified.'
      },
      {
        id: 'ind-2',
        title: 'Background & Vulnerable Sector Clearance',
        category: 'Compliance',
        status: 'verified',
        description: 'Clean national background check on file with Incident Command.'
      },
      {
        id: 'ind-3',
        title: 'FEMA & State Accredited Credentials',
        category: 'Certifications',
        status: 'verified',
        description: '3 officially accredited active emergency certifications.'
      },
      {
        id: 'ind-4',
        title: 'Zero Incident Operational Record',
        category: 'Safety',
        status: 'verified',
        description: '14 incident deployments completed with 100% adherence to safety guidelines.'
      },
      {
        id: 'ind-5',
        title: 'Incident Command Staging Endorsements',
        category: 'Endorsement',
        status: 'verified',
        description: 'Recommended by Command Staff for high-hazard rescue operations.'
      }
    ],
    badges: [
      {
        id: 'bdg-1',
        name: 'Rapid Surge Responder',
        category: 'Deployment',
        tier: 'Gold',
        icon: 'Zap',
        awardedDate: '2024-02-01',
        description: 'Consistently mobilizes within 20 minutes of incident declaration.'
      },
      {
        id: 'bdg-2',
        name: 'Swift Water Rescue Specialist',
        category: 'Technical',
        tier: 'Specialist',
        icon: 'Waves',
        awardedDate: '2023-08-25',
        description: 'Verified NFPA 1670 technician with river and flood evacuation experience.'
      },
      {
        id: 'bdg-3',
        name: 'Incident Response Veteran',
        category: 'Experience',
        tier: 'Silver',
        icon: 'Award',
        awardedDate: '2024-06-15',
        description: 'Participated in over 10 active tactical emergency operations.'
      },
      {
        id: 'bdg-4',
        name: 'Disaster Triage Master',
        category: 'Medical',
        tier: 'Gold',
        icon: 'HeartPulse',
        awardedDate: '2024-03-08',
        description: 'Completed Advanced Mass Casualty Incident triage curriculum with 98% score.'
      }
    ]
  },
  {
    volunteerId: 'dev-cit-003',
    volunteerName: 'Maria Gonzalez',
    volunteerEmail: 'maria.gonzalez@skillbank.org',
    passportId: 'CSB-PASS-33109',
    trustTier: 'Tier 2 — Operational Community Responder',
    trustScore: 84, // Backend-provided fixture. NOT calculated in React.
    verificationStatus: 'Fully Verified',
    identityVerified: true,
    backgroundCheckStatus: 'Cleared (State Citizen Corps, Valid thru 2027)',
    backgroundCheckDate: '2024-05-10',
    lastAuditDate: '2026-08-15T12:00:00Z',
    verifiedCertificationsCount: 1,
    pendingCertificationsCount: 0,
    completedTrainingsCount: 1,
    inProgressTrainingsCount: 0,
    completedDeploymentsCount: 4,
    fieldHoursRecorded: 28,
    trustIndicators: [
      {
        id: 'ind-cit-1',
        title: 'National Identity Verification',
        category: 'Identity',
        status: 'verified',
        description: 'Government photo identification verified.'
      },
      {
        id: 'ind-cit-2',
        title: 'Community CERT Certification',
        category: 'Certifications',
        status: 'verified',
        description: 'Accredited CERT responder through State Citizen Corps Council.'
      }
    ],
    badges: [
      {
        id: 'bdg-cit-1',
        name: 'CERT Community Champion',
        category: 'Preparedness',
        tier: 'Bronze',
        icon: 'Shield',
        awardedDate: '2024-05-12',
        description: 'Completed CERT core curriculum and shelter staging drills.'
      }
    ]
  },
  {
    volunteerId: 'dev-vol-004',
    volunteerName: 'Jordan Lee',
    volunteerEmail: 'jordan.lee@skillbank.org',
    passportId: 'CSB-PASS-11048',
    trustTier: 'Tier 1 — Registered Volunteer Responder',
    trustScore: 68, // Backend-provided fixture. NOT calculated in React.
    verificationStatus: 'Partially Verified',
    identityVerified: true,
    backgroundCheckStatus: 'Pending Review',
    backgroundCheckDate: null,
    lastAuditDate: '2026-09-20T16:00:00Z',
    verifiedCertificationsCount: 0,
    pendingCertificationsCount: 1,
    completedTrainingsCount: 0,
    inProgressTrainingsCount: 1,
    completedDeploymentsCount: 1,
    fieldHoursRecorded: 6,
    trustIndicators: [
      {
        id: 'ind-vol-1',
        title: 'Identity Verification',
        category: 'Identity',
        status: 'verified',
        description: 'Account email and mobile contact phone verified.'
      },
      {
        id: 'ind-vol-2',
        title: 'Background Verification',
        category: 'Compliance',
        status: 'pending',
        description: 'Background documentation submitted; awaiting verification.'
      }
    ],
    badges: [
      {
        id: 'bdg-vol-1',
        name: 'Ready Volunteer',
        category: 'General',
        tier: 'Member',
        icon: 'UserCheck',
        awardedDate: '2026-09-01',
        description: 'Enrolled in Community Skill Bank emergency volunteer network.'
      }
    ]
  }
];
