/** Free consulting availability — shared by contact page and Aira. */
export const SLOTS_PER_HOUR = 3;

export const FREE_CONSULTING_LABEL =
  "Free consulting: Monday–Friday 9:00 AM – 5:00 PM · Saturday 9:00 AM – 3:00 PM";

export const FREE_CONSULTING_DETAIL =
  "Book a free consultation with our specialists. Each hour has 3 available slots (20 minutes each).";

export type ConsultingSlot = {
  id: string;
  label: string;
  dayLabel: string;
  iso: string;
};

const WEEKDAY_START = 9;
const WEEKDAY_END = 17;
const SATURDAY_START = 9;
const SATURDAY_END = 15;

function slotMinutes(slotIndex: number): number {
  return Math.floor((60 / SLOTS_PER_HOUR) * slotIndex);
}

function formatTime(hour: number, minute: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? "AM" : "PM";
  const mm = minute.toString().padStart(2, "0");
  return `${h12}:${mm} ${ampm}`;
}

function isConsultingDay(date: Date): boolean {
  const d = date.getDay();
  return d >= 1 && d <= 6;
}

function dayHours(date: Date): { start: number; end: number } | null {
  const d = date.getDay();
  if (d >= 1 && d <= 5) return { start: WEEKDAY_START, end: WEEKDAY_END };
  if (d === 6) return { start: SATURDAY_START, end: SATURDAY_END };
  return null;
}

/** Upcoming bookable consulting slots (next N days, excluding Sundays). */
export function listConsultingSlots(opts?: { daysAhead?: number; maxSlots?: number }): ConsultingSlot[] {
  const daysAhead = opts?.daysAhead ?? 14;
  const maxSlots = opts?.maxSlots ?? 48;
  const slots: ConsultingSlot[] = [];
  const now = new Date();
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);

  for (let day = 0; day < daysAhead && slots.length < maxSlots; day++) {
    const date = new Date(cursor);
    date.setDate(cursor.getDate() + day);
    if (!isConsultingDay(date)) continue;

    const hours = dayHours(date);
    if (!hours) continue;

    const dayLabel = date.toLocaleDateString("en-LK", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    for (let hour = hours.start; hour < hours.end; hour++) {
      for (let s = 0; s < SLOTS_PER_HOUR; s++) {
        const minute = slotMinutes(s);
        const slotDate = new Date(date);
        slotDate.setHours(hour, minute, 0, 0);
        if (slotDate <= now) continue;

        const label = formatTime(hour, minute);
        slots.push({
          id: slotDate.toISOString(),
          label,
          dayLabel,
          iso: slotDate.toISOString(),
        });
        if (slots.length >= maxSlots) break;
      }
      if (slots.length >= maxSlots) break;
    }
  }

  return slots;
}

export const CHAT_SERVICE_OPTIONS = [
  "Website & Web Development",
  "Mobile App Development",
  "ERP / CRM Solutions",
  "AI & Automation",
  "Cloud & DevOps",
  "Hosting & Domains",
  "Cyber Security",
  "Digital Marketing",
  "IT Consulting",
  "Support & AMC",
  "Free Consulting",
  "Other",
] as const;
