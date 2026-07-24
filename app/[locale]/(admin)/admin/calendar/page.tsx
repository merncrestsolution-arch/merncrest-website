import { StaffCalendarPanel } from "@/components/staff/staff-calendar-panel";

export default function Page() {
  return (
    <>
      <h1 className="stitch-page-title">Organization calendar</h1>
      <p className="stitch-page-sub !mb-5">
        Meetings · renewals · leave · deadlines · client calls
      </p>
      <StaffCalendarPanel />
    </>
  );
}
