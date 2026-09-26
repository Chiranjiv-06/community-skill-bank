/**
 * Isolated Development Data for Stage 9 — Community Activities
 * 
 * Provides disaster preparedness events, neighborhood drills,
 * volunteer mobilization drives, and participant registries.
 */

export const ACTIVITY_CATEGORIES = [
  'Flood Defense & Sandbagging',
  'Emergency Radio Mesh Drill',
  'Neighborhood Triage Workshop',
  'Disaster Shelter Logistics',
  'Wildfire Perimeter Prep',
  'Search & Evacuation Practice'
];

export const ACTIVITY_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'];

export const INITIAL_DEV_ACTIVITIES = [
  {
    id: 'act-901',
    title: 'Community Sandbagging & Flood Barrier Assembly',
    category: 'Flood Defense & Sandbagging',
    description: 'Preemptive sandbag filling, transport staging, and floodwall barrier construction along vulnerable riverwalk corridors ahead of forecasted seasonal atmospheric river surges.',
    location: 'District 2 Riverwalk Staging Depot, West Gate',
    address: '1420 Riverwalk Blvd, Sector 2',
    date: '2026-10-02',
    startTime: '08:30 AM',
    endTime: '01:30 PM',
    duration: '5 Hours',
    status: 'scheduled',
    organizer: 'Civic Flood Resilience Team',
    organizerContact: 'floodops@skillbank.org | (555) 321-4401',
    capacity: 40,
    currentParticipantsCount: 28,
    requiredSkills: ['Physical Labor', 'Sandbag Rigging', 'Safety Perimeter'],
    recommendedGear: 'Heavy work gloves, waterproof work boots, reflective safety vest.',
    createdTime: '2026-09-20T10:00:00Z',
    updatedTime: '2026-09-20T10:00:00Z'
  },
  {
    id: 'act-902',
    title: 'Quarterly Emergency Radio Mesh & Packet Relay Drill',
    category: 'Emergency Radio Mesh Drill',
    description: 'Field simulation testing tactical VHF/UHF amateur radio repeaters, LoRa emergency mesh communication nodes, and off-grid message forwarding without cellular power.',
    location: 'Summit Hill Repeater & Observation Station',
    address: '8800 Skyline Overlook Way, Station 4',
    date: '2026-10-05',
    startTime: '10:00 AM',
    endTime: '02:00 PM',
    duration: '4 Hours',
    status: 'scheduled',
    organizer: 'Amateur Radio Disaster Corps (ARES / RACES)',
    organizerContact: 'comm-drill@skillbank.org | (555) 778-9012',
    capacity: 25,
    currentParticipantsCount: 18,
    requiredSkills: ['Ham Radio Operation', 'Mesh Networking', 'Logging'],
    recommendedGear: 'Handheld 2m/70cm HT radio, extra Li-ion battery pack, tactical clipboard.',
    createdTime: '2026-09-21T11:30:00Z',
    updatedTime: '2026-09-21T11:30:00Z'
  },
  {
    id: 'act-903',
    title: 'Neighborhood Mass Casualty Triage & First Aid Workshop',
    category: 'Neighborhood Triage Workshop',
    description: 'Hands-on practical training for citizen volunteers and responders covering START triage color coding, tourniquet application, pressure bandaging, and casualty tag protocol.',
    location: 'Civic Pavilion — Multi-Purpose Hall B',
    address: '400 Civic Center Plaza, Downtown',
    date: '2026-10-08',
    startTime: '09:00 AM',
    endTime: '01:00 PM',
    duration: '4 Hours',
    status: 'scheduled',
    organizer: 'Metro Disaster Health & EMS Auxiliary',
    organizerContact: 'triage-training@skillbank.org | (555) 432-1199',
    capacity: 35,
    currentParticipantsCount: 32,
    requiredSkills: ['First Aid / CPR', 'Triage Assessment', 'Compassionate Care'],
    recommendedGear: 'Personal medical pouch (if certified), comfortable closed-toe shoes.',
    createdTime: '2026-09-22T09:15:00Z',
    updatedTime: '2026-09-22T09:15:00Z'
  },
  {
    id: 'act-904',
    title: 'Emergency Shelter Cot Staging & Hygiene Kit Assembly',
    category: 'Disaster Shelter Logistics',
    description: 'Setting up 120 disaster relief cots, privacy partitions, emergency hygiene kits, and wheelchair-accessible comfort zones for displaced evacuees.',
    location: 'East District High Gymnasium',
    address: '2200 Oak Crest Drive, District 3',
    date: '2026-09-25',
    startTime: '01:00 PM',
    endTime: '06:00 PM',
    duration: '5 Hours',
    status: 'in_progress',
    organizer: 'Red Cross Disaster Services & Skill Bank Logistics',
    organizerContact: 'shelter-corps@skillbank.org | (555) 662-8811',
    capacity: 30,
    currentParticipantsCount: 22,
    requiredSkills: ['Shelter Logistics', 'Inventory Intake', 'Hospitality'],
    recommendedGear: 'Comfortable attire, work gloves for cot assembly.',
    createdTime: '2026-09-23T08:00:00Z',
    updatedTime: '2026-09-25T13:00:00Z'
  },
  {
    id: 'act-905',
    title: 'Urban Wildfire Defensible Space & Brush Clearing Drive',
    category: 'Wildfire Perimeter Prep',
    description: 'Clearing combustible debris, dead brush, and dry grass along residential fire buffer boundaries bordering canyon wildland interfaces.',
    location: 'Pine Ridge Foothill Trailhead & Perimeter',
    address: '5500 Canyon Ridge Road, Ward 9',
    date: '2026-10-12',
    startTime: '08:00 AM',
    endTime: '12:30 PM',
    duration: '4.5 Hours',
    status: 'scheduled',
    organizer: 'County Fire Safe Council',
    organizerContact: 'firesafe@skillbank.org | (555) 901-2244',
    capacity: 50,
    currentParticipantsCount: 15,
    requiredSkills: ['Landscaping', 'Chainsaw Operation', 'Brush Clearing'],
    recommendedGear: 'Eye protection, ear protection, leather work gloves, steel-toed boots.',
    createdTime: '2026-09-23T14:20:00Z',
    updatedTime: '2026-09-23T14:20:00Z'
  },
  {
    id: 'act-906',
    title: 'Multi-Agency Earthquake Evacuation Walkthrough',
    category: 'Search & Evacuation Practice',
    description: 'City-wide simulated earthquake drill evaluating safe evacuation corridors, structural assembly check-in points, and emergency communication relay handoffs.',
    location: 'Metro Downtown Transit Center Plaza',
    address: '100 Transit Way, Central Ward',
    date: '2026-09-15',
    startTime: '09:00 AM',
    endTime: '01:00 PM',
    duration: '4 Hours',
    status: 'completed',
    organizer: 'Unified Incident Command Staff',
    organizerContact: 'command@skillbank.org | (555) 111-0000',
    capacity: 60,
    currentParticipantsCount: 54,
    requiredSkills: ['Crowd Management', 'Evacuation Guiding', 'Radio Protocol'],
    recommendedGear: 'Safety helmet, high-visibility vest.',
    createdTime: '2026-09-01T08:00:00Z',
    updatedTime: '2026-09-15T14:00:00Z'
  }
];

