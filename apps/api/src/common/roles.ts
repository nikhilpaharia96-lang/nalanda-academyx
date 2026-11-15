import type { Role } from "@nalanda/shared";

/** Roles that may run the whole school. */
export const ADMIN_ONLY: Role[] = ["SUPER_ADMIN", "ADMIN"];

/**
 * Roles that handle money: fees, payments, receipts, concessions (read) and payroll.
 * The accountant records and collects; approvals and destructive actions (waive a fee, delete a
 * structure, grant a concession) stay with admins.
 */
export const FINANCE_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"];

export const isAdminRole = (role: string) => role === "SUPER_ADMIN" || role === "ADMIN";
export const isFinanceRole = (role: string) => isAdminRole(role) || role === "ACCOUNTANT";
