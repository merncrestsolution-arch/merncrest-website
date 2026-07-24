import { prisma } from "@/lib/db";

export type IvrVoipProvider = "stub" | "twilio" | "vonage" | "ozeki";

export type IvrGatewayConfig = {
  provider: IvrVoipProvider;
  fromNumber?: string;
  accountSid?: string;
  authToken?: string;
  apiKey?: string;
  apiSecret?: string;
  applicationId?: string;
  webhookSecret?: string;
  recordingBucket?: string;
  holdMusicUrl?: string;
  agentNumbers: string[];
  active: boolean;
};

export async function getIvrGateway(): Promise<IvrGatewayConfig> {
  const row = await prisma.systemGatewayConfig.findUnique({
    where: { provider: "IVR" },
  });

  let config: Record<string, string | string[]> = {};
  try {
    config = row?.configJson ? JSON.parse(row.configJson) : {};
  } catch {
    config = {};
  }

  const envProvider = (process.env.IVR_PROVIDER || "").toLowerCase() as IvrVoipProvider;
  const provider =
    (config.provider as IvrVoipProvider) ||
    (envProvider && ["stub", "twilio", "vonage", "ozeki"].includes(envProvider)
      ? envProvider
      : "stub");

  return {
    provider,
    fromNumber:
      (config.fromNumber as string) ||
      process.env.IVR_FROM_NUMBER ||
      process.env.TWILIO_FROM_NUMBER ||
      undefined,
    accountSid: (config.accountSid as string) || process.env.TWILIO_ACCOUNT_SID || undefined,
    authToken: (config.authToken as string) || process.env.TWILIO_AUTH_TOKEN || undefined,
    apiKey: (config.apiKey as string) || process.env.VONAGE_API_KEY || undefined,
    apiSecret: (config.apiSecret as string) || process.env.VONAGE_API_SECRET || undefined,
    applicationId:
      (config.applicationId as string) || process.env.VONAGE_APPLICATION_ID || undefined,
    webhookSecret:
      (config.webhookSecret as string) || process.env.IVR_WEBHOOK_SECRET || undefined,
    recordingBucket: (config.recordingBucket as string) || process.env.IVR_RECORDING_BUCKET || undefined,
    holdMusicUrl:
      (config.holdMusicUrl as string) ||
      process.env.IVR_HOLD_MUSIC_URL ||
      "https://merncrest.lk/audio/ivr-hold.mp3",
    agentNumbers: Array.isArray(config.agentNumbers)
      ? (config.agentNumbers as string[])
      : process.env.IVR_AGENT_NUMBERS
        ? process.env.IVR_AGENT_NUMBERS.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
    active: Boolean(row?.active),
  };
}

/** Normalize phone for CRM / employee matching */
export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}
