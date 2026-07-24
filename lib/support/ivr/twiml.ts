import { IVR_DEPARTMENTS, IVR_LANGUAGES, IVR_PROMPTS } from "@/lib/support/ivr/menu";
import type { IvrGatewayConfig } from "@/lib/support/ivr/gateway";

/**
 * Build Twilio Voice TwiML (XML). Play = pre-recorded prompts only (no <Say> AI).
 * When audio URLs are not configured, falls back to short <Say> placeholders for sandbox.
 */
export function buildTwimlGather(opts: {
  action: string;
  numDigits?: number;
  promptText: string;
  promptAudioUrl?: string;
  language?: string;
}) {
  const playOrSay = opts.promptAudioUrl
    ? `<Play>${escapeXml(opts.promptAudioUrl)}</Play>`
    : `<Say voice="woman" language="${opts.language || "en-US"}">${escapeXml(opts.promptText)}</Say>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather action="${escapeXml(opts.action)}" numDigits="${opts.numDigits ?? 1}" timeout="8" method="POST">
    ${playOrSay}
  </Gather>
  <Redirect>${escapeXml(opts.action)}</Redirect>
</Response>`;
}

export function buildTwimlDial(opts: {
  agentNumber: string;
  holdMusicUrl?: string;
  record?: boolean;
  action?: string;
}) {
  const record = opts.record ? ' record="record-from-answer-dual"' : "";
  const action = opts.action ? ` action="${escapeXml(opts.action)}"` : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${opts.holdMusicUrl ? `<Play loop="0">${escapeXml(opts.holdMusicUrl)}</Play>` : ""}
  <Dial${record}${action}>
    <Number>${escapeXml(opts.agentNumber)}</Number>
  </Dial>
</Response>`;
}

export function buildTwimlRecord(opts: { action: string; maxLength?: number }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="woman">Please leave a message after the tone.</Say>
  <Record action="${escapeXml(opts.action)}" maxLength="${opts.maxLength ?? 120}" playBeep="true" />
</Response>`;
}

export function buildTwimlHangup(message?: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${message ? `<Say voice="woman">${escapeXml(message)}</Say>` : ""}
  <Hangup/>
</Response>`;
}

/** Vonage NCCO (JSON call control) — Play only for production prompts */
export function buildVonageNcco(opts: {
  actionUrl: string;
  promptText: string;
  promptAudioUrl?: string;
}) {
  return [
    opts.promptAudioUrl
      ? { action: "stream", streamUrl: [opts.promptAudioUrl] }
      : { action: "talk", text: opts.promptText },
    {
      action: "input",
      type: ["dtmf"],
      dtmf: { maxDigits: 1, timeOut: 8 },
      eventUrl: [opts.actionUrl],
    },
  ];
}

export function languageMenuPrompt() {
  return `Welcome to MernCrest. Press 1 for Sinhala, 2 for Tamil, 3 for English.`;
}

export function departmentMenuPrompt() {
  return Object.entries(IVR_DEPARTMENTS)
    .map(([k, v]) => `Press ${k} for ${v.label}`)
    .join(". ");
}

export function promptCatalog(gateway: IvrGatewayConfig) {
  return {
    holdMusicUrl: gateway.holdMusicUrl,
    languages: IVR_LANGUAGES,
    departments: IVR_DEPARTMENTS,
    prompts: IVR_PROMPTS,
    note: "Map promptKey → pre-recorded MP3 in VOIP console. Prefer <Play> over <Say>.",
  };
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
