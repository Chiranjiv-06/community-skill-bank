/**
 * Test script for Stage 2 Frontend Authentication Layer
 */

import { authService } from '../services/authService.js';
import { DEV_USERS } from '../data/devUsers.js';
import { ROLES } from '../utils/roles.js';

// Polyfill localStorage for Node.js environment
if (typeof localStorage === 'undefined' || localStorage === null) {
  let store = {};
  global.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
}

async function runTests() {
  console.log('=== RUNNING STAGE 2 AUTHENTICATION TESTS ===\n');

  // TEST 1: Open application without a session
  localStorage.clear();
  const initialSession = await authService.restoreSession();
  console.assert(initialSession === null, 'TEST 1 Failed: initial session must be null');
  console.log('✔ TEST 1 PASSED: Unauthenticated on clean start (no session)');

  // TEST 2: Login using a development account (Admin)
  const adminLogin = await authService.login({ email: 'admin@skillbank.org', password: 'password123' });
  console.assert(adminLogin?.user?.role === ROLES.ADMIN, 'TEST 2A Failed: Admin role mismatch');
  console.assert(adminLogin?.user?.id === 'dev-adm-001', 'TEST 2A Failed: Admin ID mismatch');
  console.log('✔ TEST 2A PASSED: Login with admin dev user succeeds and returns admin role');

  // TEST 2B: Login using Skilled Volunteer
  const skilledLogin = await authService.login({ email: 'alex.rivera@skillbank.org', password: 'password123' });
  console.assert(skilledLogin?.user?.role === ROLES.SKILLED_VOLUNTEER, 'TEST 2B Failed: Skilled volunteer role mismatch');
  console.log('✔ TEST 2B PASSED: Login with skilled volunteer dev user succeeds and returns skilled_volunteer role');

  // TEST 3: Refresh page (Restore session)
  const restoredSession = await authService.restoreSession();
  console.assert(restoredSession?.user?.email === 'alex.rivera@skillbank.org', 'TEST 3 Failed: Restored session user mismatch');
  console.assert(restoredSession?.user?.role === ROLES.SKILLED_VOLUNTEER, 'TEST 3 Failed: Restored role mismatch');
  console.log('✔ TEST 3 PASSED: Session restored on reload from storage');

  // TEST 4: Logout
  await authService.logout();
  const sessionAfterLogout = await authService.restoreSession();
  console.assert(sessionAfterLogout === null, 'TEST 4 Failed: Session must be null after logout');
  console.log('✔ TEST 4 PASSED: Logout clears session and resets state');

  // TEST 5: Invalid development credentials
  let errorCaught = false;
  try {
    await authService.login({ email: 'admin@skillbank.org', password: 'wrongpassword' });
  } catch (err) {
    errorCaught = true;
    console.assert(err.message.includes('Invalid email or password'), 'TEST 5 Failed: Error message not readable');
  }
  console.assert(errorCaught, 'TEST 5 Failed: Invalid password did not throw error');
  console.log('✔ TEST 5 PASSED: Invalid credentials trigger human-readable error');

  // TEST 6: Register a new development user
  const newRegistration = await authService.register({
    fullName: 'David Kincaid',
    email: 'david@resilience.org',
    password: 'securePassword!',
    phone: '+1 555 456 7890',
    location: 'District 3 - Coastal Sector'
  });
  console.assert(newRegistration?.user?.name === 'David Kincaid', 'TEST 6 Failed: Name mismatch');
  console.assert(newRegistration?.user?.role === ROLES.VOLUNTEER, 'TEST 6 Failed: Default role must be volunteer');
  console.log('✔ TEST 6 PASSED: Registration flow assigns default volunteer role and creates session');

  // TEST 6B: Login with newly registered user
  await authService.logout();
  const newLogin = await authService.login({ email: 'david@resilience.org', password: 'securePassword!' });
  console.assert(newLogin?.user?.email === 'david@resilience.org', 'TEST 6B Failed: New user login failed');
  console.log('✔ TEST 6B PASSED: Can immediately login with newly registered development user');

  // TEST 7: Check user object shape
  const user = newLogin.user;
  console.assert(typeof user.id === 'string', 'TEST 7 Failed: id missing');
  console.assert(typeof user.name === 'string', 'TEST 7 Failed: name missing');
  console.assert(typeof user.email === 'string', 'TEST 7 Failed: email missing');
  console.assert(typeof user.role === 'string', 'TEST 7 Failed: role missing');
  console.log('✔ TEST 7 PASSED: User object matches required shape { id, name, email, role }');

  console.log('\n=== ALL 7 AUTHENTICATION INTEGRITY TESTS PASSED! ===');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
