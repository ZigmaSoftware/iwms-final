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

export const ADMIN_VIEW_MODE_STORAGE_KEY = "admin_view_preference";
export const ADMIN_VIEW_MODE_ADMIN = "admin" as const;
export const ADMIN_VIEW_MODE_DASHBOARD = "dashboard" as const;
export type AdminViewMode = typeof ADMIN_VIEW_MODE_ADMIN | typeof ADMIN_VIEW_MODE_DASHBOARD;

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

const isBrowser = () => typeof window !== "undefined";

const getAdminViewStorage = () => {
  if (!isBrowser()) {
    return null;
  }

  return localStorage.getItem(ADMIN_VIEW_MODE_STORAGE_KEY);
};

export function getAdminViewPreference(): AdminViewMode {
  const stored = getAdminViewStorage();
  return stored === ADMIN_VIEW_MODE_DASHBOARD ? ADMIN_VIEW_MODE_DASHBOARD : ADMIN_VIEW_MODE_ADMIN;
}

export function setAdminViewPreference(mode: AdminViewMode) {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(ADMIN_VIEW_MODE_STORAGE_KEY, mode);
}

export function clearAdminViewPreference() {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(ADMIN_VIEW_MODE_STORAGE_KEY);
}
