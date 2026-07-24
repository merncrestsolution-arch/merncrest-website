import { runWhatsAppAutomation } from "@/lib/crm/whatsapp-notify";
import { prisma } from "@/lib/db";

/**
 * Missed-call / voicemail alert via WhatsApp (SMS when SMS gateway is wired).
 */
export async function sendMissedCallAlert(opts: {
  callId: string;
  phone: string;
  callNumber: string;
  department: string;
  status: string;
  ticketNumber?: string | null;
}) {
  const body = [
    `MernCrest missed your call (${opts.callNumber}).`,
    `Department: ${opts.department}.`,
    opts.ticketNumber ? `Ticket: ${opts.ticketNumber}.` : "A callback has been queued.",
    "Reply or wait for our team — System.merncrest.lk",
  ].join(" ");

  const result = await runWhatsAppAutomation({
    trigger: "CUSTOM",
    phone: opts.phone,
    vars: {
      callNumber: opts.callNumber,
      department: opts.department,
      ticket: opts.ticketNumber || "",
    },
    bodyFallback: body,
  });

  await prisma.callRecord.update({
    where: { id: opts.callId },
    data: {
      alertSentAt: new Date(),
      metaJson: JSON.stringify({ missedAlert: result }),
    },
  });

  await prisma.callEvent.create({
    data: {
      callId: opts.callId,
      type: "ALERT",
      detail: result.ok
        ? "WhatsApp missed-call alert sent"
        : `Alert skipped: ${"reason" in result ? String(result.reason) : "failed"}`,
    },
  });

  return result;
}
