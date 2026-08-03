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

export type ConsultingDay = {
  dateKey: string;
  label: string;
  weekday: string;
  day: number;
  month: string;
  isSaturday: boolean;
};

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setHours(0, 0, 0, 0);
  return date;
}

/** Bookable dates for the consulting calendar (Mon–Sat, next N days). */
export function listConsultingDays(daysAhead = 28): ConsultingDay[] {
  const days: ConsultingDay[] = [];
  const now = new Date();
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(cursor);
    date.setDate(cursor.getDate() + i);
    if (!isConsultingDay(date)) continue;

    days.push({
      dateKey: toDateKey(date),
      label: date.toLocaleDateString("en-LK", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      weekday: date.toLocaleDateString("en-LK", { weekday: "short" }),
      day: date.getDate(),
      month: date.toLocaleDateString("en-LK", { month: "short" }),
      isSaturday: date.getDay() === 6,
    });
  }

  return days;
}

/** Time slots for a selected calendar date (3 per hour). */
export function listSlotsForDay(dateKey: string): ConsultingSlot[] {
  const date = parseDateKey(dateKey);
  if (!isConsultingDay(date)) return [];

  const hours = dayHours(date);
  if (!hours) return [];

  const now = new Date();
  const dayLabel = date.toLocaleDateString("en-LK", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const slots: ConsultingSlot[] = [];

  for (let hour = hours.start; hour < hours.end; hour++) {
    for (let s = 0; s < SLOTS_PER_HOUR; s++) {
      const minute = slotMinutes(s);
      const slotDate = new Date(date);
      slotDate.setHours(hour, minute, 0, 0);
      if (slotDate <= now) continue;

      slots.push({
        id: slotDate.toISOString(),
        label: formatTime(hour, minute),
        dayLabel,
        iso: slotDate.toISOString(),
      });
    }
  }

  return slots;
}

/** Calendar grid cells for a month view (includes padding + bookable flags). */
export function buildCalendarMonth(year: number, month: number, daysAhead = 28) {
  const bookable = new Set(listConsultingDays(daysAhead).map((d) => d.dateKey));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: {
    dateKey: string | null;
    day: number | null;
    bookable: boolean;
    isToday: boolean;
    isPast: boolean;
  }[] = [];

  for (let i = 0; i < startPad; i++) {
    cells.push({ dateKey: null, day: null, bookable: false, isToday: false, isPast: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    date.setHours(0, 0, 0, 0);
    const dateKey = toDateKey(date);
    const isPast = date < today;
    const isToday = dateKey === toDateKey(today);
    cells.push({
      dateKey,
      day: d,
      bookable: bookable.has(dateKey) && !isPast,
      isToday,
      isPast,
    });
  }

  return cells;
}

/** Upcoming bookable consulting slots (next N days, excluding Sundays). */
export function listConsultingSlots(opts?: { daysAhead?: number; maxSlots?: number }): ConsultingSlot[] {
  const daysAhead = opts?.daysAhead ?? 14;
  const maxSlots = opts?.maxSlots ?? 48;
  const slots: ConsultingSlot[] = [];

  for (const day of listConsultingDays(daysAhead)) {
    for (const slot of listSlotsForDay(day.dateKey)) {
      slots.push(slot);
      if (slots.length >= maxSlots) return slots;
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
