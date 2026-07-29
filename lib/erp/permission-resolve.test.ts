import { describe, expect, it } from "vitest";
import { ERP_PERMISSIONS } from "@/lib/erp/permission-matrix";
import { resolveEffectivePermissions } from "@/lib/erp/permission-resolve";

describe("resolveEffectivePermissions — Model A (platform ceiling)", () => {
  it("STAFF platform + CEO org role does not grant erp.permissions.manage", () => {
    const perms = resolveEffectivePermissions({
      platformRole: "STAFF",
      orgRole: "CEO",
      extraGrants: [],
    });
    expect(perms.has("erp.permissions.manage")).toBe(false);
    expect(perms.has("erp.hr.view")).toBe(true);
    expect(perms.has("erp.finance.manage")).toBe(true);
  });

  it("STAFF platform + CEO org role does not yield blanket manage on all modules via *", () => {
    const perms = resolveEffectivePermissions({
      platformRole: "STAFF",
      orgRole: "CEO",
      extraGrants: ["erp.permissions.manage"],
    });
    expect(perms.has("erp.permissions.manage")).toBe(false);
    expect(perms.size).toBeLessThan(ERP_PERMISSIONS.length);
  });

  it("CUSTOMER platform role yields empty set regardless of org role", () => {
    const perms = resolveEffectivePermissions({
      platformRole: "CUSTOMER",
      orgRole: "CEO",
      extraGrants: ["erp.hr.view"],
    });
    expect(perms.size).toBe(0);
  });

  it("legacy STAFF org role normalizes to GENERAL_STAFF preset", () => {
    const perms = resolveEffectivePermissions({
      platformRole: "STAFF",
      orgRole: "STAFF",
      extraGrants: [],
    });
    expect(perms.has("erp.projects.view")).toBe(true);
    expect(perms.has("erp.permissions.manage")).toBe(false);
  });
});

describe("isOrgRole / normalizeOrgRole", () => {
  it("distinguishes platform STAFF from org GENERAL_STAFF", async () => {
    const { isPlatformRole, isOrgRole, normalizeOrgRole } = await import(
      "@/lib/erp/role-guards"
    );
    expect(isPlatformRole("STAFF")).toBe(true);
    expect(isOrgRole("STAFF")).toBe(false);
    expect(isOrgRole("GENERAL_STAFF")).toBe(true);
    expect(normalizeOrgRole("STAFF")).toBe("GENERAL_STAFF");
  });
});

describe("crmLeadScopeWhere", () => {
  it("scopes by organizationId and branchId for branch staff", async () => {
    const { crmLeadScopeWhere } = await import("@/lib/erp/staff-scope");
    const where = crmLeadScopeWhere({
      isFullAccess: true,
      isCrossBranch: false,
      organizationId: "org-1",
      branchId: "branch-a",
      orgRole: "GENERAL_STAFF",
      employeeId: "emp-1",
      departmentId: null,
      userId: "user-1",
      visibleUserIds: null,
    });
    expect(where).toEqual({
      organizationId: "org-1",
      branchId: "branch-a",
    });
  });

  it("omits branchId for cross-branch OWNER/ADMIN", async () => {
    const { crmLeadScopeWhere } = await import("@/lib/erp/staff-scope");
    const where = crmLeadScopeWhere({
      isFullAccess: true,
      isCrossBranch: true,
      organizationId: "org-1",
      branchId: null,
      orgRole: "OWNER",
      employeeId: null,
      departmentId: null,
      userId: "user-owner",
      visibleUserIds: null,
    });
    expect(where).toEqual({ organizationId: "org-1" });
    expect(where).not.toHaveProperty("branchId");
  });
});
