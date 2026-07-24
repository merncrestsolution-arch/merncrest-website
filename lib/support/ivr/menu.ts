/**
 * IVR menus — recorded voice prompts only (no AI voice / TTS generation).
 * Prompt keys map to pre-recorded audio assets hosted by the VOIP provider.
 */

export const IVR_LANGUAGES = {
  "1": { code: "si", label: "Sinhala", promptKey: "lang.si" },
  "2": { code: "ta", label: "Tamil", promptKey: "lang.ta" },
  "3": { code: "en", label: "English", promptKey: "lang.en" },
} as const;

export type IvrLanguageKey = keyof typeof IVR_LANGUAGES;

export const IVR_DEPARTMENTS = {
  "1": { code: "SALES", label: "Sales", promptKey: "dept.sales" },
  "2": { code: "TECHNICAL", label: "Technical Support", promptKey: "dept.technical" },
  "3": { code: "HOSTING", label: "Hosting", promptKey: "dept.hosting" },
  "4": { code: "DOMAIN", label: "Domains", promptKey: "dept.domains" },
  "5": { code: "BILLING", label: "Billing", promptKey: "dept.billing" },
  "6": { code: "ENTERPRISE", label: "Enterprise Software", promptKey: "dept.enterprise" },
  "7": { code: "EXISTING", label: "Existing Customers", promptKey: "dept.existing" },
  "8": { code: "CARE", label: "Customer Care", promptKey: "dept.care" },
  "9": { code: "VOICEMAIL", label: "Leave Voice Message", promptKey: "dept.voicemail" },
} as const;

export type IvrDepartmentKey = keyof typeof IVR_DEPARTMENTS;

/** Secondary DTMF menus by department / flow */
export const IVR_USE_CASE_MENUS = {
  EXISTING: {
    "1": { useCase: "ORDER_STATUS" as const, label: "Order status", promptKey: "usecase.order" },
    "2": { useCase: "PAYMENT" as const, label: "Payment inquiry", promptKey: "usecase.payment" },
    "3": { useCase: "APPOINTMENT" as const, label: "Schedule appointment", promptKey: "usecase.appointment" },
    "4": { useCase: "TICKET" as const, label: "Open support ticket", promptKey: "usecase.ticket" },
    "0": { useCase: "ROUTE" as const, label: "Speak to agent", promptKey: "usecase.agent" },
  },
  TECHNICAL: {
    "1": { useCase: "SEVERITY" as const, severity: "LOW" as const, label: "Low — general help", promptKey: "sev.low" },
    "2": { useCase: "SEVERITY" as const, severity: "MEDIUM" as const, label: "Medium — service issue", promptKey: "sev.medium" },
    "3": { useCase: "SEVERITY" as const, severity: "HIGH" as const, label: "High — outage", promptKey: "sev.high" },
    "4": { useCase: "SEVERITY" as const, severity: "CRITICAL" as const, label: "Critical — production down", promptKey: "sev.critical" },
  },
  CARE: {
    "1": { useCase: "ATTENDANCE" as const, label: "Staff attendance punch", promptKey: "usecase.attendance" },
    "2": { useCase: "TICKET" as const, label: "Helpdesk ticket", promptKey: "usecase.ticket" },
    "3": { useCase: "SURVEY" as const, label: "Satisfaction survey", promptKey: "usecase.survey" },
    "0": { useCase: "ROUTE" as const, label: "Speak to agent", promptKey: "usecase.agent" },
  },
} as const;

export type IvrUseCase =
  | "ROUTE"
  | "ATTENDANCE"
  | "TICKET"
  | "ORDER_STATUS"
  | "PAYMENT"
  | "SEVERITY"
  | "APPOINTMENT"
  | "SURVEY"
  | "VOICEMAIL";

/** Announcement / hold prompt keys (pre-recorded) */
export const IVR_PROMPTS = {
  welcome: "prompt.welcome",
  language: "prompt.language",
  department: "prompt.department",
  hold: "prompt.hold_music",
  transfer: "prompt.transfer",
  voicemail: "prompt.voicemail_beep",
  goodbye: "prompt.goodbye",
  invalid: "prompt.invalid_digit",
  survey: "prompt.survey_1_to_5",
  noAgent: "prompt.no_agent",
  attendanceOk: "prompt.attendance_ok",
  attendanceFail: "prompt.attendance_fail",
} as const;

export function languageFromKey(key?: string | null) {
  const row = IVR_LANGUAGES[(key as IvrLanguageKey) || "3"];
  return row?.code || "en";
}

export function departmentFromKey(key?: string | null) {
  const row = IVR_DEPARTMENTS[(key as IvrDepartmentKey) || "8"];
  return row?.code || "CARE";
}

export function menuSnapshot() {
  return {
    language: Object.fromEntries(
      Object.entries(IVR_LANGUAGES).map(([k, v]) => [k, v.label])
    ),
    department: Object.fromEntries(
      Object.entries(IVR_DEPARTMENTS).map(([k, v]) => [k, v.label])
    ),
    useCases: IVR_USE_CASE_MENUS,
    prompts: IVR_PROMPTS,
    note: "Recorded voice only — no AI-generated speech.",
  };
}
