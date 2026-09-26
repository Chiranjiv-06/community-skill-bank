/**
 * Isolated Development Data for Stage 12 — Knowledge Assistant
 * 
 * Provides professional disaster-response knowledge documents, standard operating procedures,
 * field protocols, and deterministic assistant response fixtures.
 */

export const KNOWLEDGE_CATEGORIES = [
  'First Aid',
  'Emergency Response',
  'Search & Rescue',
  'Fire Safety',
  'Disaster Preparedness',
  'Evacuation',
  'Shelter Management',
  'Communication'
];

export const DISASTER_TYPES = [
  'Flood',
  'Earthquake',
  'Fire',
  'Cyclone',
  'Landslide',
  'Industrial Accident',
  'General Emergency'
];

export const INITIAL_DEV_KNOWLEDGE = [
  {
    id: 'knw-101',
    title: 'Rapid Triage & Severe Bleeding Control (START Protocol)',
    summary: 'Standard field triage criteria for mass-casualty incidents using the Simple Triage and Rapid Treatment (START) algorithm and arterial tourniquet application.',
    category: 'First Aid',
    disasterType: 'Flood',
    tags: ['first aid', 'triage', 'tourniquet', 'hemorrhage', 'trauma', 'start protocol'],
    source: 'FEMA Field Trauma & Incident Command Standards 2024',
    lastUpdated: '2026-08-15T09:30:00Z',
    readingTime: '4 min read',
    priority: 'critical',
    content: `### 1. START Triage Overview
The Simple Triage and Rapid Treatment (START) methodology evaluates victims within 60 seconds based on four clinical checkpoints: Ability to Walk, Respiration, Perfusion, and Mental Status.

### 2. Immediate Assessment Sequence
- **Step 1 - Walking Wounded:** Direct all walking patients to a designated triage collection point (Green / Minor).
- **Step 2 - Respiration:**
  - If NOT breathing, clear airway manually. If still no spontaneous breathing -> Tag **BLACK (Deceased)**.
  - If breathing > 30 breaths/min -> Tag **RED (Immediate)**.
  - If breathing < 30 breaths/min, proceed to Perfusion.
- **Step 3 - Perfusion:**
  - Radial pulse absent or capillary refill > 2 seconds -> Tag **RED (Immediate)**. Apply direct pressure or tourniquet.
  - Radial pulse present, proceed to Mental Status.
- **Step 4 - Mental Status:**
  - Cannot follow simple commands -> Tag **RED (Immediate)**.
  - Can follow commands -> Tag **YELLOW (Delayed)**.

### 3. Severe Arterial Bleeding Protocol
1. Expose the wound completely; remove wet clothing.
2. Apply high and tight commercial windlass tourniquet 2-3 inches proximal to injury site (never over a joint).
3. Twist windlass rod until bright red bleeding ceases completely.
4. Mark application time on forehead or tourniquet strap (e.g., "TK 14:22").`
  },
  {
    id: 'knw-102',
    title: 'Urban Flood Evacuation & Swiftwater Safety Rules',
    summary: 'Essential safety procedures for navigating inundated urban zones, electrical hazard avoidance, and staging watercraft rescue operations.',
    category: 'Evacuation',
    disasterType: 'Flood',
    tags: ['flood', 'evacuation', 'swiftwater', 'water safety', 'staging', 'current'],
    source: 'National Swiftwater Rescue Association Field Manual',
    lastUpdated: '2026-07-20T14:15:00Z',
    readingTime: '5 min read',
    priority: 'critical',
    content: `### 1. The Rule of Urban Flood Waters
- **Never Drive Through Standing Water:** 6 inches of water reaches the bottom of most passenger cars; 12 inches floats small vehicles; 24 inches sweeps SUVs away.
- **Submerged Hazards:** Fast-moving storm runoff conceals open storm drains, washed-out asphalt, broken gas lines, and submerged chain-link fences.

### 2. Personal Protective Equipment (PPE)
- Type V Personal Flotation Device (PFD) with swiftwater rescue harness.
- Water rescue helmet with non-draining ear flaps.
- Thermal wetsuit or drysuit; puncture-resistant neoprene boots.
- Throw bag with 75 feet of floating polypropylene line.

### 3. Evacuation Staging Protocols
1. Establish command and assembly points on terrain at least 15 feet above projected crest elevation.
2. Prioritize non-ambulatory residents, elder-care facilities, and pets before water ingress blocks access roads.
3. Treat all floodwaters as contaminated (Category 3 black water). Prohibit consumption and wash boots with bleach solution.`
  },
  {
    id: 'knw-103',
    title: 'Earthquake Immediate Survival: Drop, Cover, and Hold On',
    summary: 'Standardized life safety actions during seismic tremors, structural collapse hazards, and gas line post-shake shutoff instructions.',
    category: 'Disaster Preparedness',
    disasterType: 'Earthquake',
    tags: ['earthquake', 'seismic', 'drop cover hold', 'collapse', 'gas shutoff', 'preparedness'],
    source: 'USGS Earthquake Disaster Preparedness Division',
    lastUpdated: '2026-06-10T11:00:00Z',
    readingTime: '3 min read',
    priority: 'critical',
    content: `### 1. Immediate Action During Ground Shaking
- **DROP:** Drop down onto your hands and knees immediately before the earthquake knocks you down.
- **COVER:** Cover your head and neck with your arms. Crawl under a sturdy table or desk. If no shelter is nearby, crawl next to an interior wall.
- **HOLD ON:** Hold onto your shelter until shaking stops. Be prepared to move with your shelter if it shifts.

### 2. What NOT to Do
- DO NOT run outside while shaking is occurring; falling masonry and shattered glass represent the primary hazard zone.
- DO NOT stand in a doorway; modern interior doorways do not provide structural load support and doors will swing violently.
- DO NOT use elevators under any circumstances.

### 3. Immediate Post-Quake Safety Checks
1. Check for gas leaks (smell of rotten egg sulfur or hissing sounds). If detected, shut off main meter valve using a non-sparking wrench.
2. Inspect electrical lines for fraying or sparks; disconnect main breaker panel.
3. Be prepared for strong aftershocks that can cause secondary collapse of already weakened masonry.`
  },
  {
    id: 'knw-104',
    title: 'Wildfire Perimeter Defense & Structure Protection Guidelines',
    summary: 'Defensible space creation, ember storm mitigation, and tactical retreat protocols for community wildfire volunteers.',
    category: 'Fire Safety',
    disasterType: 'Fire',
    tags: ['fire', 'wildfire', 'defensible space', 'ember storm', 'smoke', 'evacuation'],
    source: 'Interagency Fire Center Wildland Urban Interface Protocol',
    lastUpdated: '2026-08-01T16:45:00Z',
    readingTime: '6 min read',
    priority: 'high',
    content: `### 1. Defensible Space Zones
- **Zone 0 (0-5 feet):** Non-combustible perimeter. Remove all dead leaves, mulch, firewood piles, and overhanging dry branches adjacent to structure walls.
- **Zone 1 (5-30 feet):** Clean and lean zone. Mow grasses to under 3 inches; space trees at least 18 feet apart to prevent crown fire propagation.
- **Zone 2 (30-100 feet):** Fuel reduction zone. Thin underbrush and eliminate ladder fuels that can carry ground fires into tree canopies.

### 2. Ember Storm Protection Protocol
Ember storms ignite over 85% of structures during wildland-urban interface (WUI) incidents.
- Seal all attic and foundation vents with 1/8-inch non-corrosive metal mesh.
- Clear debris from gutters, eaves, and roof valleys.
- Connect garden hoses to exterior spigots with adjustable spray nozzles before evacuating.

### 3. Volunteer Tactical Retreat Trigger
- Maintain a minimum of two clear vehicular escape routes at all times.
- If flame lengths exceed 8 feet or wind gusts exceed 35 mph, immediately retreat to designated safety zones (parking lots or cleared pastures).`
  },
  {
    id: 'knw-105',
    title: 'Emergency VHF/UHF Mesh Radio Protocol & Relay Procedures',
    summary: 'Standard radio communication brevity codes, repeater fallback channels, and tactical message formats when cellular networks fail.',
    category: 'Communication',
    disasterType: 'General Emergency',
    tags: ['communication', 'radio', 'ham radio', 'mesh', 'vhf', 'uhf', 'relay', 'protocols'],
    source: 'Amateur Radio Emergency Service (ARES) Field Handbook',
    lastUpdated: '2026-05-18T10:20:00Z',
    readingTime: '4 min read',
    priority: 'high',
    content: `### 1. Tactical Calling Protocol
Always state the station you are calling FIRST, followed by your tactical callsign:
- Example: *"Command Base, this is Search Team Bravo. Over."*
- Await acknowledgment before transmitting mission data.
- Keep transmissions under 15 seconds to allow emergency priority breaks.

### 2. Standard ITU Phonetic Clarity
Ensure numbers and coordinates are transmitted with maximum phonetics:
- Coordinates: Sector 4 North -> *"Sierra-Echo-Charlie-Tango-Oscar-Romeo Four November"*
- Grid References: Repeat key figures twice for confirmation.

### 3. Emergency Priority Traffic Levels
- **EMERGENCY (Flash):** Life or death incident in progress (immediate priority over all traffic).
- **PRIORITY:** Urgent emergency communications requiring rapid dispatch.
- **ROUTINE:** General status updates, logistics check-ins, supply requests.`
  },
  {
    id: 'knw-106',
    title: 'Temporary Shelter Intake, Sanitation & Medical Screening',
    summary: 'Community shelter layout, rapid demographic intake, infectious disease isolation, and food security procedures during prolonged displacements.',
    category: 'Shelter Management',
    disasterType: 'Cyclone',
    tags: ['shelter', 'cyclone', 'sanitation', 'intake', 'displacement', 'logistics'],
    source: 'Red Cross Mass Care & Shelter Management Field Guide',
    lastUpdated: '2026-04-12T13:00:00Z',
    readingTime: '5 min read',
    priority: 'normal',
    content: `### 1. Shelter Space Allocation
- Minimum 40 square feet per individual for sleeping areas; 60 square feet for families with young children.
- Maintain 3-foot minimum separation between cots to mitigate airborne transmission.
- Dedicated quarantine zone separated by at least 20 feet from main congregate dormitory.

### 2. Rapid Intake & Screening Checklist
1. Verify immediate medical triage needs (diabetic insulin refrigeration, dialysis, oxygen concentrators).
2. Screen for contagious symptoms (fever > 100.4°F, respiratory distress, gastrointestinal distress).
3. Register family units together and issue waterproof identification wristbands with allergy notations.

### 3. Water, Sanitation & Hygiene (WASH)
- 1 toilet per 20 sheltered individuals minimum.
- 5 gallons of potable water per person per day for drinking, food preparation, and personal hygiene.
- Disinfect shared surfaces with 0.1% sodium hypochlorite solution every 4 hours.`
  },
  {
    id: 'knw-107',
    title: 'Structural Collapse & Confined Space Search Guidelines',
    summary: 'Search and rescue markings, acoustic listening protocols, structural void assessment, and cribbing safety fundamentals for collapsed buildings.',
    category: 'Search & Rescue',
    disasterType: 'Earthquake',
    tags: ['search and rescue', 'sar', 'collapse', 'confined space', 'cribbing', 'voids'],
    source: 'FEMA Urban Search & Rescue (US&R) Shoring Operations',
    lastUpdated: '2026-08-22T08:50:00Z',
    readingTime: '7 min read',
    priority: 'critical',
    content: `### 1. INSARAG / FEMA Structure Markings
A 2x2 foot box painted with high-visibility spray paint at the primary entry point:
- **Left Quadrant:** Search team identifier.
- **Top Quadrant:** Date and time search team entered/exited.
- **Right Quadrant:** Specific hazards found (gas leak, live wires, asbestos).
- **Bottom Quadrant:** Number of live victims (L) and deceased victims (D) recovered (e.g., "L-2, D-0").

### 2. Void Type Identification
- **Lean-To Collapse:** Occurs when one wall fails while opposite wall remains intact; triangular void at bottom offers highest survival survivability rate.
- **V-Shape Collapse:** Center floor fails under heavy load; voids form along both side walls.
- **Pancake Collapse:** Complete failure of supporting columns; voids exist primarily around rigid heavy furniture.

### 3. Cribbing & Shoring Safety Rules
- Build box cribs with 4x4 or 6x6 lumber; never exceed a 3:1 height-to-width ratio.
- Keep hands and feet clear from under suspended concrete loads at all times.
- Sound air horns (3 short blasts) to signal immediate evacuation of search teams.`
  },
  {
    id: 'knw-108',
    title: 'Hillside Mudslide & Landslide Early Warning Indicators',
    summary: 'Recognizing subtle geological indicators, slope deformation, drainage disruptions, and rapid evacuation triggers in steep terrain.',
    category: 'Disaster Preparedness',
    disasterType: 'Landslide',
    tags: ['landslide', 'mudslide', 'geology', 'slope', 'early warning', 'evacuation'],
    source: 'Geological Survey Hazard Advisory & Early Warning System',
    lastUpdated: '2026-03-30T15:20:00Z',
    readingTime: '4 min read',
    priority: 'high',
    content: `### 1. Subtle Slope Warning Signs
- New cracks appearing in hillside plaster, brick foundations, or driveway asphalt.
- Doors or windows that stick or jam for the first time due to foundation tilt.
- Underground utility lines breaking or pulling apart under ground tension.
- Fences, telephone poles, or retaining walls leaning or tilting downhill.

### 2. Hydrogeological Triggers
- Sudden change in creek water turbidity (clear stream turns intensely muddy or chocolate brown).
- Rapid and unexplained drop in creek flow while heavy rainfall continues upstream (suggests temporary debris dam forming).
- Faint rumbling sounds that increase in volume over 1-2 minutes.

### 3. Immediate Action Plan
- If indoors on an active slide path, move to the highest floor or exit laterally (perpendicular to the slide path).
- Never cross a saturated debris flow on foot or in vehicles; slurry flows travel at up to 35 mph.`
  },
  {
    id: 'knw-109',
    title: 'Hazardous Chemical Spill & Vapor Cloud Isolation Protocol',
    summary: 'Initial safe standoff distances, upwind positioning, placarding identification, and decontamination procedures for toxic industrial releases.',
    category: 'Emergency Response',
    disasterType: 'Industrial Accident',
    tags: ['chemical', 'hazmat', 'industrial accident', 'spill', 'decontamination', 'placard'],
    source: 'DOT Emergency Response Guidebook (ERG) Standard Reference',
    lastUpdated: '2026-07-05T09:10:00Z',
    readingTime: '5 min read',
    priority: 'critical',
    content: `### 1. Initial Approach & Standoff Rule
- **Rule of Thumb:** Hold your thumb up at arm's length against the incident scene. If you can still see the smoke, vapor cloud, or overturned tanker around your thumb, you are TOO CLOSE.
- Always approach and stage **UPWIND, UPHILL, and UPSTREAM** from the release point.

### 2. Hazardous Placard Identification
- Use binoculars to inspect the 4-digit UN chemical identification number on DOT diamond placards.
- Class 2: Gases (Flammable red, Poison white).
- Class 3: Flammable Liquids.
- Class 6: Toxic Substances.
- Class 8: Corrosive materials.

### 3. Emergency Decontamination Staging
1. Strip contaminated clothing immediately (removes 80-90% of toxic surface particulates).
2. Flush exposed skin and eyes with high-volume, low-pressure lukewarm water for a minimum of 15 minutes.
3. Contain runoff water using absorbent dikes to prevent storm drain contamination.`
  },
  {
    id: 'knw-110',
    title: 'Volunteer Field Kit Checklist & Personal Protective Equipment',
    summary: 'Comprehensive 72-hour field response loadout, hydration gear, essential survival instruments, and emergency readiness kit packing standards.',
    category: 'Emergency Response',
    disasterType: 'General Emergency',
    tags: ['field kit', 'equipment', 'checklist', 'preparedness', 'ppe', 'gear', 'supplies'],
    source: 'Community Emergency Response Team (CERT) Field Operating Manual',
    lastUpdated: '2026-06-25T12:00:00Z',
    readingTime: '3 min read',
    priority: 'normal',
    content: `### 1. Personal Protective Gear (PPE)
- ANSI-certified hard hat with high-visibility reflective striping.
- Polycarbonate safety goggles (sealed for dust/particulates).
- N95 or P100 particulate respirators (minimum 3 units).
- Heavy-duty leather palm work gloves and nitrile medical examination gloves.
- Steel-toe water-resistant work boots with puncture-resistant shanks.

### 2. Medical & Triage Field Kit
- CAT or SOFTT commercial windlass tourniquet.
- 4x4 sterile gauze pads, roll bandages, and triangular cravat bandages.
- Trauma shears, non-latex adhesive tape, and antiseptic wipes.
- Emergency thermal reflective space blankets (2 units).

### 3. Communications & Navigation Tools
- Portable multi-band emergency radio with NOAA weather alert band.
- High-intensity LED headlamp with red night-vision mode and spare batteries.
- Non-liquid magnetic compass and waterproof topographic grid maps of operating sector.
- Permanent marking pens, waterproof notebook, and surveyor's marking tape.`
  }
];

