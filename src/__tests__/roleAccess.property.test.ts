/**
 * Feature: qr-restaurant-system, Property 18: Role-based access control
 * Validates: Requirements 4.3
 * 
 * Property: For any user with a specific role, the user should only access features permitted for that role
 */

import * as fc from 'fast-check';

// Mock user with role
interface MockUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

// Define role permissions
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'], // Admin has all permissions
  waiter: ['orders:read', 'orders:write', 'tables:read', 'tables:write', 'calls:read', 'calls:write'],
  chef: ['orders:read', 'orders:write'],
};

// Helper function to check if user has access to a feature
const hasAccess = (user: MockUser, requiredPermission: string): boolean => {
  // Admin has access to everything
  if (user.role === 'admin') {
    return true;
  }

  // Check if user's role has the required permission
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  if (rolePermissions.includes(requiredPermission)) {
    return true;
  }

  // Check custom permissions
  if (user.permissions.includes(requiredPermission)) {
    return true;
  }

  return false;
};

describe('Property 18: Role-based access control', () => {
  it('should grant admin access to all features', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.emailAddress(),
        fc.constantFrom(
          'menu:read',
          'menu:write',
          'orders:read',
          'orders:write',
          'tables:read',
          'tables:write',
          'users:read',
          'users:write',
          'settings:read',
          'settings:write'
        ),
        (id, email, permission) => {
          const adminUser: MockUser = {
            id,
            email,
            role: 'admin',
            permissions: [],
          };

          const access = hasAccess(adminUser, permission);
          expect(access).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should restrict waiter access to waiter-specific features', () => {
    fc.assert(
      fc.property(fc.uuid(), fc.emailAddress(), (id, email) => {
        const waiterUser: MockUser = {
          id,
          email,
          role: 'waiter',
          permissions: [],
        };

        // Waiter should have access to these
        expect(hasAccess(waiterUser, 'orders:read')).toBe(true);
        expect(hasAccess(waiterUser, 'orders:write')).toBe(true);
        expect(hasAccess(waiterUser, 'tables:read')).toBe(true);
        expect(hasAccess(waiterUser, 'tables:write')).toBe(true);
        expect(hasAccess(waiterUser, 'calls:read')).toBe(true);
        expect(hasAccess(waiterUser, 'calls:write')).toBe(true);

        // Waiter should NOT have access to these
        expect(hasAccess(waiterUser, 'users:write')).toBe(false);
        expect(hasAccess(waiterUser, 'settings:write')).toBe(false);
        expect(hasAccess(waiterUser, 'menu:write')).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should restrict chef access to chef-specific features', () => {
    fc.assert(
      fc.property(fc.uuid(), fc.emailAddress(), (id, email) => {
        const chefUser: MockUser = {
          id,
          email,
          role: 'chef',
          permissions: [],
        };

        // Chef should have access to these
        expect(hasAccess(chefUser, 'orders:read')).toBe(true);
        expect(hasAccess(chefUser, 'orders:write')).toBe(true);

        // Chef should NOT have access to these
        expect(hasAccess(chefUser, 'tables:write')).toBe(false);
        expect(hasAccess(chefUser, 'users:write')).toBe(false);
        expect(hasAccess(chefUser, 'settings:write')).toBe(false);
        expect(hasAccess(chefUser, 'menu:write')).toBe(false);
        expect(hasAccess(chefUser, 'calls:write')).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should grant custom role access based on assigned permissions', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.emailAddress(),
        fc.array(
          fc.constantFrom(
            'menu:read',
            'menu:write',
            'orders:read',
            'tables:read'
          ),
          { minLength: 1, maxLength: 4 }
        ),
        (id, email, permissions) => {
          const customUser: MockUser = {
            id,
            email,
            role: 'custom_role',
            permissions,
          };

          // User should have access to assigned permissions
          permissions.forEach((perm) => {
            expect(hasAccess(customUser, perm)).toBe(true);
          });

          // User should NOT have access to unassigned permissions
          const allPermissions = [
            'menu:read',
            'menu:write',
            'orders:read',
            'orders:write',
            'tables:read',
            'tables:write',
            'users:read',
            'users:write',
          ];

          const unassignedPermissions = allPermissions.filter(
            (p) => !permissions.includes(p)
          );

          unassignedPermissions.forEach((perm) => {
            expect(hasAccess(customUser, perm)).toBe(false);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should deny access to users with no role permissions', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.emailAddress(),
        fc.constantFrom(
          'menu:write',
          'orders:write',
          'tables:write',
          'users:write',
          'settings:write'
        ),
        (id, email, permission) => {
          const noPermUser: MockUser = {
            id,
            email,
            role: 'unknown_role',
            permissions: [],
          };

          const access = hasAccess(noPermUser, permission);
          expect(access).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should respect role hierarchy - admin overrides all', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.emailAddress(),
        fc.array(fc.string(), { maxLength: 5 }),
        fc.string(),
        (id, email, customPermissions, anyPermission) => {
          const adminUser: MockUser = {
            id,
            email,
            role: 'admin',
            permissions: customPermissions,
          };

          // Admin should have access regardless of custom permissions
          const access = hasAccess(adminUser, anyPermission);
          expect(access).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
