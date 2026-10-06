/**
 * Community Learning & Preparedness Structured Dataset
 * 
 * Truthful, maintainable directory of official portals, reference guides,
 * and reputable emergency-response learning resources.
 * 
 * NOTE:
 * - External resources point to official organization portals.
 * - No fake event dates, fictional news headlines, or simulated partnerships.
 * - All external links open directly to authorized agency domains in a new tab.
 */

export const EXTERNAL_RESOURCES = {
  courses: [
    {
      id: 'ext-course-01',
      title: 'OpenWHO Emergency Learning Channels',
      organization: 'World Health Organization (WHO)',
      subType: 'Open / Free Courses',
      topic: 'Health Emergencies & Outbreak Response',
      badges: ['EXTERNAL RESOURCE', 'FREE COURSE', 'OFFICIAL SOURCE'],
      description: 'Browse free self-paced courses and operational learning materials on epidemic management, outbreak containment, and frontline responder hygiene.',
      url: 'https://openwho.org/',
      actionLabel: 'Open WHO Course Catalog'
    },
    {
      id: 'ext-course-02',
      title: 'FEMA Emergency Management Institute (EMI)',
      organization: 'Federal Emergency Management Agency (FEMA)',
      subType: 'Open / Free Courses',
      topic: 'Incident Command System (ICS / NIMS)',
      badges: ['EXTERNAL RESOURCE', 'FREE COURSE', 'OFFICIAL SOURCE'],
      description: 'Access the Independent Study program (IS-100, IS-200, IS-700) for free self-paced operational training in incident management and emergency operations.',
      url: 'https://training.fema.gov/emi.aspx',
      actionLabel: 'Open FEMA Catalog'
    },
    {
      id: 'ext-course-03',
      title: 'IFRC Learning Platform',
      organization: 'International Federation of Red Cross & Red Crescent',
      subType: 'Open / Free Courses',
      topic: 'Community Preparedness & Humanitarian Relief',
      badges: ['EXTERNAL RESOURCE', 'FREE COURSE', 'OFFICIAL SOURCE'],
      description: 'Browse global humanitarian self-study courses covering community disaster risk reduction, volunteer health and safety, and first aid basics.',
      url: 'https://ifrc.org/learning-platform',
      actionLabel: 'Open IFRC Catalog'
    }
  ],
  guides: [
    {
      id: 'ext-guide-01',
      title: 'UNDRR Disaster Risk Reduction Field Guidelines',
      organization: 'UN Office for Disaster Risk Reduction (UNDRR)',
      subType: 'Guides',
      topic: 'Disaster Risk Reduction & Resilience',
      badges: ['EXTERNAL RESOURCE', 'GUIDE', 'OFFICIAL SOURCE'],
      description: 'Consult standard operational guidance on community hazard mapping, early warning systems, and local disaster preparedness planning.',
      url: 'https://www.preventionweb.net/',
      actionLabel: 'View DRR Guidelines'
    },
    {
      id: 'ext-guide-02',
      title: 'WHO Psychological First Aid: Guide for Field Responders',
      organization: 'World Health Organization (WHO)',
      subType: 'Guides',
      topic: 'Mental Health & Field Support',
      badges: ['EXTERNAL RESOURCE', 'GUIDE', 'OFFICIAL SOURCE'],
      description: 'Access the official field manual providing practical, evidence-based orientation for responders assisting individuals in acute distress.',
      url: 'https://www.who.int/publications/i/item/9789241548205',
      actionLabel: 'View Field Manual'
    }
  ],
  reference: [
    {
      id: 'ext-ref-01',
      title: 'Sendai Framework for Disaster Risk Reduction (2015-2030)',
      organization: 'United Nations (UN)',
      subType: 'Reference Material',
      topic: 'Global Risk Reduction Benchmarks',
      badges: ['EXTERNAL RESOURCE', 'REFERENCE', 'OFFICIAL SOURCE'],
      description: 'Explore the international framework outlining global priorities to prevent new risk, reduce existing risk, and strengthen resilience.',
      url: 'https://www.undrr.org/implementing-sendai-framework/what-sendai-framework',
      actionLabel: 'View Framework'
    },
    {
      id: 'ext-ref-02',
      title: 'The Sphere Standards: Humanitarian Charter & Minimum Standards',
      organization: 'Sphere Association',
      subType: 'Reference Material',
      topic: 'Humanitarian Response Standards',
      badges: ['EXTERNAL RESOURCE', 'REFERENCE', 'OFFICIAL SOURCE'],
      description: 'Universal humanitarian charter establishing standard benchmarks for water supply, sanitation, shelter, food security, and health services.',
      url: 'https://spherestandards.org/handbook/',
      actionLabel: 'View Sphere Handbook'
    }
  ]
};

