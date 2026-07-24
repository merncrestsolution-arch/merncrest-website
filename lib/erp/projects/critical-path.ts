/**
 * Critical path (CPM) — longest path by estimateMinutes through FINISH_TO_START deps.
 */

export type CpmTask = {
  id: string;
  title: string;
  estimateMinutes: number;
  status: string;
  startDate?: Date | null;
  dueDate?: Date | null;
};

export type CpmDependency = {
  taskId: string;
  dependsOnId: string;
  type?: string;
};

export type CpmNode = {
  id: string;
  title: string;
  estimateMinutes: number;
  earliestStart: number;
  earliestFinish: number;
  latestStart: number;
  latestFinish: number;
  slack: number;
  onCriticalPath: boolean;
};

export function computeCriticalPath(tasks: CpmTask[], deps: CpmDependency[]): {
  nodes: CpmNode[];
  criticalPathIds: string[];
  projectDurationMinutes: number;
} {
  const ids = new Set(tasks.map((t) => t.id));
  const fsDeps = deps.filter(
    (d) => (!d.type || d.type === "FINISH_TO_START") && ids.has(d.taskId) && ids.has(d.dependsOnId)
  );

  const preds = new Map<string, string[]>();
  const succs = new Map<string, string[]>();
  for (const t of tasks) {
    preds.set(t.id, []);
    succs.set(t.id, []);
  }
  for (const d of fsDeps) {
    preds.get(d.taskId)!.push(d.dependsOnId);
    succs.get(d.dependsOnId)!.push(d.taskId);
  }

  const est = new Map(tasks.map((t) => [t.id, Math.max(0, t.estimateMinutes || 60)]));
  const ES = new Map<string, number>();
  const EF = new Map<string, number>();

  // Topological forward pass
  const indeg = new Map<string, number>();
  for (const t of tasks) indeg.set(t.id, preds.get(t.id)!.length);
  const queue = tasks.filter((t) => indeg.get(t.id) === 0).map((t) => t.id);
  const order: string[] = [];

  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    const predEFs = preds.get(id)!.map((p) => EF.get(p) ?? 0);
    const es = predEFs.length ? Math.max(...predEFs) : 0;
    ES.set(id, es);
    EF.set(id, es + (est.get(id) || 0));
    for (const s of succs.get(id)!) {
      indeg.set(s, (indeg.get(s) || 1) - 1);
      if (indeg.get(s) === 0) queue.push(s);
    }
  }

  // Cycles / orphans — assign remaining
  for (const t of tasks) {
    if (!ES.has(t.id)) {
      ES.set(t.id, 0);
      EF.set(t.id, est.get(t.id) || 0);
      order.push(t.id);
    }
  }

  const projectDuration = Math.max(0, ...Array.from(EF.values()));
  const LS = new Map<string, number>();
  const LF = new Map<string, number>();

  for (const id of [...order].reverse()) {
    const succLSs = succs.get(id)!.map((s) => LS.get(s) ?? projectDuration);
    const lf = succLSs.length ? Math.min(...succLSs) : projectDuration;
    LF.set(id, lf);
    LS.set(id, lf - (est.get(id) || 0));
  }

  const nodes: CpmNode[] = tasks.map((t) => {
    const es = ES.get(t.id) || 0;
    const ef = EF.get(t.id) || 0;
    const ls = LS.get(t.id) || 0;
    const lf = LF.get(t.id) || 0;
    const slack = Math.max(0, ls - es);
    return {
      id: t.id,
      title: t.title,
      estimateMinutes: est.get(t.id) || 0,
      earliestStart: es,
      earliestFinish: ef,
      latestStart: ls,
      latestFinish: lf,
      slack,
      onCriticalPath: slack === 0 && (est.get(t.id) || 0) > 0,
    };
  });

  const criticalPathIds = nodes.filter((n) => n.onCriticalPath).map((n) => n.id);

  return { nodes, criticalPathIds, projectDurationMinutes: projectDuration };
}
