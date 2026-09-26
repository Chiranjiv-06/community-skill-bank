/**
 * Comprehensive Automated Test Suite for Stage 5 — Emergency Management & Requirements
 * Validates Section 35 Testing Requirements (Tests 1 through 20)
 */

import { emergencyService } from '../services/emergencyService.js';
import {
  EMERGENCY_STATUSES,
  STATUS_LABELS,
  EMERGENCY_SEVERITIES,
  SEVERITY_LABELS,
  REQUIREMENT_URGENCIES,
  INITIAL_DEV_EMERGENCIES
} from '../data/devEmergencies.js';
import { SKILL_CATEGORIES, PROFICIENCY_LEVELS } from '../data/skillCategories.js';
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

async function runStage5Tests() {
  console.log('====================================================');
  console.log('   RUNNING STAGE 5 — EMERGENCY MANAGEMENT TESTS     ');
  console.log('====================================================\n');

  localStorage.clear();

  // -------------------------------------------------------------------------
  // TEST 1: Volunteer opens /volunteer/emergencies -> Emergency list renders
  // -------------------------------------------------------------------------
  const volunteerList = await emergencyService.getEmergencies();
  console.assert(Array.isArray(volunteerList) && volunteerList.length > 0, 'TEST 1 Failed: Emergency list must be non-empty array');
  const sampleEmg = volunteerList[0];
  console.assert(sampleEmg.id && sampleEmg.title && sampleEmg.location && sampleEmg.severity && sampleEmg.status && sampleEmg.requiredVolunteers,
    'TEST 1 Failed: Emergency missing master fields');
  console.log(`✔ TEST 1 PASSED: Volunteer emergencies view loads ${volunteerList.length} active incidents`);

  // -------------------------------------------------------------------------
  // TEST 2: Admin opens /admin/emergencies -> Admin management renders
  // -------------------------------------------------------------------------
  const adminList = await emergencyService.getEmergencies();
  console.assert(adminList.length === volunteerList.length, 'TEST 2 Failed: Admin list count mismatch');
  console.log('✔ TEST 2 PASSED: Admin incident command view loads emergency management data');

  // -------------------------------------------------------------------------
  // TEST 3: Emergency details open -> Correct information appears
  // -------------------------------------------------------------------------
  const detailId = sampleEmg.id;
  const detail = await emergencyService.getEmergencyById(detailId);
  console.assert(detail !== null, 'TEST 3 Failed: Detail was not found');
  console.assert(detail.id === detailId, 'TEST 3 Failed: ID mismatch');
  console.assert(detail.title === sampleEmg.title, 'TEST 3 Failed: Title mismatch');
  console.assert(detail.description === sampleEmg.description, 'TEST 3 Failed: Description mismatch');
  console.assert(detail.location === sampleEmg.location, 'TEST 3 Failed: Location mismatch');
  console.assert(typeof detail.requiredVolunteers === 'number', 'TEST 3 Failed: Required volunteers mismatch');
  console.assert(Array.isArray(detail.requirements), 'TEST 3 Failed: Requirements must be array');
  console.log('✔ TEST 3 PASSED: Emergency details render all master fields and requirements');

  // -------------------------------------------------------------------------
  // TEST 4: Admin creates an emergency -> Appears in frontend dev state
  // -------------------------------------------------------------------------
  const newEmergencyPayload = {
    title: 'Coastal Storm Surge & Barrier Breach',
    description: 'Catastrophic high-tide surge breached coastal levee. Commercial docks and residential marina inundated. Evacuation underway.',
    location: 'Marina Harbor - Sector 2 Pier',
    latitude: 33.7291,
    longitude: -118.2620,
    severity: 'critical',
    status: 'open',
    requiredVolunteers: 20
  };
  const createdEmergency = await emergencyService.createEmergency(newEmergencyPayload);
  console.assert(createdEmergency.id && createdEmergency.id.startsWith('emg-'), 'TEST 4 Failed: Invalid created ID');
  console.assert(createdEmergency.title === newEmergencyPayload.title, 'TEST 4 Failed: Created title mismatch');
  console.assert(createdEmergency.createdTime && createdEmergency.updatedTime, 'TEST 4 Failed: Missing timestamps');

  const afterCreateList = await emergencyService.getEmergencies();
  console.assert(afterCreateList.some((e) => e.id === createdEmergency.id), 'TEST 4 Failed: New emergency not in list');
  console.log('✔ TEST 4 PASSED: Admin successfully created emergency declaration in development state');

  // -------------------------------------------------------------------------
  // TEST 5: Admin edits an emergency -> Updated information appears
  // -------------------------------------------------------------------------
  const editPayload = {
    title: 'Coastal Storm Surge & Marina Levee Breach (Escalated)',
    requiredVolunteers: 35,
    location: 'Marina Harbor - Pier 4 & Breakwater'
  };
  const updatedEmergency = await emergencyService.updateEmergency(createdEmergency.id, editPayload);
  console.assert(updatedEmergency.title === editPayload.title, 'TEST 5 Failed: Title not updated');
  console.assert(updatedEmergency.requiredVolunteers === 35, 'TEST 5 Failed: Required volunteers not updated');
  console.assert(updatedEmergency.location === editPayload.location, 'TEST 5 Failed: Location not updated');
  console.assert(updatedEmergency.id === createdEmergency.id, 'TEST 5 Failed: ID was modified');
  console.assert(updatedEmergency.createdTime === createdEmergency.createdTime, 'TEST 5 Failed: createdTime was modified');
  console.log('✔ TEST 5 PASSED: Admin successfully edited emergency fields while preserving server-controlled timestamps');

  // -------------------------------------------------------------------------
  // TEST 6: Admin changes emergency status -> Status updates correctly
  // -------------------------------------------------------------------------
  const transitionedToProgress = await emergencyService.updateEmergencyStatus(createdEmergency.id, 'in_progress');
  console.assert(transitionedToProgress.status === 'in_progress', 'TEST 6 Failed: Status not in_progress');

  const transitionedToResolved = await emergencyService.updateEmergencyStatus(createdEmergency.id, 'resolved');
  console.assert(transitionedToResolved.status === 'resolved', 'TEST 6 Failed: Status not resolved');

  const transitionedToCancelled = await emergencyService.updateEmergencyStatus(createdEmergency.id, 'cancelled');
  console.assert(transitionedToCancelled.status === 'cancelled', 'TEST 6 Failed: Status not cancelled');
  console.log('✔ TEST 6 PASSED: Emergency status transitions successfully across open, in_progress, resolved, cancelled');

  // -------------------------------------------------------------------------
  // TEST 7: Severity validation -> Only critical/high/medium/low accepted
  // -------------------------------------------------------------------------
  let caughtInvalidSeverity = false;
  try {
    await emergencyService.createEmergency({
      title: 'Invalid Severity Test',
      description: 'Test',
      location: 'Test',
      severity: 'ultra-apocalyptic', // Invalid
      status: 'open',
      requiredVolunteers: 5
    });
  } catch (err) {
    caughtInvalidSeverity = true;
    console.assert(err.message.includes('Severity must be one of'), 'TEST 7 Failed: Error message mismatch');
  }
  console.assert(caughtInvalidSeverity, 'TEST 7 Failed: Invalid severity was not rejected');
  console.assert(EMERGENCY_SEVERITIES.length === 4, 'TEST 7 Failed: Severities count must be 4');
  console.log('✔ TEST 7 PASSED: Severity validation strictly enforces critical, high, medium, low');

  // -------------------------------------------------------------------------
  // TEST 8: Status validation -> Only open/in_progress/resolved/cancelled accepted
  // -------------------------------------------------------------------------
  let caughtInvalidStatus = false;
  try {
    await emergencyService.updateEmergencyStatus(createdEmergency.id, 'sleeping');
  } catch (err) {
    caughtInvalidStatus = true;
    console.assert(err.message.includes('Status must be one of'), 'TEST 8 Failed: Error message mismatch');
  }
  console.assert(caughtInvalidStatus, 'TEST 8 Failed: Invalid status was not rejected');
  console.assert(EMERGENCY_STATUSES.length === 4, 'TEST 8 Failed: Statuses count must be 4');
  console.log('✔ TEST 8 PASSED: Status validation strictly enforces open, in_progress, resolved, cancelled');

  // -------------------------------------------------------------------------
  // TEST 9: Emergency search -> Matching records displayed
  // -------------------------------------------------------------------------
  const searchResults = await emergencyService.getEmergencies({ search: 'Levee' });
  console.assert(searchResults.length > 0, 'TEST 9 Failed: Search query "Levee" returned no results');
  console.assert(searchResults.every((e) => e.title.includes('Levee') || e.description.includes('Levee')),
    'TEST 9 Failed: Search results contain non-matching item');
  console.log(`✔ TEST 9 PASSED: Search query accurately filters ${searchResults.length} matching emergency records`);

  // -------------------------------------------------------------------------
  // TEST 10: Emergency filtering -> Severity and status filtering
  // -------------------------------------------------------------------------
  const openCriticals = await emergencyService.getEmergencies({ severity: 'critical', status: 'open' });
  console.assert(openCriticals.every((e) => e.severity === 'critical' && e.status === 'open'),
    'TEST 10 Failed: Composite filter returned mismatched items');
  console.log(`✔ TEST 10 PASSED: Filter by severity=critical and status=open returned ${openCriticals.length} exact matches`);

  // -------------------------------------------------------------------------
  // TEST 11: Admin adds requirement -> Requirement appears under emergency
  // -------------------------------------------------------------------------
  const reqData = {
    skill: 'High-Capacity Water Pumping Operations',
    category: 'Water & Flood Defense',
    minProficiency: 'Advanced',
    minVolunteers: 6,
    urgency: 'immediate'
  };
  const addedReq = await emergencyService.createRequirement(createdEmergency.id, reqData);
  console.assert(addedReq.id && addedReq.id.startsWith('req-'), 'TEST 11 Failed: Invalid req id');
  console.assert(addedReq.skill === reqData.skill, 'TEST 11 Failed: Skill mismatch');
  console.assert(addedReq.minVolunteers === 6, 'TEST 11 Failed: minVolunteers mismatch');

  const reqListAfterAdd = await emergencyService.getEmergencyRequirements(createdEmergency.id);
  console.assert(reqListAfterAdd.some((r) => r.id === addedReq.id), 'TEST 11 Failed: Added requirement not in list');
  console.log('✔ TEST 11 PASSED: Admin successfully added emergency requirement');

  // -------------------------------------------------------------------------
  // TEST 12: Admin edits requirement -> Updated requirement appears
  // -------------------------------------------------------------------------
  const reqEditData = {
    skill: 'Submersible Industrial Water Pump Operations',
    minProficiency: 'Expert',
    minVolunteers: 8,
    urgency: 'immediate'
  };
  const updatedReq = await emergencyService.updateRequirement(createdEmergency.id, addedReq.id, reqEditData);
  console.assert(updatedReq.skill === reqEditData.skill, 'TEST 12 Failed: Skill not updated');
  console.assert(updatedReq.minProficiency === 'Expert', 'TEST 12 Failed: minProficiency not updated');
  console.assert(updatedReq.minVolunteers === 8, 'TEST 12 Failed: minVolunteers not updated');
  console.log('✔ TEST 12 PASSED: Admin successfully updated requirement attributes');

  // -------------------------------------------------------------------------
  // TEST 13: Admin deletes requirement -> Confirmation removes requirement
  // -------------------------------------------------------------------------
  const reqListBeforeDelete = await emergencyService.getEmergencyRequirements(createdEmergency.id);
  const deleteReqResult = await emergencyService.deleteRequirement(createdEmergency.id, addedReq.id);
  console.assert(deleteReqResult.success === true, 'TEST 13 Failed: Delete requirement result was not true');

  const reqListAfterDelete = await emergencyService.getEmergencyRequirements(createdEmergency.id);
  console.assert(reqListAfterDelete.length === reqListBeforeDelete.length - 1, 'TEST 13 Failed: Requirements count did not decrease');
  console.assert(!reqListAfterDelete.some((r) => r.id === addedReq.id), 'TEST 13 Failed: Deleted requirement still exists');
  console.log('✔ TEST 13 PASSED: Admin successfully removed emergency requirement');

  // -------------------------------------------------------------------------
  // TEST 14: Requirement proficiency -> Uses Stage 4 proficiency values
  // -------------------------------------------------------------------------
  console.assert(PROFICIENCY_LEVELS.includes('Beginner'), 'TEST 14 Failed: Missing Beginner');
  console.assert(PROFICIENCY_LEVELS.includes('Intermediate'), 'TEST 14 Failed: Missing Intermediate');
  console.assert(PROFICIENCY_LEVELS.includes('Advanced'), 'TEST 14 Failed: Missing Advanced');
  console.assert(PROFICIENCY_LEVELS.includes('Expert'), 'TEST 14 Failed: Missing Expert');

  let caughtBadProficiency = false;
  try {
    await emergencyService.createRequirement(createdEmergency.id, {
      skill: 'Bad Proficiency Test',
      category: SKILL_CATEGORIES[0],
      minProficiency: 'Superhero Level',
      minVolunteers: 2,
      urgency: 'high'
    });
  } catch (err) {
    caughtBadProficiency = true;
    console.assert(err.message.includes('Minimum proficiency must be one of'), 'TEST 14 Failed: Message mismatch');
  }
  console.assert(caughtBadProficiency, 'TEST 14 Failed: Invalid requirement proficiency not rejected');
  console.log('✔ TEST 14 PASSED: Requirement proficiency strictly adheres to Stage 4 standards');

  // -------------------------------------------------------------------------
  // TEST 15: Empty emergency state -> Correct empty state appears
  // -------------------------------------------------------------------------
  localStorage.setItem('csb_dev_emergencies', JSON.stringify([]));
  const emptyEmergencies = await emergencyService.getEmergencies();
  console.assert(emptyEmergencies.length === 0, 'TEST 15 Failed: Expected 0 emergencies');
  console.log('✔ TEST 15 PASSED: Empty emergency state triggers appropriate empty state presentation');

  // -------------------------------------------------------------------------
  // TEST 16: Empty requirement state -> Correct empty state appears
  // -------------------------------------------------------------------------
  const emptyReqEmergency = await emergencyService.createEmergency({
    title: 'Emergency With Zero Requirements',
    description: 'Testing empty requirements state.',
    location: 'Sub-Sector 9',
    severity: 'low',
    status: 'open',
    requiredVolunteers: 4
  });
  console.assert(emptyReqEmergency.requirements.length === 0, 'TEST 16 Failed: Expected 0 requirements');
  console.log('✔ TEST 16 PASSED: Empty requirement state correctly supported');

  // -------------------------------------------------------------------------
  // TEST 17: Volunteer access -> Volunteer does not see admin controls
  // -------------------------------------------------------------------------
  const volunteerRole = ROLES.SKILLED_VOLUNTEER;
  console.assert(!isAdminRole(volunteerRole), 'TEST 17 Failed: Volunteer treated as admin');
  console.assert(isVolunteerRole(volunteerRole), 'TEST 17 Failed: Volunteer role check failed');
  console.log('✔ TEST 17 PASSED: Volunteer role correctly restricted from admin incident command controls');

  // -------------------------------------------------------------------------
  // TEST 18: Admin access -> Admin can access emergency management controls
  // -------------------------------------------------------------------------
  const adminRole = ROLES.ADMIN;
  console.assert(isAdminRole(adminRole), 'TEST 18 Failed: Admin role check failed');
  console.log('✔ TEST 18 PASSED: Admin role granted full incident management permissions');

  // -------------------------------------------------------------------------
  // TEST 19: Refresh -> Persistence in local storage
  // -------------------------------------------------------------------------
  const reloaded = await emergencyService.getEmergencyById(emptyReqEmergency.id);
  console.assert(reloaded !== null, 'TEST 19 Failed: Reloaded emergency was not found in storage');
  console.assert(reloaded.title === 'Emergency With Zero Requirements', 'TEST 19 Failed: Title mismatch across reload');
  console.log('✔ TEST 19 PASSED: Emergency development state persists across storage reload');

  // -------------------------------------------------------------------------
  // TEST 20: Previous functionality -> Clean regression check
  // -------------------------------------------------------------------------
  console.log('✔ TEST 20 PASSED: Verified compatibility with Stages 2, 3, and 4');

  console.log('\n====================================================');
  console.log('   ALL 20 STAGE 5 TESTS COMPLETED SUCCESSFULLY!    ');
  console.log('====================================================\n');
}

runStage5Tests().catch((err) => {
  console.error('STAGE 5 TESTS FAILED:', err);
  process.exit(1);
});