export const WORKSHOPS_AND_WEBINARS = {
  upcoming: [
    {
      id: 'ws-up-01',
      title: 'UNDRR Events & Training Calendar',
      organizer: 'UN Office for Disaster Risk Reduction (UNDRR)',
      type: 'Event Portal',
      timing: 'Official Portal',
      delivery: 'Official Events Directory',
      topic: 'Disaster Risk Reduction & Resilience Sessions',
      badges: ['EVENT PORTAL', 'UPCOMING SESSIONS', 'OFFICIAL SOURCE'],
      description: 'Browse current and upcoming disaster-risk-reduction events, international webinars, technical seminars, and practitioner workshops.',
      url: 'https://www.undrr.org/events',
      actionLabel: 'Browse UNDRR Events'
    },
    {
      id: 'ws-up-02',
      title: 'FEMA Virtual Tabletop Exercises (VTTX) & Training',
      organizer: 'FEMA Emergency Management Institute',
      type: 'Exercise Portal',
      timing: 'Official Portal',
      delivery: 'Virtual Tabletop Schedule',
      topic: 'Multi-Agency Crisis Coordination & Drills',
      badges: ['EXERCISE PORTAL', 'SCHEDULED DRILLS', 'OFFICIAL SOURCE'],
      description: 'Explore schedules and participation guidelines for national virtual tabletop scenario exercises and incident command simulations.',
      url: 'https://training.fema.gov/programs/emicourses.aspx',
      actionLabel: 'Browse FEMA Exercises'
    },
    {
      id: 'ws-up-03',
      title: 'IFRC Global Events & Learning Sessions',
      organizer: 'International Federation of Red Cross & Red Crescent',
      type: 'Event Portal',
      timing: 'Official Portal',
      delivery: 'Official Webinars & Briefings',
      topic: 'Humanitarian & Volunteer Community Response',
      badges: ['EVENT PORTAL', 'LEARNING SESSIONS', 'OFFICIAL SOURCE'],
      description: 'Browse upcoming webinars, community-led response briefings, and humanitarian knowledge exchanges hosted by Red Cross teams.',
      url: 'https://www.ifrc.org/',
      actionLabel: 'Browse IFRC Events'
    }
  ],
  recorded: [
    {
      id: 'ws-rec-01',
      title: 'OpenWHO Video & Briefing Archives',
      organizer: 'World Health Organization (WHO)',
      type: 'On-Demand Archive',
      timing: 'Previous / Recorded',
      delivery: 'Recorded Video Briefings',
      topic: 'Frontline Responder Health & Clinical Briefings',
      badges: ['ON-DEMAND ARCHIVE', 'RECORDED SESSIONS', 'OFFICIAL SOURCE'],
      description: 'Watch recorded expert briefings, operational updates, and technical instructional videos on crisis response and field hygiene.',
      url: 'https://openwho.org/channels',
      actionLabel: 'Access Video Archives'
    },
    {
      id: 'ws-rec-02',
      title: 'PreventionWeb Recorded Knowledge Sessions',
      organizer: 'UNDRR / PreventionWeb',
      type: 'On-Demand Archive',
      timing: 'Previous / Recorded',
      delivery: 'Recorded Seminar Library',
      topic: 'Disaster Risk Governance & Case Studies',
      badges: ['ON-DEMAND ARCHIVE', 'RECORDED SESSIONS', 'OFFICIAL SOURCE'],
      description: 'Access previous disaster-risk-reduction webinars, technical case study presentations, and community resilience workshops.',
      url: 'https://www.preventionweb.net/events',
      actionLabel: 'Access Seminar Archive'
    }
  ]
};

