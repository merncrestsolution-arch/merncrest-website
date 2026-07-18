import { StaffDashboard } from "@/components/staff/staff-dashboard";

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-bold">Tasks</h1>
      <StaffDashboard />
    </div>
  );
}
