/**
 * Isolated Development Data for Location, Matching, Intelligence & Recommendations (Stage 6)
 * 
 * In Stage 17 (Backend Integration), these will be fetched directly
 * from FastAPI / PostgreSQL calculation and geospatial endpoints.
 * 
 * Note: These values represent backend-calculated outputs.
 * DO NOT calculate scores or geographic distances in the frontend.
 */

export const DEV_NEARBY_VOLUNTEERS = {
  'emg-501': [
    {
      id: 'vol-501-1',
      name: 'Marcus Vance',
      skill: 'Swift Water & Flood Rescue',
      category: 'Search & Rescue (SAR)',
      proficiency: 'Expert',
      experience: '7 years frontline river and flood rescue',
      distance: '1.8 km',
      latitude: 34.0620,
      longitude: -118.2520,
      eligibility: 'Eligible - Rapid Surge',
      isAvailable: true,
      phone: '+1 (555) 345-6789',
      transportation: 'Personal 4x4 / Off-Road Vehicle',
      matchScore: '98%',
      recommendationScore: '96/100',
      certificationCount: 4,
      priority: 'Critical Surge',
      trustScore: '99%',
      reasoning: 'Ranked #1 for flood rescue: possesses Master Swiftwater Diver certification, 4x4 vehicle deployment capability, and rapid 1.8 km proximity to Ward 7 levee.'
    },
    {
      id: 'vol-501-2',
      name: 'Elena Rostova',
      skill: 'Emergency Triage & Trauma Care',
      category: 'Medical & Trauma Care',
      proficiency: 'Advanced',
      experience: '5 years emergency room flight nurse',
      distance: '2.4 km',
      latitude: 34.0540,
      longitude: -118.2410,
      eligibility: 'Fully Eligible',
      isAvailable: true,
      phone: '+1 (555) 456-7890',
      transportation: 'Standard Passenger Vehicle (Sedan / SUV)',
      matchScore: '94%',
      recommendationScore: '92/100',
      certificationCount: 3,
      priority: 'Critical Surge',
      trustScore: '98%',
      reasoning: 'EMT-Paramedic with direct field triage experience in 4 major hurricane responses. 2.4 km from triage staging area.'
    },
    {
      id: 'vol-501-3',
      name: 'David Kim',
      skill: 'Emergency Ham Radio & Mesh Communications',
      category: 'Emergency Communications & Radio',
      proficiency: 'Intermediate',
      experience: '3 years licensed amateur radio',
      distance: '3.1 km',
      latitude: 34.0680,
      longitude: -118.2450,
      eligibility: 'Fully Eligible',
      isAvailable: true,
      phone: '+1 (555) 567-8901',
      transportation: 'Motorcycle / Scooter',
      matchScore: '89%',
      recommendationScore: '87/100',
      certificationCount: 2,
      priority: 'High Priority',
      trustScore: '96%',
      reasoning: 'Equipped with portable VHF/UHF tactical repeater station. Capable of establishing emergency relay in communication blackout zones.'
    },
    {
      id: 'vol-501-4',
      name: 'Sarah Chen',
      skill: 'Swift Water & Flood Rescue',
      category: 'Search & Rescue (SAR)',
      proficiency: 'Advanced',
      experience: '4 years technical rescue volunteer',
      distance: '4.2 km',
      latitude: 34.0490,
      longitude: -118.2580,
      eligibility: 'Fully Eligible',
      isAvailable: true,
      phone: '+1 (555) 678-9012',
      transportation: 'Light Truck / Van (Cargo Capacity)',
      matchScore: '91%',
      recommendationScore: '89/100',
      certificationCount: 3,
      priority: 'High Priority',
      trustScore: '97%',
      reasoning: 'Certified inflatable rescue boat operator with light truck for equipment transport. 4.2 km response transit time.'
    },
    {
      id: 'vol-501-5',
      name: 'James Morales',
      skill: 'Community Outreach & Evacuation',
      category: 'Community Outreach & Evacuation',
      proficiency: 'Intermediate',
      experience: '2 years bilingual neighborhood relief',
      distance: '5.5 km',
      latitude: 34.0710,
      longitude: -118.2390,
      eligibility: 'Eligible - Secondary Phase',
      isAvailable: true,
      phone: '+1 (555) 789-0123',
      transportation: 'Public Transit / Carpool Only',
      matchScore: '82%',
      recommendationScore: '78/100',
      certificationCount: 1,
      priority: 'Secondary',
      trustScore: '94%',
      reasoning: 'Fluent in English and Spanish; suitable for door-to-door evacuation coordination once watercraft perimeter is stabilized.'
    },
    {
      id: 'vol-501-6',
      name: 'Rachel Adams',
      skill: 'Swift Water & Flood Rescue',
      category: 'Search & Rescue (SAR)',
      proficiency: 'Beginner',
      experience: '1 year trainee SAR volunteer',
      distance: '8.1 km',
      latitude: 34.0350,
      longitude: -118.2690,
      eligibility: 'Below Minimum Proficiency Quota',
      isAvailable: false,
      phone: '+1 (555) 890-1234',
      transportation: 'Standard Passenger Vehicle (Sedan / SUV)',
      matchScore: '68%',
      recommendationScore: '61/100',
      certificationCount: 1,
      priority: 'Reserve Only',
      trustScore: '92%',
      reasoning: 'Declared Beginner proficiency does not meet Advanced quota required for hazardous high-velocity river surge.'
    }
  ],

  'emg-502': [
    {
      id: 'vol-502-1',
      name: 'Hector Gutierrez',
      skill: 'Heavy Equipment & Operations',
      category: 'Heavy Equipment & Operations',
      proficiency: 'Expert',
      experience: '12 years commercial excavator and crane operator',
      distance: '2.1 km',
      latitude: 33.8790,
      longitude: -118.2880,
      eligibility: 'Fully Eligible - Priority Lead',
      isAvailable: true,
      phone: '+1 (555) 222-3344',
      transportation: 'Light Truck / Van (Cargo Capacity)',
      matchScore: '99%',
      recommendationScore: '97/100',
      certificationCount: 5,
      priority: 'Critical Surge',
      trustScore: '100%',
      reasoning: 'Master Heavy Equipment Certification. Familiar with structural debris clearance and urban search shoring protocols.'
    },
    {
      id: 'vol-502-2',
      name: 'Chloe Dubois',
      skill: 'Incident Command & Coordination',
      category: 'Incident Command & Coordination',
      proficiency: 'Advanced',
      experience: '8 years municipal emergency management',
      distance: '3.6 km',
      latitude: 33.8690,
      longitude: -118.2980,
      eligibility: 'Fully Eligible',
      isAvailable: true,
      phone: '+1 (555) 333-4455',
      transportation: 'Standard Passenger Vehicle (Sedan / SUV)',
      matchScore: '95%',
      recommendationScore: '93/100',
      certificationCount: 4,
      priority: 'High Priority',
      trustScore: '99%',
      reasoning: 'FEMA ICS-300/400 certified coordinator with experience directing multi-agency seismic rescue sectors.'
    }
  ],

  'emg-503': [
    {
      id: 'vol-503-1',
      name: 'Carlos Mendez',
      skill: 'Community Outreach & Evacuation',
      category: 'Community Outreach & Evacuation',
      proficiency: 'Intermediate',
      experience: '3 years wildfire evacuation logistics',
      distance: '1.5 km',
      latitude: 34.1850,
      longitude: -118.3120,
      eligibility: 'Fully Eligible',
      isAvailable: true,
      phone: '+1 (555) 667-8899',
      transportation: 'Light Truck / Van (Cargo Capacity)',
      matchScore: '94%',
      recommendationScore: '91/100',
      certificationCount: 2,
      priority: 'High Priority',
      trustScore: '98%',
      reasoning: 'Local canyon resident with 4WD vehicle and bilingual outreach experience.'
    },
    {
      id: 'vol-503-2',
      name: 'Priya Sharma',
      skill: 'Disaster Relief Staging Logistics',
      category: 'Logistics & Supply Distribution',
      proficiency: 'Advanced',
      experience: '5 years emergency shelter and staging depot management',
      distance: '2.2 km',
      latitude: 34.1780,
      longitude: -118.3020,
      eligibility: 'Fully Eligible',
      isAvailable: true,
      phone: '+1 (555) 778-9900',
      transportation: 'Standard Passenger Vehicle (Sedan / SUV)',
      matchScore: '92%',
      recommendationScore: '90/100',
      certificationCount: 3,
      priority: 'High Priority',
      trustScore: '97%',
      reasoning: 'Expert supply coordinator with rapid access to municipal staging equipment.'
    }
  ],

  'emg-504': [
    {
      id: 'vol-504-1',
      name: 'Sarah Jenkins',
      skill: 'Shelter Management & Food Relief',
      category: 'Shelter Management & Food Relief',
      proficiency: 'Intermediate',
      experience: '4 years community shelter operations',
      distance: '1.2 km',
      latitude: 34.0450,
      longitude: -118.2090,
      eligibility: 'Fully Eligible',
      isAvailable: true,
      phone: '+1 (555) 889-1122',
      transportation: 'Standard Passenger Vehicle (Sedan / SUV)',
      matchScore: '95%',
      recommendationScore: '93/100',
      certificationCount: 3,
      priority: 'High Priority',
      trustScore: '99%',
      reasoning: 'Red Cross certified disaster shelter manager located 1.2 km from Civic Pavilion.'
    },
    {
      id: 'vol-504-2',
      name: 'Luis Navarro',
      skill: 'Community Outreach & Evacuation',
      category: 'Community Outreach & Evacuation',
      proficiency: 'Beginner',
      experience: '1 year neighborhood aid volunteer',
      distance: '2.0 km',
      latitude: 34.0390,
      longitude: -118.2150,
      eligibility: 'Fully Eligible',
      isAvailable: true,
      phone: '+1 (555) 990-2233',
      transportation: 'Motorcycle / Scooter',
      matchScore: '86%',
      recommendationScore: '82/100',
      certificationCount: 1,
      priority: 'Standard',
      trustScore: '95%',
      reasoning: 'Neighborhood contact fluent in local dialects for resident intake.'
    }
  ],

  'emg-505': [
    {
      id: 'vol-505-1',
      name: 'Nathan Ross',
      skill: 'Heavy Equipment & Operations',
      category: 'Heavy Equipment & Operations',
      proficiency: 'Advanced',
      experience: '6 years municipal transit infrastructure',
      distance: '1.4 km',
      latitude: 34.0510,
      longitude: -118.2550,
      eligibility: 'Fully Eligible',
      isAvailable: true,
      phone: '+1 (555) 112-3344',
      transportation: 'Light Truck / Van (Cargo Capacity)',
      matchScore: '93%',
      recommendationScore: '89/100',
      certificationCount: 3,
      priority: 'Standard',
      trustScore: '96%',
      reasoning: 'Subway water extraction and electrical safety certification holder.'
    }
  ]
};

