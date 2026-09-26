/**
 * Isolated Development Users Dataset
 * 
 * IMPORTANT:
 * This file is strictly for FRONTEND DEVELOPMENT and testing prior to 
 * FastAPI + PostgreSQL backend development.
 * 
 * These accounts are clearly labelled development fixtures.
 * Do NOT use for production.
 */

import { ROLES } from '../utils/roles.js';

export const DEV_USERS = [
  {
    id: 'dev-adm-001',
    name: 'Cmdr. Sarah Vance',
    email: 'admin@skillbank.org',
    password: 'password123',
    role: ROLES.ADMIN
  },
  {
    id: 'dev-skl-002',
    name: 'Alex Rivera',
    email: 'alex.rivera@skillbank.org',
    password: 'password123',
    role: ROLES.SKILLED_VOLUNTEER
  },
  {
    id: 'dev-cit-003',
    name: 'Maria Gonzalez',
    email: 'maria.gonzalez@skillbank.org',
    password: 'password123',
    role: ROLES.CITIZEN_VOLUNTEER
  },
  {
    id: 'dev-vol-004',
    name: 'Jordan Lee',
    email: 'jordan.lee@skillbank.org',
    password: 'password123',
    role: ROLES.VOLUNTEER
  }
];

export default DEV_USERS;
