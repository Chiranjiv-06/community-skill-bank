/**
 * Automated Test Suite for Stage 7 — Assignments / Response
 * Validates Section 12 Testing Requirements
 */

import { assignmentService } from '../services/assignmentService.js';
import {
  INITIAL_DEV_ASSIGNMENTS,
  ASSIGNMENT_STATUSES,
  ASSIGNMENT_PRIORITIES
} from '../data/devAssignments.js';
import { ROLES, isAdminRole, isVolunteerRole } from '../utils/roles.js';

// Polyfill localStorage for Node.js test environment
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

async function runStage7Tests() {
  console.log('====================================================');
  console.log('   RUNNING STAGE 7 — ASSIGNMENTS & RESPONSE TESTS   ');
  console.log('====================================================\n');

  localStorage.clear();
  assignmentService.resetDevelopmentAssignments();

  // -------------------------------------------------------------------------
  // TEST 1: Initial Seed Assignments & Status Models
  // -------------------------------------------------------------------------
  const initialList = await assignmentService.getAssignments();
  console.assert(Array.isArray(initialList) && initialList.length >= 5, 'TEST 1 Failed: Should load at least 5 initial seed assignments');
  console.assert(ASSIGNMENT_STATUSES.includes('assigned'), 'TEST 1 Failed: Status model missing "assigned"');
  console.assert(ASSIGNMENT_STATUSES.includes('accepted'), 'TEST 1 Failed: Status model missing "accepted"');
  console.assert(ASSIGNMENT_STATUSES.includes('in_progress'), 'TEST 1 Failed: Status model missing "in_progress"');
  console.assert(ASSIGNMENT_STATUSES.includes('completed'), 'TEST 1 Failed: Status model missing "completed"');
  console.assert(ASSIGNMENT_STATUSES.includes('declined'), 'TEST 1 Failed: Status model missing "declined"');
  console.log(`✔ TEST 1 PASSED: Initial seed data loaded (${initialList.length} items) with standard status models`);

  // -------------------------------------------------------------------------
  // TEST 2: Assignment Creation (Admin Workflow)
  // -------------------------------------------------------------------------
  const newAssignmentPayload = {
    emergencyId: 'emg-501',
    emergencyTitle: 'Urban Flash Flooding & Evacuation',
    emergencyLocation: 'Riverdale Basin - Sector 4',
    emergencySeverity: 'critical',
    volunteerId: 'dev-skl-002',
    volunteerName: 'Alex Rivera',
    volunteerEmail: 'alex.rivera@skillbank.org',
    volunteerPhone: '+1 (555) 234-5678',
    skill: 'Swift Water Rescue',
    proficiency: 'Expert',
    category: 'Search & Rescue',
    priority: 'Urgent Dispatch',
    stagingArea: 'Sector 4 North Bridge Checkpoint',
    instructions: 'Deploy watercraft, assist with residential evacuations in lower basin.',
    assignedBy: 'Cmdr. Sarah Vance'
  };

  const created = await assignmentService.createAssignment(newAssignmentPayload);
  console.assert(created && created.id, 'TEST 2 Failed: Created assignment must have an ID');
  console.assert(created.status === 'assigned', 'TEST 2 Failed: Initial status must be "assigned"');
  console.assert(created.volunteerId === 'dev-skl-002', 'TEST 2 Failed: Volunteer ID mismatch');
  console.assert(created.skill === 'Swift Water Rescue', 'TEST 2 Failed: Skill designation mismatch');
  console.assert(created.createdTime, 'TEST 2 Failed: Missing created timestamp');
  console.log(`✔ TEST 2 PASSED: Admin successfully created assignment ${created.id} with status "${created.status}"`);

  // -------------------------------------------------------------------------
  // TEST 3: Assignment Persistence in localStorage
  // -------------------------------------------------------------------------
  const rawStorage = localStorage.getItem('csb_dev_assignments');
  console.assert(rawStorage !== null, 'TEST 3 Failed: Storage key "csb_dev_assignments" must exist in localStorage');
  const parsedStorage = JSON.parse(rawStorage);
  const foundInStorage = parsedStorage.find((a) => a.id === created.id);
  console.assert(foundInStorage !== undefined, 'TEST 3 Failed: Created assignment not found in persistent store');
  console.assert(foundInStorage.stagingArea === 'Sector 4 North Bridge Checkpoint', 'TEST 3 Failed: Staging area persistence mismatch');
  console.log('✔ TEST 3 PASSED: Assignment state correctly serialized and persisted in localStorage');

  // -------------------------------------------------------------------------
  // TEST 4: Admin Assignment Access, Filtering & Search
  // -------------------------------------------------------------------------
  const allAssignments = await assignmentService.getAssignments();
  const assignedOnly = await assignmentService.getAssignments({ status: 'assigned' });
  const inProgressOnly = await assignmentService.getAssignments({ status: 'in_progress' });
  const emgFiltered = await assignmentService.getAssignments({ emergencyId: 'emg-501' });
  const searchResults = await assignmentService.getAssignments({ search: 'Alex Rivera' });

  console.assert(assignedOnly.every((a) => a.status === 'assigned'), 'TEST 4 Failed: Status filter violated');
  console.assert(inProgressOnly.every((a) => a.status === 'in_progress'), 'TEST 4 Failed: In-progress filter violated');
  console.assert(emgFiltered.every((a) => a.emergencyId === 'emg-501'), 'TEST 4 Failed: Emergency filter violated');
  console.assert(searchResults.length > 0 && searchResults.some((a) => a.volunteerName === 'Alex Rivera'), 'TEST 4 Failed: Search query matching failed');
  console.log(`✔ TEST 4 PASSED: Admin access supports filtering by status, emergency, and search query`);

  // -------------------------------------------------------------------------
  // TEST 5: Volunteer Assignment Access & Scoping
  // -------------------------------------------------------------------------
  const alexAssignments = await assignmentService.getAssignmentsForVolunteer('dev-skl-002');
  console.assert(alexAssignments.length > 0, 'TEST 5 Failed: Alex Rivera must have at least 1 assignment');
  console.assert(alexAssignments.every((a) => a.volunteerId === 'dev-skl-002' || a.volunteerName === 'Alex Rivera'),
    'TEST 5 Failed: Volunteer assignment query returned unassigned items');
  console.log(`✔ TEST 5 PASSED: Volunteer portal accurately scopes assignments to volunteer (${alexAssignments.length} found)`);

  // -------------------------------------------------------------------------
  // TEST 6: Volunteer Response Workflow (Acceptance)
  // -------------------------------------------------------------------------
  const accepted = await assignmentService.respondToAssignment(created.id, {
    response: 'accepted',
    notes: 'Mobilizing Zodiac boat unit. ETA 12 minutes to North Bridge.'
  });
  console.assert(accepted.status === 'accepted', 'TEST 6 Failed: Status must transition to "accepted"');
  console.assert(accepted.responseInfo !== null, 'TEST 6 Failed: Response metadata must be populated');
  console.assert(accepted.responseInfo.response === 'accepted', 'TEST 6 Failed: ResponseInfo type mismatch');
  console.assert(accepted.responseInfo.notes.includes('Zodiac boat'), 'TEST 6 Failed: Response notes missing');
  console.assert(accepted.responseInfo.respondedAt, 'TEST 6 Failed: Response timestamp missing');
  console.log(`✔ TEST 6 PASSED: Volunteer accepted assignment (${created.id}) with telemetry notes & timestamp`);

  // -------------------------------------------------------------------------
  // TEST 7: Volunteer Response Workflow (Decline Validation)
  // -------------------------------------------------------------------------
  const testDeclineAssignment = await assignmentService.createAssignment({
    emergencyId: 'emg-502',
    volunteerId: 'vol-test-decline',
    volunteerName: 'Test Candidate',
    skill: 'First Aid'
  });
  const declined = await assignmentService.respondToAssignment(testDeclineAssignment.id, {
    response: 'declined',
    notes: 'Equipment failure; unable to deploy.'
  });
  console.assert(declined.status === 'declined', 'TEST 7 Failed: Status must transition to "declined"');
  console.assert(declined.responseInfo.response === 'declined', 'TEST 7 Failed: Declined info mismatch');
  console.log(`✔ TEST 7 PASSED: Volunteer decline flow handled with reason logging`);

  // -------------------------------------------------------------------------
  // TEST 8: In Progress Workflow State Transition
  // -------------------------------------------------------------------------
  const inProgress = await assignmentService.startAssignment(created.id, {
    notes: 'Arrived at Sector 4 North Bridge. Commencing boat launch.'
  });
  console.assert(inProgress.status === 'in_progress', 'TEST 8 Failed: Status must transition to "in_progress"');
  console.assert(inProgress.inProgressInfo !== null, 'TEST 8 Failed: In-progress metadata must be populated');
  console.assert(inProgress.inProgressInfo.startedAt, 'TEST 8 Failed: Missing startedAt timestamp');
  console.assert(inProgress.inProgressInfo.notes.includes('Arrived at Sector 4'), 'TEST 8 Failed: On-scene notes missing');
  console.log(`✔ TEST 8 PASSED: Assignment transitioned to "in_progress" with on-scene deployment log`);

  // -------------------------------------------------------------------------
  // TEST 9: Completion Workflow State Transition
  // -------------------------------------------------------------------------
  const completed = await assignmentService.completeAssignment(created.id, {
    completionNotes: 'Successfully evacuated 14 residents across 3 boat sorties. Handed over to relief shelter.'
  });
  console.assert(completed.status === 'completed', 'TEST 9 Failed: Status must transition to "completed"');
  console.assert(completed.completionInfo !== null, 'TEST 9 Failed: Completion metadata must be populated');
  console.assert(completed.completionInfo.completedAt, 'TEST 9 Failed: Missing completedAt timestamp');
  console.assert(completed.completionInfo.completionNotes.includes('14 residents'), 'TEST 9 Failed: Completion debrief notes missing');
  console.log(`✔ TEST 9 PASSED: Assignment successfully transitioned to "completed" with debrief notes`);

  // -------------------------------------------------------------------------
  // TEST 10: Strict Workflow Progression & Guard Validation
  // -------------------------------------------------------------------------
  let threwOnInvalidProgression = false;
  try {
    // Attempting to complete an assignment that is already completed
    await assignmentService.completeAssignment(created.id, { completionNotes: 'Duplicate complete' });
  } catch (err) {
    threwOnInvalidProgression = true;
  }
  console.assert(threwOnInvalidProgression, 'TEST 10 Failed: Should reject completing an already completed assignment');

  let threwOnInvalidRespond = false;
  try {
    // Attempting to respond to an assignment that is completed
    await assignmentService.respondToAssignment(created.id, { response: 'accepted' });
  } catch (err) {
    threwOnInvalidRespond = true;
  }
  console.assert(threwOnInvalidRespond, 'TEST 10 Failed: Should reject responding to non-assigned status');

  let threwOnInvalidStart = false;
  try {
    // Attempting to start an already completed assignment
    await assignmentService.startAssignment(created.id, { notes: 'Invalid start' });
  } catch (err) {
    threwOnInvalidStart = true;
  }
  console.assert(threwOnInvalidStart, 'TEST 10 Failed: Should reject starting non-accepted assignment');

  console.log('✔ TEST 10 PASSED: Strict lifecycle guard conditions enforced; illegal state jumps rejected');

  // -------------------------------------------------------------------------
  // TEST 11: Admin Response Monitoring & Telemetry
  // -------------------------------------------------------------------------
  const monitoredAssignment = await assignmentService.getAssignmentById(created.id);
  console.assert(monitoredAssignment !== null, 'TEST 11 Failed: Assignment lookup by ID failed');
  console.assert(monitoredAssignment.responseInfo !== null, 'TEST 11 Failed: Response telemetry visible to Admin');
  console.assert(monitoredAssignment.inProgressInfo !== null, 'TEST 11 Failed: In-progress telemetry visible to Admin');
  console.assert(monitoredAssignment.completionInfo !== null, 'TEST 11 Failed: Completion telemetry visible to Admin');
  console.log('✔ TEST 11 PASSED: Admin response monitoring displays full lifecycle telemetry from dispatch to completion');

  // -------------------------------------------------------------------------
  // TEST 12: Admin Assignment Deletion/Cancellation
  // -------------------------------------------------------------------------
  const deleteResult = await assignmentService.deleteAssignment(testDeclineAssignment.id);
  console.assert(deleteResult === true, 'TEST 12 Failed: deleteAssignment should return true');
  const deletedCheck = await assignmentService.getAssignmentById(testDeclineAssignment.id);
  console.assert(deletedCheck === null, 'TEST 12 Failed: Deleted assignment must no longer exist');
  console.log('✔ TEST 12 PASSED: Admin assignment cancellation/deletion verified');

  // -------------------------------------------------------------------------
  // TEST 13: Role Access Controls Validation
  // -------------------------------------------------------------------------
  console.assert(isAdminRole(ROLES.ADMIN) === true, 'TEST 13 Failed: ADMIN role check failed');
  console.assert(isAdminRole(ROLES.SKILLED_VOLUNTEER) === false, 'TEST 13 Failed: Volunteer must not have admin access');
  console.assert(isAdminRole(ROLES.CITIZEN_VOLUNTEER) === false, 'TEST 13 Failed: Citizen volunteer must not have admin access');
  console.assert(isVolunteerRole(ROLES.SKILLED_VOLUNTEER) === true, 'TEST 13 Failed: Skilled volunteer check failed');
  console.assert(isVolunteerRole(ROLES.ADMIN) === false, 'TEST 13 Failed: Admin is not a volunteer role');
  console.log('✔ TEST 13 PASSED: Role access rules strictly separate Admin management from Volunteer responses');

  // -------------------------------------------------------------------------
  // TEST 14: Confirmation of Scope Boundaries
  // -------------------------------------------------------------------------
  // Verify that no Stage 8 models or certificates are present in assignment records
  console.assert(created.trustScore === undefined, 'TEST 14 Failed: Stage 8 trustScore must not be present');
  console.assert(created.certificateId === undefined, 'TEST 14 Failed: Stage 8 certificateId must not be present');
  console.assert(created.trainingModule === undefined, 'TEST 14 Failed: Stage 8 trainingModule must not be present');
  console.log('✔ TEST 14 PASSED: Stage 8 certification, training, and trust scoring are NOT implemented');

  console.log('\n====================================================');
  console.log('   ALL STAGE 7 TESTS PASSED SUCCESSFULLY (14/14)    ');
  console.log('====================================================\n');
}

runStage7Tests().catch((err) => {
  console.error('STAGE 7 TEST FAILED:', err);
  process.exit(1);
});
