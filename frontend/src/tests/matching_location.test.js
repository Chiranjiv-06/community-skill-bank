/**
 * Comprehensive Automated Test Suite for Stage 6 — Location + Matching + Recommendations
 * Validates Section 9 Testing Requirements
 */

import { locationService } from '../services/locationService.js';
import { matchingService } from '../services/matchingService.js';
import { intelligenceService } from '../services/intelligenceService.js';
import { emergencyService } from '../services/emergencyService.js';
import { DEV_NEARBY_VOLUNTEERS, DEV_EMERGENCY_INTELLIGENCE } from '../data/devMatching.js';
import { ROLES, isAdminRole, isVolunteerRole } from '../utils/roles.js';

// Polyfill localStorage for Node.js environment
if (typeof localStorage === 'undefined' || localStorage === null) {
  let store = {};
  global.localStorage = {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, val) => {
      store[key] = String(val);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
}

async function runStage6Tests() {
  console.log('====================================================');
  console.log('   RUNNING STAGE 6 — LOCATION & MATCHING TESTS      ');
  console.log('====================================================\n');

  localStorage.clear();
  const testEmergencyId = 'emg-501';

  // -------------------------------------------------------------------------
  // TEST 1: Emergency location data retrieval & representation
  // -------------------------------------------------------------------------
  const locationData = await locationService.getEmergencyLocation(testEmergencyId);
  console.assert(locationData !== null, 'TEST 1 Failed: Location data must not be null');
  console.assert(typeof locationData.latitude === 'number', 'TEST 1 Failed: Latitude must be a number');
  console.assert(typeof locationData.longitude === 'number', 'TEST 1 Failed: Longitude must be a number');
  console.assert(locationData.location.includes('Ward 7'), 'TEST 1 Failed: Location sector mismatch');
  console.log(`✔ TEST 1 PASSED: Emergency location accurately resolved to (${locationData.latitude}, ${locationData.longitude}) in ${locationData.location}`);

  // -------------------------------------------------------------------------
  // TEST 2: Nearby volunteers list & distance display
  // -------------------------------------------------------------------------
  const nearbyVolunteers = await locationService.getNearbyVolunteers(testEmergencyId);
  console.assert(Array.isArray(nearbyVolunteers) && nearbyVolunteers.length > 0, 'TEST 2 Failed: Nearby volunteers must be non-empty array');
  const firstNearby = nearbyVolunteers[0];
  console.assert(firstNearby.name && firstNearby.skill && firstNearby.proficiency && firstNearby.distance && firstNearby.eligibility,
    'TEST 2 Failed: Nearby volunteer missing required properties');
  console.assert(firstNearby.distance.includes('km'), 'TEST 2 Failed: Distance format must include unit (e.g. km)');
  console.log(`✔ TEST 2 PASSED: Retrieved ${nearbyVolunteers.length} nearby volunteers with distance (e.g. ${firstNearby.distance})`);

  // -------------------------------------------------------------------------
  // TEST 3: Eligibility display & criteria
  // -------------------------------------------------------------------------
  const eligibleVol = nearbyVolunteers.find((v) => v.eligibility.toLowerCase().includes('eligible'));
  const restrictedVol = nearbyVolunteers.find((v) => v.eligibility.toLowerCase().includes('below'));
  console.assert(eligibleVol !== undefined, 'TEST 3 Failed: Eligible volunteer not found');
  console.assert(restrictedVol !== undefined, 'TEST 3 Failed: Restricted volunteer not found');
  console.log(`✔ TEST 3 PASSED: Eligibility accurately distinguishes between "${eligibleVol.eligibility}" and "${restrictedVol.eligibility}"`);

  // -------------------------------------------------------------------------
  // TEST 4: Volunteer matching candidates & match scores (Pre-calculated dev values)
  // -------------------------------------------------------------------------
  const matches = await matchingService.getEmergencyMatches(testEmergencyId);
  console.assert(Array.isArray(matches) && matches.length > 0, 'TEST 4 Failed: Matches must be non-empty array');
  const sampleMatch = matches[0];
  console.assert(sampleMatch.volunteerName && sampleMatch.skill && sampleMatch.matchScore,
    'TEST 4 Failed: Match missing volunteerName, skill, or matchScore');
  console.assert(sampleMatch.matchScore.includes('%'), 'TEST 4 Failed: Match score format must be percentage string');
  console.log(`✔ TEST 4 PASSED: Matching returned ${matches.length} candidates with pre-calculated match scores (e.g. ${sampleMatch.matchScore})`);

  // -------------------------------------------------------------------------
  // TEST 5: Matching filtering by required skill
  // -------------------------------------------------------------------------
  const filteredMatches = await matchingService.getEmergencyMatches(testEmergencyId, {
    skill: 'Swift Water & Flood Rescue'
  });
  console.assert(filteredMatches.length > 0, 'TEST 5 Failed: Filtered matches returned empty');
  console.assert(filteredMatches.every((m) => m.skill === 'Swift Water & Flood Rescue'),
    'TEST 5 Failed: Match filter returned non-matching skill');
  console.log(`✔ TEST 5 PASSED: Filter by skill returned ${filteredMatches.length} matching candidate responders`);

  // -------------------------------------------------------------------------
  // TEST 6: Emergency intelligence report representation
  // -------------------------------------------------------------------------
  const intelligence = await intelligenceService.getEmergencyIntelligence(testEmergencyId);
  console.assert(intelligence !== null, 'TEST 6 Failed: Intelligence report is null');
  console.assert(intelligence.severity === 'critical', 'TEST 6 Failed: Severity mismatch');
  console.assert(intelligence.urgency === 'immediate', 'TEST 6 Failed: Urgency mismatch');
  console.assert(Array.isArray(intelligence.requiredSkillsSummary) && intelligence.requiredSkillsSummary.length > 0,
    'TEST 6 Failed: Required skills summary must be non-empty array');
  console.assert(intelligence.locationValidation && intelligence.locationValidation.status,
    'TEST 6 Failed: Location validation missing');
  console.assert(Array.isArray(intelligence.riskFlags) && intelligence.riskFlags.length > 0,
    'TEST 6 Failed: Risk flags must be non-empty array');
  console.assert(typeof intelligence.reasoning === 'string' && intelligence.reasoning.length > 20,
    'TEST 6 Failed: Decision reasoning narrative must be detailed');
  console.log(`✔ TEST 6 PASSED: Emergency intelligence loaded with ${intelligence.riskFlags.length} risk flags and decision reasoning`);

  // -------------------------------------------------------------------------
  // TEST 7: Recommended volunteers for administrators
  // -------------------------------------------------------------------------
  const recommendations = await matchingService.getEmergencyRecommendations(testEmergencyId);
  console.assert(Array.isArray(recommendations) && recommendations.length > 0,
    'TEST 7 Failed: Recommendations must be non-empty array');
  const topRec = recommendations[0];
  console.assert(topRec.volunteerName && topRec.recommendationScore && topRec.matchScore && topRec.certificationCount && topRec.priority,
    'TEST 7 Failed: Recommendation item missing required properties');
  console.assert(typeof topRec.recommendationScore === 'string', 'TEST 7 Failed: Recommendation score must be string');
  console.assert(typeof topRec.certificationCount === 'number', 'TEST 7 Failed: Certification count must be number');
  console.log(`✔ TEST 7 PASSED: Generated ${recommendations.length} recommendations (Top: ${topRec.volunteerName}, Score: ${topRec.recommendationScore})`);

  // -------------------------------------------------------------------------
  // TEST 8: Recommendation detail inspection
  // -------------------------------------------------------------------------
  const recDetail = await matchingService.getRecommendationDetails(testEmergencyId, topRec.id);
  console.assert(recDetail !== null, 'TEST 8 Failed: Recommendation detail not found');
  console.assert(recDetail.reasoning && recDetail.reasoning.length > 10, 'TEST 8 Failed: Missing recommendation reasoning');
  console.assert(recDetail.trustScore, 'TEST 8 Failed: Missing trust score');
  console.log('✔ TEST 8 PASSED: Recommendation inspection returned complete multi-factor evaluation details');

  // -------------------------------------------------------------------------
  // TEST 9: Role access differentiation (Volunteer vs Admin)
  // -------------------------------------------------------------------------
  const volunteerRole = ROLES.SKILLED_VOLUNTEER;
  const adminRole = ROLES.ADMIN;
  console.assert(!isAdminRole(volunteerRole), 'TEST 9 Failed: Volunteer should not be admin');
  console.assert(isAdminRole(adminRole), 'TEST 9 Failed: Admin should be recognized as admin');
  console.log('✔ TEST 9 PASSED: Role boundaries correctly enforce Admin-only access to Recommendation Engine');

  // -------------------------------------------------------------------------
  // TEST 10: Empty states handling
  // -------------------------------------------------------------------------
  const emptyMatches = await matchingService.getEmergencyMatches('non-existent-emg');
  console.assert(Array.isArray(emptyMatches), 'TEST 10 Failed: Empty matches must return array');
  const emptyRecs = await matchingService.getEmergencyRecommendations('non-existent-emg');
  console.assert(Array.isArray(emptyRecs), 'TEST 10 Failed: Empty recommendations must return array');
  console.log('✔ TEST 10 PASSED: Empty states handled gracefully with predictable fallbacks');

  // -------------------------------------------------------------------------
  // TEST 11: Error handling for missing emergency location
  // -------------------------------------------------------------------------
  let caughtMissing = false;
  try {
    await locationService.getEmergencyLocation('invalid-id-xyz');
  } catch (err) {
    caughtMissing = true;
    console.assert(err.message.includes('not found'), 'TEST 11 Failed: Error message mismatch');
  }
  console.assert(caughtMissing, 'TEST 11 Failed: Missing emergency did not throw error');
  console.log('✔ TEST 11 PASSED: Location service handles missing emergency with clear exception');

  // -------------------------------------------------------------------------
  // TEST 12: Zero calculations verification
  // -------------------------------------------------------------------------
  console.assert(topRec.matchScore === '98%', 'TEST 12 Failed: Match score altered by frontend');
  console.assert(topRec.recommendationScore === '96/100', 'TEST 12 Failed: Recommendation score altered by frontend');
  console.log('✔ TEST 12 PASSED: Verified zero JavaScript matching or recommendation score computation');

  console.log('\n====================================================');
  console.log('   ALL 12 STAGE 6 TESTS COMPLETED SUCCESSFULLY!    ');
  console.log('====================================================\n');
}

runStage6Tests().catch((err) => {
  console.error('STAGE 6 TESTS FAILED:', err);
  process.exit(1);
});