export const INITIAL_DEV_PARTICIPATIONS = [
  {
    id: 'prt-901',
    activityId: 'act-901',
    volunteerId: 'dev-skl-002',
    volunteerName: 'Alex Rivera',
    volunteerEmail: 'alex.rivera@skillbank.org',
    status: 'registered',
    registeredAt: '2026-09-21T14:00:00Z',
    notes: 'Bringing heavy equipment and high-water vehicle for sandbag distribution.'
  },
  {
    id: 'prt-902',
    activityId: 'act-903',
    volunteerId: 'dev-skl-002',
    volunteerName: 'Alex Rivera',
    volunteerEmail: 'alex.rivera@skillbank.org',
    status: 'registered',
    registeredAt: '2026-09-22T16:30:00Z',
    notes: 'Assisting as practical drill assistant for trauma pressure dressings.'
  },
  {
    id: 'prt-903',
    activityId: 'act-906',
    volunteerId: 'dev-skl-002',
    volunteerName: 'Alex Rivera',
    volunteerEmail: 'alex.rivera@skillbank.org',
    status: 'completed',
    registeredAt: '2026-09-02T10:00:00Z',
    notes: 'Served as sector evacuation coordinator. Completed full drill.'
  },
  {
    id: 'prt-904',
    activityId: 'act-901',
    volunteerId: 'dev-cit-003',
    volunteerName: 'Maria Gonzalez',
    volunteerEmail: 'maria.gonzalez@skillbank.org',
    status: 'registered',
    registeredAt: '2026-09-22T09:00:00Z',
    notes: 'Assisting with community food setup and sandbag packing.'
  },
  {
    id: 'prt-905',
    activityId: 'act-902',
    volunteerId: 'dev-vol-004',
    volunteerName: 'Jordan Lee',
    volunteerEmail: 'jordan.lee@skillbank.org',
    status: 'registered',
    registeredAt: '2026-09-23T11:00:00Z',
    notes: 'Setting up 2m packet node radio.'
  }
];
