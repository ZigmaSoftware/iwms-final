import type { ReactNode } from "react";

export type UserRole = "admin" | "user";

interface LayoutChildren {
  children: ReactNode;
}

export interface AdminLayoutProps extends LayoutChildren {}
export interface DashboardLayoutProps extends LayoutChildren {}

export interface RoleBasedLayoutProps extends LayoutChildren {
  /**
   * Optional override useful for testing or forcing a role context.
   */
  roleOverride?: UserRole | null;
}

export const USER_ROLE_STORAGE_KEY = "user_role";
export const ADMIN_ROLE: UserRole = "admin";
export const DEFAULT_ROLE: UserRole = "user";

export function normalizeRole(role: string | null | undefined): UserRole | null {
  if (!role) {
    return null;
  }

  const normalized = role.toLowerCase();

  if (normalized === ADMIN_ROLE) {
    return ADMIN_ROLE;
  }

  if (normalized === DEFAULT_ROLE) {
    return DEFAULT_ROLE;
  }

  return null;
}