export const DEV_EMERGENCY_INTELLIGENCE = {
  'emg-501': {
    emergencyId: 'emg-501',
    title: 'Flash Flood Rescue & Evacuation - Ward 7',
    severity: 'critical',
    urgency: 'immediate',
    staffingRequirement: '25 Responders Total (18 Priority Quota Remaining)',
    requiredSkillsSummary: [
      'Swift Water & Flood Rescue (Min: Advanced)',
      'Emergency Triage & Trauma Care (Min: Intermediate)',
      'Emergency Ham Radio & Mesh Communications (Min: Intermediate)'
    ],
    locationValidation: {
      status: 'Validated (High Confidence)',
      sector: 'Ward 7 - Riverside Basin Lowlands',
      jurisdiction: 'Municipal Sector 4 - River Basin Floodplain',
      coordinates: '34.0582° N, 118.2483° W',
      accessCondition: 'Sub-surface road washouts; high-clearance 4x4 or watercraft vehicles required.'
    },
    riskFlags: [
      {
        id: 'rf-1',
        level: 'critical',
        title: 'Flash Flood Crest Imminent',
        description: 'Upper basin watershed runoff is projected to crest within 60–90 minutes, increasing water velocity by ~35%.'
      },
      {
        id: 'rf-2',
        level: 'high',
        title: 'Subsurface Infrastructure Hazard',
        description: 'Underground electrical transformer substation inundated; power isolation confirmed by municipal utility.'
      },
      {
        id: 'rf-3',
        level: 'medium',
        title: 'Cellular Tower Intermittent Degradation',
        description: 'Commercial cellular telemetry experiencing packet drops; amateur radio VHF relay activation recommended.'
      }
    ],
    reasoning:
      'Automated intelligence fusion integrates hydrologic basin sensor feeds, municipal road closure telemetry, and volunteer geolocation availability. Swift water rescue units with Advanced/Expert proficiency and 4x4 off-road transport are given highest dispatch priority. A critical staffing gap of 6 watercraft technicians remains for night operations.'
  },

  'emg-502': {
    emergencyId: 'emg-502',
    title: 'Seismic Structural Collapse & Trapped Persons',
    severity: 'critical',
    urgency: 'immediate',
    staffingRequirement: '18 Responders Total (10 Priority Quota Remaining)',
    requiredSkillsSummary: [
      'Heavy Equipment & Operations (Min: Expert)',
      'Incident Command & Coordination (Min: Advanced)'
    ],
    locationValidation: {
      status: 'Validated (High Confidence)',
      sector: 'Harbor Gateway - Industrial District 4',
      jurisdiction: 'Port Authority & Municipal Boundary',
      coordinates: '33.8741° N, 118.2917° W',
      accessCondition: 'Heavy rubble blocking southern access road; northern corridor open for heavy machinery.'
    },
    riskFlags: [
      {
        id: 'rf-1',
        level: 'critical',
        title: 'Secondary Aftershock Hazard',
        description: 'Geological survey indicates 45% probability of M4.5+ aftershock within 12 hours.'
      },
      {
        id: 'rf-2',
        level: 'high',
        title: 'Industrial Chemical Storage Nearby',
        description: 'Adjacent warehouse contains sealed caustic soda containers; hazmat perimeter established.'
      }
    ],
    reasoning:
      'Seismic structural failure requires specialized heavy equipment operators and structural collapse search specialists. Priority matching is directed to certified crane and excavator operators within 5 km to safely stabilize overhead concrete slabs before manual search teams enter.'
  },

  'emg-503': {
    emergencyId: 'emg-503',
    title: 'Wildfire Peripheral Evacuation & Staging Support',
    severity: 'high',
    urgency: 'high',
    staffingRequirement: '30 Responders Total (15 Quota Remaining)',
    requiredSkillsSummary: [
      'Community Outreach & Evacuation (Min: Beginner)',
      'Disaster Relief Staging Logistics (Min: Intermediate)'
    ],
    locationValidation: {
      status: 'Validated (Medium-High Confidence)',
      sector: 'North Canyon Perimeter - Hillside Sector',
      jurisdiction: 'County Wildfire Mutual Aid Zone',
      coordinates: '34.1808° N, 118.3090° W',
      accessCondition: 'Canyon roads restricted to emergency response personnel and authorized evacuation convoys.'
    },
    riskFlags: [
      {
        id: 'rf-1',
        level: 'high',
        title: 'Shift in Wind Velocity',
        description: 'Santa Ana gusts shifting south-southwest at 25 knots.'
      }
    ],
    reasoning:
      'Wildfire perimeter evacuation requires high-volume personnel for orderly residential notification and staging depot logistics. Recommended matching prioritizes bilingual communicators and volunteers with cargo vehicles for animal transport.'
  }
};

export default {
  DEV_NEARBY_VOLUNTEERS,
  DEV_EMERGENCY_INTELLIGENCE
};