/**
 * Deterministic Knowledge Assistant Pre-compiled Knowledge Graph & Answer Synthesizer
 */
export const DETERMINISTIC_ASSISTANT_KNOWLEDGE_BASE = [
  {
    keywords: ['flood', 'swiftwater', 'flooding', 'water', 'drown', 'levee', 'inundation'],
    disasterType: 'Flood',
    category: 'Evacuation',
    question: 'What should I do during a flood?',
    answer: 'During a flood, immediate life-safety rules take precedence:\n\n1. **Never drive or walk through flood waters:** As little as 6 inches of moving water can sweep an adult off their feet, and 12 inches can carry small vehicles away.\n2. **Evacuate to elevated ground:** Move immediately to high ground outside projected flood plains. Avoid basements and low-lying ground.\n3. **Avoid electrical hazards:** Stay clear of downed power lines and do not touch electrical equipment if you are standing in water or wet ground.\n4. **Monitor emergency broadcasts:** Follow instructions from Incident Command and community emergency coordinators regarding evacuation routes and shelter openings.',
    safetyNotes: 'Treat all urban floodwaters as chemically and biologically contaminated. Do not consume tap water until declared safe by municipal authorities.',
    referencedDocIds: ['knw-102', 'knw-101']
  },
  {
    keywords: ['first aid', 'bleeding', 'tourniquet', 'triage', 'wound', 'cpr', 'trauma', 'injured'],
    disasterType: 'General Emergency',
    category: 'First Aid',
    question: 'How should basic first aid be performed?',
    answer: 'For emergency field first aid, apply the **MARCH** trauma sequence:\n\n1. **Massive Bleeding:** Immediately pack severe wounds with sterile gauze and apply firm direct pressure. For limbs with arterial bleeding, apply a windlass tourniquet 2-3 inches above the wound and twist until bleeding ceases completely.\n2. **Airway:** Ensure the patient\'s airway is open and clear of debris. Position unconscious breathing patients in the recovery position.\n3. **Respiration:** Check for open chest wounds or severe breathing difficulty. Assist ventilation if trained.\n4. **Circulation:** Check radial pulse and skin temperature. Cover patients with a thermal foil blanket to prevent shock and hypothermia.\n5. **Head / Hypothermia:** Keep the patient calm, warm, and elevated away from damp ground while awaiting ambulance transport.',
    safetyNotes: 'Always wear nitrile gloves when handling bodily fluids. Note the exact time of tourniquet placement directly on the strap or forehead.',
    referencedDocIds: ['knw-101', 'knw-110']
  },
  {
    keywords: ['kit', 'carry', 'backpack', 'gear', 'equipment', 'supplies', 'ppe', 'loadout'],
    disasterType: 'General Emergency',
    category: 'Emergency Response',
    question: 'What should volunteers carry during emergency response?',
    answer: 'Community disaster volunteers should deploy with a self-sufficient 72-hour field pack comprising:\n\n1. **Personal Protective Equipment (PPE):** ANSI-certified hard hat, leather work gloves, nitrile exam gloves, P100/N95 respirators, safety goggles, and sturdy steel-toe boots.\n2. **Trauma & First Aid:** Commercial tourniquet, sterile trauma dressing, shears, antiseptic wipes, and two emergency thermal blankets.\n3. **Navigation & Comm:** Multi-channel VHF/UHF radio, high-output LED headlamp with spare batteries, whistle, and waterproof sector maps.\n4. **Sustenance:** 3 liters of potable water, water purification tablets, high-calorie meal bars, and personal medications.',
    safetyNotes: 'Keep your pack weight under 25% of your body weight to prevent exhaustion during prolonged field deployment.',
    referencedDocIds: ['knw-110', 'knw-105']
  },
  {
    keywords: ['earthquake', 'quake', 'tremor', 'seismic', 'collapse', 'shake', 'ground'],
    disasterType: 'Earthquake',
    category: 'Disaster Preparedness',
    question: 'What should I do during an earthquake?',
    answer: 'During an earthquake, take immediate protective action:\n\n1. **DROP, COVER, and HOLD ON:** Drop onto your hands and knees. Crawl under a sturdy desk or table. Cover your head and neck with your arms. Hold on tightly until the shaking stops.\n2. **If Indoors:** Stay inside. Stay away from glass windows, exterior walls, and heavy overhead lighting fixtures. Do not run outside while shaking is occurring.\n3. **If Outdoors:** Move to an open area away from power lines, brick chimneys, and high-rise glass buildings. Drop to the ground.\n4. **Post-Shaking:** Inspect gas connections for leaks (smell of rotten eggs). If gas is leaking, shut off the main valve with a wrench and evacuate.',
    safetyNotes: 'Never use elevators after an earthquake. Expect strong aftershocks that can cause secondary collapse of compromised structures.',
    referencedDocIds: ['knw-103', 'knw-107']
  },
  {
    keywords: ['fire', 'wildfire', 'smoke', 'burn', 'flame', 'ember', 'defensible'],
    disasterType: 'Fire',
    category: 'Fire Safety',
    question: 'What should I do during a wildfire or building fire?',
    answer: 'During a wildfire or structural fire emergency:\n\n1. **Immediate Evacuation:** If an evacuation order is issued, leave immediately. Do not delay to pack personal items.\n2. **Defensible Space:** If time permits prior to evacuation warnings, clear dry leaves from gutters, move flammable patio furniture indoors, and shut all windows and doors.\n3. **Smoke Protection:** Put on an N95/P100 respirator. Close air conditioning vents. Stay low to the floor where air is cooler and clearer.\n4. **Escape Routes:** Know two ways out of your neighborhood. Avoid routes through dense pine forests or narrow canyons.',
    safetyNotes: 'Embers carried by wind can ignite homes miles ahead of the main fire front. Always retreat immediately if flame lengths exceed 8 feet.',
    referencedDocIds: ['knw-104', 'knw-110']
  },
  {
    keywords: ['radio', 'communication', 'mesh', 'vhf', 'uhf', 'frequency', 'channel', 'signal'],
    disasterType: 'General Emergency',
    category: 'Communication',
    question: 'How should radio communication be conducted in an emergency?',
    answer: 'When cellular networks fail, adhere to strict radio discipline:\n\n1. **Think, Key, Speak:** Formulate your message before pressing the push-to-talk (PTT) switch. Speak in a calm, clear voice.\n2. **Brevity & Clarity:** Keep all transmissions under 15 seconds. Use standard ITU phonetics for names and sector coordinates.\n3. **Emergency Priority:** Yield frequency immediately if any station broadcasts "EMERGENCY / FLASH" traffic.\n4. **Relay Protocol:** If you hear a distant station unable to reach Incident Command, step in and relay their coordinates and status.',
    safetyNotes: 'Avoid transmitting confidential personal patient medical info over unencrypted civilian frequencies.',
    referencedDocIds: ['knw-105']
  }
];

export default {
  KNOWLEDGE_CATEGORIES,
  DISASTER_TYPES,
  INITIAL_DEV_KNOWLEDGE,
  DETERMINISTIC_ASSISTANT_KNOWLEDGE_BASE
};
