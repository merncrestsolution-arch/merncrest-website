"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Org = {
  id: string;
  code: string;
  name: string;
  isPrimary: boolean;
  status: string;
  branches: { id: string; code: string; name: string; city: string | null; isHeadOffice: boolean }[];
};

type Dept = {
  id: string;
  code: string;
  name: string;
  _count?: { employees: number };
};

export function ErpOrgPanel() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [orgForm, setOrgForm] = useState({ code: "", name: "", country: "Sri Lanka" });
  const [branchForm, setBranchForm] = useState({
    organizationId: "",
    code: "",
    name: "",
    city: "",
  });
  const [deptForm, setDeptForm] = useState({ code: "", name: "" });

  const load = useCallback(async () => {
    const res = await fetch("/api/erp/org");
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed");
    else {
      setOrgs(data.organizations ?? []);
      setDepts(data.departments ?? []);
      setBranchForm((f) =>
        f.organizationId || !data.organizations?.[0]
          ? f
          : { ...f, organizationId: data.organizations[0].id }
      );
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/erp/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...orgForm, isPrimary: orgs.length === 0 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessage(`Organization ${data.organization.name} created`);
      setOrgForm({ code: "", name: "", country: "Sri Lanka" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function createBranch(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/erp/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "branch", ...branchForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessage(`Branch ${data.branch.name} created`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function createDept(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/erp/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "department", ...deptForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessage(`Department ${data.department.name} created`);
      setDeptForm({ code: "", name: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted">
        Multi-company / multi-branch ready. MernCrest is the primary tenant; additional
        organizations can be onboarded for SaaS.
      </p>
      {message && <p className="text-sm text-success">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid lg:grid-cols-3 gap-4">
        <form onSubmit={createOrg} className="rounded-xl border border-white/10 p-4 space-y-2">
          <h3 className="font-semibold text-sm">Add organization</h3>
          <input
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder="Code"
            value={orgForm.code}
            onChange={(e) => setOrgForm({ ...orgForm, code: e.target.value })}
            required
          />
          <input
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder="Name"
            value={orgForm.name}
            onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
            required
          />
          <Button type="submit" size="sm" disabled={busy}>
            Create
          </Button>
        </form>

        <form onSubmit={createBranch} className="rounded-xl border border-white/10 p-4 space-y-2">
          <h3 className="font-semibold text-sm">Add branch</h3>
          <select
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            value={branchForm.organizationId}
            onChange={(e) => setBranchForm({ ...branchForm, organizationId: e.target.value })}
          >
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <input
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder="Branch code"
            value={branchForm.code}
            onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
            required
          />
          <input
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder="Branch name"
            value={branchForm.name}
            onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
            required
          />
          <input
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder="City"
            value={branchForm.city}
            onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
          />
          <Button type="submit" size="sm" disabled={busy || !branchForm.organizationId}>
            Create branch
          </Button>
        </form>

        <form onSubmit={createDept} className="rounded-xl border border-white/10 p-4 space-y-2">
          <h3 className="font-semibold text-sm">Add department</h3>
          <input
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder="Code"
            value={deptForm.code}
            onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
            required
          />
          <input
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            placeholder="Name"
            value={deptForm.name}
            onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
            required
          />
          <Button type="submit" size="sm" disabled={busy}>
            Create department
          </Button>
        </form>
      </div>

      <div className="space-y-4">
        {orgs.map((o) => (
          <div key={o.id} className="rounded-xl border border-white/10 p-4">
            <p className="font-semibold">
              {o.name}{" "}
              {o.isPrimary && (
                <span className="text-xs text-violet-300 font-normal">· Primary tenant</span>
              )}
            </p>
            <p className="text-xs text-muted font-mono">{o.code}</p>
            <ul className="mt-2 text-sm space-y-1">
              {o.branches.map((b) => (
                <li key={b.id} className="text-muted">
                  {b.code} · {b.name}
                  {b.city ? ` · ${b.city}` : ""}
                  {b.isHeadOffice ? " · HO" : ""}
                </li>
              ))}
              {o.branches.length === 0 && (
                <li className="text-muted text-xs">No branches yet</li>
              )}
            </ul>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-2">Departments</h3>
        <ul className="grid sm:grid-cols-2 gap-2">
          {depts.map((d) => (
            <li key={d.id} className="rounded-lg border border-white/10 px-3 py-2 text-sm">
              {d.code} · {d.name}
              <span className="text-muted text-xs ml-2">
                {d._count?.employees ?? 0} employees
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
