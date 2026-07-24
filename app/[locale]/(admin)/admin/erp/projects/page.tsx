import { ErpProjectsPanel } from "@/components/erp/erp-projects-panel";

export default function Page() {
  return (
    <div>
      <h1 className="rlk-welcome">Projects &amp; tasks</h1>
      <p className="text-sm text-[#666] mb-2 max-w-3xl">
        <strong className="text-[#333]">Hierarchy</strong> — milestones → tasks → subtasks.{" "}
        <strong className="text-[#333]">Kanban</strong> — status columns (To do → Done).{" "}
        <strong className="text-[#333]">Gantt</strong> — timeline by start/due dates.{" "}
        <strong className="text-[#333]">Finance</strong> — expenses, profit, payment due.{" "}
        <strong className="text-[#333]">Client</strong> — link customer, next steps, copy-paste emails.
      </p>
      <ErpProjectsPanel />
    </div>
  );
}
