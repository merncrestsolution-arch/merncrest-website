import { NextResponse } from "next/server";
import { getIvrGateway } from "@/lib/support/ivr/gateway";
import { processIvrCall } from "@/lib/support/ivr/process";
import {
  buildTwimlDial,
  buildTwimlGather,
  buildTwimlHangup,
  buildTwimlRecord,
  departmentMenuPrompt,
  languageMenuPrompt,
} from "@/lib/support/ivr/twiml";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

function siteBase() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

function formValue(form: FormData, key: string) {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
}

/**
 * VOIP provider webhook (Twilio Voice / Vonage Voice).
 * Query: step=lang|dept|usecase|voicemail|status
 * Body: Digits, From, CallSid, RecordingUrl, …
 */
export async function POST(request: Request) {
  const gateway = await getIvrGateway();
  const url = new URL(request.url);

  if (gateway.webhookSecret) {
    const secret = url.searchParams.get("secret") || request.headers.get("x-ivr-secret");
    if (secret !== gateway.webhookSecret) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  const step = url.searchParams.get("step") || "lang";
  const contentType = request.headers.get("content-type") || "";

  let digits = "";
  let from = "";
  let callSid = "";
  let recordingUrl = "";
  let callStatus = "";

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    digits = String(body.dtmf || body.Digits || body.digits || "");
    from = String(body.from || body.From || body.caller_id || "");
    callSid = String(body.uuid || body.CallSid || body.call_sid || "");
    recordingUrl = String(body.recording_url || body.RecordingUrl || "");
    callStatus = String(body.status || body.CallStatus || "");

    // Vonage NCCO path
    if (gateway.provider === "vonage" || body.uuid) {
      return handleVonageStep({ step, digits, from, callSid, gateway });
    }
  } else {
    const form = await request.formData().catch(() => new FormData());
    digits = formValue(form, "Digits") || formValue(form, "digits");
    from = formValue(form, "From") || formValue(form, "Caller");
    callSid = formValue(form, "CallSid");
    recordingUrl = formValue(form, "RecordingUrl");
    callStatus = formValue(form, "CallStatus");
  }

  const base = `${siteBase()}/api/ivr/webhook`;
  const secretQ = gateway.webhookSecret ? `&secret=${encodeURIComponent(gateway.webhookSecret)}` : "";

  // Status callback (completed / no-answer)
  if (step === "status" || callStatus === "no-answer" || callStatus === "busy" || callStatus === "failed") {
    if (from && callSid) {
      await processIvrCall({
        phone: from,
        providerCallSid: callSid,
        agentAvailable: false,
        departmentKey: (url.searchParams.get("dept") as "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9") || "8",
        languageKey: (url.searchParams.get("lang") as "1" | "2" | "3") || "3",
        recordingUrl: recordingUrl || undefined,
      });
    }
    return twiml(buildTwimlHangup("Thank you for calling MernCrest."));
  }

  if (step === "lang") {
    if (!digits) {
      return twiml(
        buildTwimlGather({
          action: `${base}?step=lang${secretQ}`,
          promptText: languageMenuPrompt(),
          numDigits: 1,
        })
      );
    }
    const lang = ["1", "2", "3"].includes(digits) ? digits : "3";
    return twiml(
      buildTwimlGather({
        action: `${base}?step=dept&lang=${lang}${secretQ}`,
        promptText: departmentMenuPrompt(),
        numDigits: 1,
      })
    );
  }

  if (step === "dept") {
    const lang = url.searchParams.get("lang") || "3";
    if (!digits) {
      return twiml(
        buildTwimlGather({
          action: `${base}?step=dept&lang=${lang}${secretQ}`,
          promptText: departmentMenuPrompt(),
          numDigits: 1,
        })
      );
    }
    const dept = digits as "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

    // Voicemail
    if (dept === "9") {
      return twiml(buildTwimlRecord({ action: `${base}?step=voicemail&lang=${lang}&dept=9${secretQ}` }));
    }

    // Existing customers / Care → secondary menu
    if (dept === "7" || dept === "8" || dept === "2") {
      const prompt =
        dept === "2"
          ? "Press 1 low, 2 medium, 3 high, 4 critical severity."
          : dept === "7"
            ? "Press 1 order status, 2 payment, 3 appointment, 4 ticket, 0 agent."
            : "Press 1 attendance, 2 ticket, 3 survey, 0 agent.";
      return twiml(
        buildTwimlGather({
          action: `${base}?step=usecase&lang=${lang}&dept=${dept}${secretQ}`,
          promptText: prompt,
          numDigits: 1,
        })
      );
    }

    // Direct route to agent or miss
    const agents = gateway.agentNumbers ?? [];
    const agent = agents[0];
    if (agent && gateway.active) {
      await processIvrCall({
        phone: from || "unknown",
        languageKey: lang as "1" | "2" | "3",
        departmentKey: dept,
        agentAvailable: true,
        providerCallSid: callSid || undefined,
      });
      return twiml(
        buildTwimlDial({
          agentNumber: agent,
          holdMusicUrl: gateway.holdMusicUrl,
          record: true,
          action: `${base}?step=status&lang=${lang}&dept=${dept}${secretQ}`,
        })
      );
    }

    await processIvrCall({
      phone: from || "unknown",
      languageKey: lang as "1" | "2" | "3",
      departmentKey: dept,
      agentAvailable: false,
      providerCallSid: callSid || undefined,
    });
    return twiml(buildTwimlRecord({ action: `${base}?step=voicemail&lang=${lang}&dept=${dept}${secretQ}` }));
  }

  if (step === "usecase") {
    const lang = (url.searchParams.get("lang") || "3") as "1" | "2" | "3";
    const dept = (url.searchParams.get("dept") || "8") as "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
    const useCaseKey = (digits || "0") as "0" | "1" | "2" | "3" | "4";

    const agents = gateway.agentNumbers ?? [];
    const agentAvailable = useCaseKey === "0" && Boolean(agents[0] && gateway.active);

    const result = await processIvrCall({
      phone: from || "unknown",
      languageKey: lang,
      departmentKey: dept,
      useCaseKey,
      agentAvailable,
      providerCallSid: callSid || undefined,
    });

    if (agentAvailable && agents[0]) {
      return twiml(
        buildTwimlDial({
          agentNumber: agents[0],
          holdMusicUrl: gateway.holdMusicUrl,
          record: true,
          action: `${base}?step=status&lang=${lang}&dept=${dept}${secretQ}`,
        })
      );
    }

    const msg = result.message || "Thank you. Goodbye.";
    return twiml(buildTwimlHangup(msg));
  }

  if (step === "voicemail") {
    const lang = (url.searchParams.get("lang") || "3") as "1" | "2" | "3";
    const dept = (url.searchParams.get("dept") || "9") as "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
    await processIvrCall({
      phone: from || "unknown",
      languageKey: lang,
      departmentKey: dept,
      agentAvailable: false,
      voicemail: "Voicemail recording received",
      recordingUrl: recordingUrl || undefined,
      providerCallSid: callSid || undefined,
      useCase: "VOICEMAIL",
    });
    return twiml(buildTwimlHangup("Thank you. Your message has been recorded. We will call you back."));
  }

  return twiml(
    buildTwimlGather({
      action: `${base}?step=lang${secretQ}`,
      promptText: languageMenuPrompt(),
      numDigits: 1,
    })
  );
}

