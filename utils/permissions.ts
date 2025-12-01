// Role hierarchy and permission utilities for Next.js

export const ROLE_HIERARCHY = {
  'Corporate Admin': 5,
  'Business Coach': 4,
  'Territory Admin': 3,
  'Territory Manager': 2,
  'Sales User': 1
} as const;

export type Role = keyof typeof ROLE_HIERARCHY;

export const ROLE_PERMISSIONS: Record<Role, Record<string, boolean>> = {
  'Corporate Admin': {
    canViewDashboard: true,
    canViewProspects: true,
    canViewActivities: true,
    canViewReports: true,
    canViewUsers: true,
    canViewTerritories: true,
    canViewPartners: true,
    canManageUsers: true,
    canManageTerritories: true,
    canAssignLeads: true,
    canEditAllLeads: true,
    canViewAllLeads: true,
    canViewAnalytics: true,
    canViewSettings: true
  },
  'Business Coach': {
    canViewDashboard: true,
    canViewProspects: true,
    canViewActivities: true,
    canViewReports: true,
    canViewUsers: true,
    canViewTerritories: true,
    canViewPartners: true,
    canManageUsers: false,
    canManageTerritories: false,
    canAssignLeads: false,
    canEditAllLeads: false,
    canViewAllLeads: true,
    canViewAnalytics: true,
    canViewSettings: false
  },
  'Territory Admin': {
    canViewDashboard: true,
    canViewProspects: true,
    canViewActivities: true,
    canViewReports: true,
    canViewUsers: true,
    canViewTerritories: true,
    canViewPartners: true,
    canManageUsers: true,
    canManageTerritories: false,
    canAssignLeads: true,
    canEditAllLeads: true,
    canViewAllLeads: true,
    canViewAnalytics: true,
    canViewSettings: false
  },
  'Territory Manager': {
    canViewDashboard: true,
    canViewProspects: true,
    canViewActivities: true,
    canViewReports: true,
    canViewUsers: true,
    canViewTerritories: true,
    canViewPartners: false,
    canManageUsers: false,
    canManageTerritories: false,
    canAssignLeads: true,
    canEditAllLeads: false,
    canViewAllLeads: true,
    canViewAnalytics: true,
    canViewSettings: false
  },
  'Sales User': {
    canViewDashboard: true,
    canViewProspects: true,
    canViewActivities: true,
    canViewReports: false,
    canViewUsers: false,
    canViewTerritories: false,
    canViewPartners: false,
    canManageUsers: false,
    canManageTerritories: false,
    canAssignLeads: false,
    canEditAllLeads: false,
    canViewAllLeads: false,
    canViewAnalytics: false,
    canViewSettings: false
  }
};

export function canAccess(userRole: Role | string | null | undefined, permission: string): boolean {
  if (!userRole) return false;
  
  // Normalize role name - handle case differences and trim whitespace
  const normalizedRole = String(userRole).trim();
  const roleKey = Object.keys(ROLE_PERMISSIONS).find(
    key => key.toLowerCase() === normalizedRole.toLowerCase()
  ) as Role | undefined;
  
  const role = roleKey || 'Sales User';
  const permissions = ROLE_PERMISSIONS[role];
  return permissions[permission] || false;
}

export function hasMinimumRole(userRole: Role | string | null | undefined, minimumRole: Role): boolean {
  if (!userRole) return false;
  const userLevel = ROLE_HIERARCHY[userRole as Role] || 0;
  const minimumLevel = ROLE_HIERARCHY[minimumRole] || 0;
  return userLevel >= minimumLevel;
}

export function getVisibleNavItems(userRole: Role | string | null | undefined) {
  const items: Array<{ name: string; route: string; icon: string }> = [];
  
  if (!userRole) {
    return items;
  }
  
  if (canAccess(userRole, 'canViewDashboard')) {
    items.push({ name: 'Dashboard', route: '/', icon: 'dashboard' });
  }
  
  if (canAccess(userRole, 'canViewProspects')) {
    items.push({ name: 'Prospects', route: '/prospects', icon: 'prospects' });
  }
  
  if (canAccess(userRole, 'canViewActivities')) {
    items.push({ name: 'Activities', route: '/activities', icon: 'activities' });
  }
  
  if (canAccess(userRole, 'canViewTerritories')) {
    items.push({ name: 'Territories', route: '/territories', icon: 'territories' });
  }
  
  if (canAccess(userRole, 'canViewPartners')) {
    items.push({ name: 'Partners', route: '/partners', icon: 'partners' });
  }
  
  if (canAccess(userRole, 'canViewUsers')) {
    items.push({ name: 'Users', route: '/users', icon: 'users' });
  }
  
  items.push({ name: 'Knowledge Base', route: '/knowledge-base', icon: 'knowledge-base' });
  
  return items;
}

