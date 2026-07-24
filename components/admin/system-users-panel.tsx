"use client";

import { useCallback, useEffect, useState } from "react";

type UserRow = {
  id: string;
  email: string;
  fullName: string;
  company: string | null;
  role: string;
  createdAt: string;
  _count: { sessions: number; orders: number; tickets: number };
};

export function SystemUsersPanel() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    const d = await res.json();
    if (!res.ok) setError(d.error || "Failed");
    else setUsers(d.users ?? []);
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

  async function setRole(id: string, role: string) {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role }),
    });
    if (!res.ok) setError((await res.json()).error || "Failed");
    else await load();
  }

  return (
    <>
      <h1 className="stitch-page-title">Users &amp; roles</h1>
      <p className="stitch-page-sub !mb-5">RBAC · Admin / Manager / Support / Sales / Developer / Finance</p>
      {error ? <p className="stitch-auth-error !mb-4">{error}</p> : null}

      <section className="stitch-section-card">
        <div className="stitch-section-head">
          <h3>Platform users</h3>
          <input
            className="rlk-input !w-48 !py-1.5 text-sm"
            placeholder="Search…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="stitch-section-body overflow-x-auto">
          <table className="stitch-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Sessions</th>
                <th>Orders</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      className="rlk-input !w-auto !py-1 text-xs"
                      value={u.role}
                      onChange={(e) => setRole(u.id, e.target.value)}
                    >
                      {["CUSTOMER", "STAFF", "ADMIN", "OWNER"].map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{u._count.sessions}</td>
                  <td>{u._count.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
