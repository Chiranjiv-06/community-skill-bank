/**
 * Centralized Role Model & Helpers for Community Skill Bank
 * Disaster & Emergency Response
 */

export const ROLES = {
  ADMIN: 'admin',
  SKILLED_VOLUNTEER: 'skilled_volunteer',
  CITIZEN_VOLUNTEER: 'citizen_volunteer',
  VOLUNTEER: 'volunteer',
};

export const ADMIN_ROLES = [ROLES.ADMIN];

export const VOLUNTEER_ROLES = [
  ROLES.SKILLED_VOLUNTEER,
  ROLES.CITIZEN_VOLUNTEER,
  ROLES.VOLUNTEER,
];

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Emergency Administrator',
  [ROLES.SKILLED_VOLUNTEER]: 'Skilled Volunteer Specialist',
  [ROLES.CITIZEN_VOLUNTEER]: 'Citizen First Responder',
  [ROLES.VOLUNTEER]: 'Community Volunteer',
};

export const ROLE_BADGE_VARIANTS = {
  [ROLES.ADMIN]: 'badge-primary',
  [ROLES.SKILLED_VOLUNTEER]: 'badge-info',
  [ROLES.CITIZEN_VOLUNTEER]: 'badge-success',
  [ROLES.VOLUNTEER]: 'badge-neutral',
};

/**
 * Check if the user has an Admin role
 * @param {string} role
 * @returns {boolean}
 */
export const isAdminRole = (role) => {
  return role === ROLES.ADMIN;
};

/**
 * Check if the user has any volunteer role
 * @param {string} role
 * @returns {boolean}
 */
export const isVolunteerRole = (role) => {
  return VOLUNTEER_ROLES.includes(role);
};

/**
 * Determine default dashboard path based on role
 * @param {string} role
 * @returns {string}
 */
export const getDefaultDashboard = (role) => {
  if (role === ROLES.ADMIN) {
    return '/admin/dashboard';
  }
  return '/volunteer/dashboard';
};

/**
 * Check if a role matches one of allowed roles
 * @param {string} role 
 * @param {string[]} allowedRoles 
 * @returns {boolean}
 */
export const hasPermission = (role, allowedRoles = []) => {
  if (!role) return false;
  if (role === ROLES.ADMIN) return true; // Admins have elevated access by default
  return allowedRoles.includes(role);
};
