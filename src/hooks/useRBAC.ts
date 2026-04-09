// src/hooks/useRBAC.ts
import { useAuth } from '../context/AuthContext';

const ROLES = {
  ADMIN: 'admin',
  OFFICE_HEAD: 'office_head',
  MEAL_HEAD: 'meal_head',
  STAFF: 'staff',
  SK: 'sk',
  LYDC: 'lydc',
} as const;

export type AppRole = typeof ROLES[keyof typeof ROLES];

export function useRBAC() {
  const { user } = useAuth();
  const role = (user?.role ?? '') as AppRole;

  return {
    role,

    // --- Navigation & Route Access ---
    canAccessAdministration: [ROLES.ADMIN, ROLES.OFFICE_HEAD].includes(role as any),
    canAccessAuditLogs:      [ROLES.ADMIN].includes(role as any),
    canAccessDashboard:      [ROLES.ADMIN, ROLES.SK, ROLES.LYDC, ROLES.MEAL_HEAD, ROLES.OFFICE_HEAD, ROLES.STAFF].includes(role as any),
    canAccessSKReports:      [ROLES.ADMIN, ROLES.SK, ROLES.OFFICE_HEAD].includes(role as any),
    canAccessLYDCReports:    [ROLES.ADMIN, ROLES.LYDC, ROLES.OFFICE_HEAD].includes(role as any),
    canAccessMEAL:           [ROLES.ADMIN, ROLES.STAFF, ROLES.MEAL_HEAD, ROLES.OFFICE_HEAD].includes(role as any),

    // --- MEAL System Granular ---
    canViewAnalytics:  [ROLES.ADMIN, ROLES.MEAL_HEAD, ROLES.OFFICE_HEAD].includes(role as any),
    canApproveReports: [ROLES.ADMIN, ROLES.OFFICE_HEAD].includes(role as any),   // definitive approval
    canAssignReports:  [ROLES.ADMIN, ROLES.MEAL_HEAD, ROLES.OFFICE_HEAD].includes(role as any),
    canViewAllRecords: [ROLES.ADMIN, ROLES.MEAL_HEAD, ROLES.OFFICE_HEAD].includes(role as any),

    // --- Convenience Booleans ---
    isAdmin:      role === ROLES.ADMIN,
    isOfficeHead: role === ROLES.OFFICE_HEAD,
    isMealHead:   role === ROLES.MEAL_HEAD,
    isStaff:      role === ROLES.STAFF,
  };
}
