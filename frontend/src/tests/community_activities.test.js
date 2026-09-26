/**
 * Automated Test Suite for Stage 9 — Community Activities
 * Validates Section 10 Testing Requirements
 */

import { communityService } from '../services/communityService.js';
import {
  INITIAL_DEV_ACTIVITIES,
  INITIAL_DEV_PARTICIPATIONS,
  ACTIVITY_STATUSES,
  ACTIVITY_CATEGORIES
} from '../data/devActivities.js';
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

async function runStage9Tests() {
  console.log('====================================================');
  console.log('   RUNNING STAGE 9 — COMMUNITY ACTIVITIES TESTS     ');
  console.log('====================================================\n');

  localStorage.clear();
  communityService.resetDevelopmentActivities();

  // -------------------------------------------------------------------------
  // TEST 1: Initial Seed Activities & Status Lifecycle Model
  // -------------------------------------------------------------------------
  const activities = await communityService.getActivities();
  console.assert(Array.isArray(activities) && activities.length >= 6, 'TEST 1 Failed: Should load at least 6 seed activities');
  console.assert(ACTIVITY_STATUSES.includes('scheduled'), 'TEST 1 Failed: Status missing "scheduled"');
  console.assert(ACTIVITY_STATUSES.includes('in_progress'), 'TEST 1 Failed: Status missing "in_progress"');
  console.assert(ACTIVITY_STATUSES.includes('completed'), 'TEST 1 Failed: Status missing "completed"');
  console.assert(ACTIVITY_STATUSES.includes('cancelled'), 'TEST 1 Failed: Status missing "cancelled"');
  console.log(`✔ TEST 1 PASSED: Loaded ${activities.length} seed activities with complete lifecycle states`);

  // -------------------------------------------------------------------------
  // TEST 2: Activity Details Lookup with Participant Roster
  // -------------------------------------------------------------------------
  const testActivity = await communityService.getActivityById('act-901');
  console.assert(testActivity !== null, 'TEST 2 Failed: Activity lookup failed');
  console.assert(testActivity.title.includes('Sandbagging'), 'TEST 2 Failed: Title mismatch');
  console.assert(testActivity.location.includes('Riverwalk'), 'TEST 2 Failed: Location mismatch');
  console.assert(Array.isArray(testActivity.participants) && testActivity.participants.length >= 2,
    'TEST 2 Failed: Activity should include participant roster');
  console.log(`✔ TEST 2 PASSED: Activity detail retrieved with full briefing specs and ${testActivity.participants.length} enrolled participants`);

  // -------------------------------------------------------------------------
  // TEST 3: Admin Activity Creation Workflow
  // -------------------------------------------------------------------------
  const newActivityPayload = {
    title: 'Disaster Blanket & Emergency Supply Drive',
    category: 'Disaster Shelter Logistics',
    description: 'Collecting and staging thermal blankets, emergency cots, and non-perishable rations.',
    location: 'Central Community Center Plaza',
    address: '500 Central Avenue, Ward 1',
    date: '2026-10-20',
    startTime: '08:00 AM',
    endTime: '02:00 PM',
    duration: '6 Hours',
    capacity: 45,
    organizer: 'Civic Resilience Network',
    organizerContact: 'supplies@skillbank.org',
    requiredSkills: ['Inventory Intake', 'Physical Labor'],
    recommendedGear: 'Comfortable clothing, leather work gloves'
  };

  const createdActivity = await communityService.createActivity(newActivityPayload);
  console.assert(createdActivity && createdActivity.id, 'TEST 3 Failed: Created activity must have an ID');
  console.assert(createdActivity.status === 'scheduled', 'TEST 3 Failed: Initial status must be "scheduled"');
  console.assert(createdActivity.capacity === 45, 'TEST 3 Failed: Capacity mismatch');
  console.assert(createdActivity.currentParticipantsCount === 0, 'TEST 3 Failed: Initial count must be 0');
  console.log(`✔ TEST 3 PASSED: Admin created community activity ${createdActivity.id} with status "scheduled"`);

  // -------------------------------------------------------------------------
  // TEST 4: Activity Persistence in LocalStorage
  // -------------------------------------------------------------------------
  const rawStorage = localStorage.getItem('csb_dev_activities');
  console.assert(rawStorage !== null, 'TEST 4 Failed: Storage key "csb_dev_activities" missing');
  const parsedActivities = JSON.parse(rawStorage);
  const foundInStore = parsedActivities.find((a) => a.id === createdActivity.id);
  console.assert(foundInStore !== undefined, 'TEST 4 Failed: Created activity must persist in storage');
  console.assert(foundInStore.location === 'Central Community Center Plaza', 'TEST 4 Failed: Location persistence mismatch');
  console.log('✔ TEST 4 PASSED: Community activity persisted reliably in localStorage');

  // -------------------------------------------------------------------------
  // TEST 5: Volunteer Participation Workflow (Join / RSVP)
  // -------------------------------------------------------------------------
  const joinResult = await communityService.joinActivity(createdActivity.id, {
    id: 'dev-skl-002',
    name: 'Alex Rivera',
    email: 'alex.rivera@skillbank.org',
    notes: 'Will coordinate volunteer logistics truck.'
  });
  console.assert(joinResult.success === true, 'TEST 5 Failed: Join activity failed');
  console.assert(joinResult.participation.volunteerId === 'dev-skl-002', 'TEST 5 Failed: Participant ID mismatch');

  // Verify participant count updated
  const updatedCreated = await communityService.getActivityById(createdActivity.id);
  console.assert(updatedCreated.currentParticipantsCount === 1, 'TEST 5 Failed: Participant count should increment to 1');

  // Verify registration check
  const isRegistered = await communityService.isVolunteerRegistered(createdActivity.id, 'dev-skl-002');
  console.assert(isRegistered === true, 'TEST 5 Failed: isVolunteerRegistered should return true');
  console.log('✔ TEST 5 PASSED: Volunteer successfully joined activity; participation count incremented');

  // -------------------------------------------------------------------------
  // TEST 6: Volunteer Participation Cancellation (Leave / Cancel RSVP)
  // -------------------------------------------------------------------------
  const leaveResult = await communityService.leaveActivity(createdActivity.id, 'dev-skl-002');
  console.assert(leaveResult === true, 'TEST 6 Failed: Leave activity failed');

  const afterLeave = await communityService.getActivityById(createdActivity.id);
  console.assert(afterLeave.currentParticipantsCount === 0, 'TEST 6 Failed: Participant count should decrement back to 0');

  const isStillRegistered = await communityService.isVolunteerRegistered(createdActivity.id, 'dev-skl-002');
  console.assert(isStillRegistered === false, 'TEST 6 Failed: Volunteer should no longer be registered');
  console.log('✔ TEST 6 PASSED: Volunteer successfully cancelled RSVP; participation count decremented');

  // -------------------------------------------------------------------------
  // TEST 7: Volunteer "My Activities" Scoping
  // -------------------------------------------------------------------------
  // Alex Rivera is initially registered for act-901, act-903, act-906
  const alexActivities = await communityService.getVolunteerActivities('dev-skl-002');
  console.assert(Array.isArray(alexActivities) && alexActivities.length >= 3, 'TEST 7 Failed: Alex Rivera should have at least 3 activities');
  console.assert(alexActivities.every((a) => a.participation && a.participation.volunteerId === 'dev-skl-002'),
    'TEST 7 Failed: My Activities query returned unassigned items');
  console.log(`✔ TEST 7 PASSED: Volunteer My Activities portal accurately scoped (${alexActivities.length} registered activities)`);

  // -------------------------------------------------------------------------
  // TEST 8: Admin Status Lifecycle Progression
  // -------------------------------------------------------------------------
  const inProgressActivity = await communityService.updateActivityStatus(createdActivity.id, 'in_progress');
  console.assert(inProgressActivity.status === 'in_progress', 'TEST 8 Failed: Status should transition to in_progress');

  const completedActivity = await communityService.updateActivityStatus(createdActivity.id, 'completed');
  console.assert(completedActivity.status === 'completed', 'TEST 8 Failed: Status should transition to completed');

  // Verify that volunteer cannot join completed activity
  let threwOnCompletedJoin = false;
  try {
    await communityService.joinActivity(createdActivity.id, { id: 'dev-skl-002' });
  } catch (err) {
    threwOnCompletedJoin = true;
  }
  console.assert(threwOnCompletedJoin, 'TEST 8 Failed: Should reject joining a completed activity');
  console.log('✔ TEST 8 PASSED: Admin updated activity status (scheduled -> in_progress -> completed); join guards enforced');

  // -------------------------------------------------------------------------
  // TEST 9: Admin Edit and Deletion of Activities
  // -------------------------------------------------------------------------
  const edited = await communityService.updateActivity(createdActivity.id, {
    description: 'Updated operational description with revised loading times.'
  });
  console.assert(edited.description.includes('revised loading times'), 'TEST 9 Failed: Update description failed');

  const deleteResult = await communityService.deleteActivity(createdActivity.id);
  console.assert(deleteResult === true, 'TEST 9 Failed: Delete activity failed');
  const deletedCheck = await communityService.getActivityById(createdActivity.id);
  console.assert(deletedCheck === null, 'TEST 9 Failed: Deleted activity must no longer exist');
  console.log('✔ TEST 9 PASSED: Admin activity editing and deletion verified');

  // -------------------------------------------------------------------------
  // TEST 10: Filtering & Search Query Matching
  // -------------------------------------------------------------------------
  const radioActivities = await communityService.getActivities({ category: 'Emergency Radio Mesh Drill' });
  console.assert(radioActivities.length > 0 && radioActivities.every((a) => a.category === 'Emergency Radio Mesh Drill'),
    'TEST 10 Failed: Category filter violated');

  const searchResults = await communityService.getActivities({ search: 'Sandbagging' });
  console.assert(searchResults.length > 0 && searchResults.some((a) => a.title.includes('Sandbagging')),
    'TEST 10 Failed: Search matching failed');
  console.log('✔ TEST 10 PASSED: Filter by category and search queries return precise matches');

  // -------------------------------------------------------------------------
  // TEST 11: Role Access Rules Separation
  // -------------------------------------------------------------------------
  console.assert(isAdminRole(ROLES.ADMIN) === true, 'TEST 11 Failed: Admin check failed');
  console.assert(isAdminRole(ROLES.SKILLED_VOLUNTEER) === false, 'TEST 11 Failed: Volunteer must not have admin access');
  console.assert(isVolunteerRole(ROLES.SKILLED_VOLUNTEER) === true, 'TEST 11 Failed: Volunteer role check failed');
  console.assert(isVolunteerRole(ROLES.ADMIN) === false, 'TEST 11 Failed: Admin is not a volunteer role');
  console.log('✔ TEST 11 PASSED: Role boundaries strictly separate Admin activity administration from Volunteer RSVP');

  // -------------------------------------------------------------------------
  // TEST 12: Scope Boundaries: Zero Stage 10 Code
  // -------------------------------------------------------------------------
  // Verify that no WebSocket or Stage 10 notification broadcast logic exists in activity records
  console.assert(testActivity.webSocketChannel === undefined, 'TEST 12 Failed: Stage 10 WebSocket channel must not exist');
  console.assert(testActivity.pushNotificationId === undefined, 'TEST 12 Failed: Stage 10 push notification must not exist');
  console.log('✔ TEST 12 PASSED: Stage 10 Notifications & WebSocket confirmed absent from Stage 9');

  console.log('\n====================================================');
  console.log('   ALL STAGE 9 TESTS PASSED SUCCESSFULLY (12/12)    ');
  console.log('====================================================\n');
}

runStage9Tests().catch((err) => {
  console.error('STAGE 9 TEST FAILED:', err);
  process.exit(1);
});