/** Twilio health / validation GET */
export async function GET(request: Request) {
  const gateway = await getIvrGateway();
  const url = new URL(request.url);
  if (gateway.webhookSecret) {
    const secret = url.searchParams.get("secret");
    if (secret !== gateway.webhookSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  const recent = await prisma.callRecord.count({
    where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
  return NextResponse.json({
    ok: true,
    provider: gateway.provider,
    active: gateway.active,
    callsLast24h: recent,
    webhook: `${siteBase()}/api/ivr/webhook`,
  });
}

function twiml(xml: string) {
  return new NextResponse(xml, {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

async function handleVonageStep(opts: {
  step: string;
  digits: string;
  from: string;
  callSid: string;
  gateway: Awaited<ReturnType<typeof getIvrGateway>>;
}) {
  const { buildVonageNcco, languageMenuPrompt, departmentMenuPrompt } = await import(
    "@/lib/support/ivr/twiml"
  );
  const base = `${siteBase()}/api/ivr/webhook`;

  if (opts.step === "lang" && !opts.digits) {
    return NextResponse.json(
      buildVonageNcco({ actionUrl: `${base}?step=lang`, promptText: languageMenuPrompt() })
    );
  }
  if (opts.step === "lang" && opts.digits) {
    return NextResponse.json(
      buildVonageNcco({
        actionUrl: `${base}?step=dept&lang=${opts.digits}`,
        promptText: departmentMenuPrompt(),
      })
    );
  }

  await processIvrCall({
    phone: opts.from || "unknown",
    languageKey: "3",
    departmentKey: "8",
    agentAvailable: false,
    providerCallSid: opts.callSid || undefined,
  });

  return NextResponse.json([
    { action: "talk", text: "Thank you for calling MernCrest. An agent will call you back." },
  ]);
}
