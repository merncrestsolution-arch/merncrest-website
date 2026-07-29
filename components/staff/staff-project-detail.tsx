"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { Loader2 } from "lucide-react";
import { StaffProjectDashboard } from "@/components/staff/staff-project-dashboard";
import type { ProjectHubData } from "@/lib/staff/project-hub";

type ProjectDetail = {
  id: string;
  projectCode: string;
  name: string;
  status: string;
  progressPct?: number;
  startDate?: string | null;
  endDate?: string | null;
  clientBrief?: string | null;
  nextSteps?: string | null;
  nextProcess?: string | null;
  milestones: Array<{ id: string; title: string; status: string; dueDate?: string | null }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    progressPct: number;
    dueDate?: string | null;
    parentId?: string | null;
    assignee?: { fullName: string } | null;
  }>;
};

export function StaffProjectDetail({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [hub, setHub] = useState<ProjectHubData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    Promise.all([
      fetch(`/api/erp/projects?projectId=${encodeURIComponent(projectId)}`).then((r) => r.json()),
      fetch(`/api/staff/projects/${projectId}/hub`).then((r) => r.json()),
    ])
      .then(([erpRes, hubRes]) => {
        if (!erpRes.projects?.[0]) throw new Error(erpRes.error || "Project not found");
        setProject(erpRes.projects[0]);
        if (hubRes.success) setHub(hubRes.data);
        else setHub(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <p className="stitch-page-sub flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading project dashboard…
      </p>
    );
  }

  if (error || !project || !hub) {
    return (
      <div>
        <p className="stitch-auth-error mb-4">{error || "Project not found"}</p>
        <Link href="/staff/projects" className="stitch-btn-sm">
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <StaffProjectDashboard
      erpProjectId={projectId}
      project={project}
      hub={hub}
      onReload={load}
    />
  );
}