export const OFFICIAL_NEWS_UPDATES = [
  {
    id: 'news-01',
    title: 'UNDRR News & Updates',
    source: 'UNDRR',
    date: 'Official Portal',
    badges: ['OFFICIAL NEWS PORTAL', 'UPDATES'],
    summary: 'Browse official disaster-risk-reduction news, global early-warning announcements, and international climate resilience reports.',
    url: 'https://www.undrr.org/news',
    actionLabel: 'Visit UNDRR News'
  },
  {
    id: 'news-02',
    title: 'ReliefWeb Emergency Situation Reports',
    source: 'ReliefWeb / UN OCHA',
    date: 'Live Official Monitor',
    badges: ['OFFICIAL SITREP PORTAL', 'UPDATES'],
    summary: 'Access real-time humanitarian situation reports, disaster maps, and ongoing emergency response bulletins from international relief operations.',
    url: 'https://reliefweb.int/updates',
    actionLabel: 'Visit ReliefWeb Reports'
  },
  {
    id: 'news-03',
    title: 'WHO Health Emergencies News & Advisories',
    source: 'World Health Organization (WHO)',
    date: 'Official Advisory Portal',
    badges: ['OFFICIAL HEALTH PORTAL', 'UPDATES'],
    summary: 'Review official disease outbreak news, field operational advisories, and international health emergency status updates.',
    url: 'https://www.who.int/emergencies/situations',
    actionLabel: 'Visit WHO Emergencies'
  },
  {
    id: 'news-04',
    title: 'IFRC Press Releases & Response Bulletins',
    source: 'IFRC',
    date: 'Official Press Portal',
    badges: ['OFFICIAL PRESS PORTAL', 'UPDATES'],
    summary: 'Read official press releases, field relief operation updates, and community emergency response bulletins from Red Cross and Red Crescent societies.',
    url: 'https://www.ifrc.org/press-release',
    actionLabel: 'Visit IFRC Press'
  }
];

export const QUICK_HELP_RESOURCES = [
  {
    id: 'qh-01',
    category: 'First Aid',
    title: 'Emergency First Aid & Triage Reference',
    iconName: 'HeartPulse',
    badges: ['QUICK HELP', 'FIRST AID'],
    summary: 'Direct reference guidelines: Stop-the-Bleed direct pressure protocols, CPR compression cadences (100-120 bpm), and recovery positioning.',
    url: 'https://www.redcross.org/take-a-class/first-aid',
    actionLabel: 'View First Aid Guide'
  },
  {
    id: 'qh-02',
    category: 'Flood Safety',
    title: 'Flood Safety & Evacuation Checklist',
    iconName: 'Waves',
    badges: ['QUICK HELP', 'FLOOD SAFETY'],
    summary: 'Turn Around Don\'t Drown safety rules, main circuit-breaker & gas isolation procedures, sandbag stacking geometry, and swift water hazard clearance.',
    url: 'https://www.ready.gov/floods',
    actionLabel: 'View Flood Guide'
  },
  {
    id: 'qh-03',
    category: 'Fire / Wildfire Safety',
    title: 'Structural & Wildfire Safety Checklist',
    iconName: 'Flame',
    badges: ['QUICK HELP', 'FIRE SAFETY'],
    summary: 'Wildfire defensible zones, smoke inhalation N95/P100 precautions, emergency go-bag staging, and immediate evacuation under RED FLAG warnings.',
    url: 'https://www.ready.gov/wildfires',
    actionLabel: 'View Fire Guide'
  },
  {
    id: 'qh-04',
    category: 'Earthquake Preparedness',
    title: 'Earthquake Action & Drill Checklist',
    iconName: 'ShieldAlert',
    badges: ['QUICK HELP', 'EARTHQUAKE'],
    summary: 'Drop, Cover, and Hold On mechanics, structural hazard inspection, securing heavy equipment, and gas leak shutoff standards.',
    url: 'https://www.ready.gov/earthquakes',
    actionLabel: 'View Earthquake Guide'
  },
  {
    id: 'qh-05',
    category: 'Emergency Communication',
    title: 'Emergency Radio & Telecom Plan',
    iconName: 'Radio',
    badges: ['QUICK HELP', 'COMMUNICATION'],
    summary: 'Standard out-of-area emergency contacts, SMS text priority rules, VHF/UHF amateur radio simplex channels, and battery conservation practices.',
    url: 'https://www.ready.gov/plan',
    actionLabel: 'View Telecom Plan'
  }
];
