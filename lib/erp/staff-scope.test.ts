import { describe, expect, it } from "vitest";
import { crmLeadScopeWhere } from "@/lib/erp/staff-scope";

const runIntegration =
  process.env.RUN_INTEGRATION_TESTS === "1" && Boolean(process.env.DATABASE_URL);

describe("cross-branch isolation (scope predicates)", () => {
  it("branch-scoped staff only sees their branch in crmLeadScopeWhere", () => {
    const where = crmLeadScopeWhere({
      isFullAccess: true,
      isCrossBranch: false,
      organizationId: "org-mcs",
      branchId: "branch-colombo",
      orgRole: "GENERAL_STAFF",
      employeeId: "emp-1",
      departmentId: null,
      userId: "user-1",
      visibleUserIds: null,
    });
    expect(where).toEqual({
      organizationId: "org-mcs",
      branchId: "branch-colombo",
    });
  });

  it("cross-branch admin omits branchId filter", () => {
    const where = crmLeadScopeWhere({
      isFullAccess: true,
      isCrossBranch: true,
      organizationId: "org-mcs",
      branchId: null,
      orgRole: "ADMIN",
      employeeId: null,
      departmentId: null,
      userId: "admin-1",
      visibleUserIds: null,
    });
    expect(where.organizationId).toBe("org-mcs");
    expect(where).not.toHaveProperty("branchId");
  });
});

describe.skipIf(!runIntegration)("cross-branch CRM isolation (integration)", () => {
  it("STAFF in branch A cannot query leads from branch B", async () => {
    const { prisma } = await import("@/lib/db");
    const { getStaffScope } = await import("@/lib/erp/staff-scope");

    const org = await prisma.organization.findFirst({
      where: { isPrimary: true, deletedAt: null },
      select: { id: true },
    });
    if (!org) return;

    const branchA = await prisma.branch.create({
      data: {
        organizationId: org.id,
        code: `TST-A-${Date.now()}`,
        name: "Test Branch A",
        status: "ACTIVE",
      },
    });
    const branchB = await prisma.branch.create({
      data: {
        organizationId: org.id,
        code: `TST-B-${Date.now()}`,
        name: "Test Branch B",
        status: "ACTIVE",
      },
    });

    const staffUser = await prisma.user.create({
      data: {
        email: `scope-test-${Date.now()}@merncrest.lk`,
        passwordHash: "test",
        fullName: "Scope Test Staff",
        role: "STAFF",
      },
    });

    await prisma.employee.create({
      data: {
        employeeCode: `EMP-SCOPE-${Date.now()}`,
        userId: staffUser.id,
        fullName: staffUser.fullName,
        email: staffUser.email,
        jobTitle: "Tester",
        orgRole: "GENERAL_STAFF",
        branchId: branchA.id,
      },
    });

    const leadA = await prisma.crmLead.create({
      data: {
        fullName: "Lead A",
        email: `lead-a-${Date.now()}@test.lk`,
        organizationId: org.id,
        branchId: branchA.id,
      },
    });
    const leadB = await prisma.crmLead.create({
      data: {
        fullName: "Lead B",
        email: `lead-b-${Date.now()}@test.lk`,
        organizationId: org.id,
        branchId: branchB.id,
      },
    });

    const scope = await getStaffScope({
      id: staffUser.id,
      email: staffUser.email,
      fullName: staffUser.fullName,
      role: "STAFF",
      company: null,
      emailVerifiedAt: null,
    });

    const visible = await prisma.crmLead.findMany({
      where: crmLeadScopeWhere(scope),
      select: { id: true },
    });

    const ids = visible.map((l) => l.id);
    expect(ids).toContain(leadA.id);
    expect(ids).not.toContain(leadB.id);

    await prisma.crmLead.deleteMany({ where: { id: { in: [leadA.id, leadB.id] } } });
    await prisma.employee.deleteMany({ where: { userId: staffUser.id } });
    await prisma.user.delete({ where: { id: staffUser.id } });
    await prisma.branch.deleteMany({ where: { id: { in: [branchA.id, branchB.id] } } });
  });
});
