import { formatMoney } from "@/lib/commerce-format";

export type ClientEmailContext = {
  projectCode: string;
  projectName: string;
  status: string;
  progressPct?: number;
  clientName?: string | null;
  clientCompany?: string | null;
  clientEmail?: string | null;
  clientBrief?: string | null;
  nextSteps?: string | null;
  nextProcess?: string | null;
  nextPaymentAt?: string | Date | null;
  nextPaymentCents?: number;
  milestones?: { title: string; status: string; dueDate?: string | Date | null }[];
  latestUpdate?: { title: string; body: string; createdAt?: string | Date } | null;
  staffName?: string | null;
};

export type ClientEmailTemplate = {
  id: string;
  label: string;
  subject: string;
  body: string;
};

function greet(ctx: ClientEmailContext) {
  const name = ctx.clientName?.split(" ")[0] || "there";
  return `Dear ${name},`;
}

function sign(ctx: ClientEmailContext) {
  const who = ctx.staffName || "MernCrest Solutions";
  return `Best regards,\n${who}\nMernCrest Solutions\nhttps://merncrest.lk`;
}

function fmtDate(d?: string | Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function progressLine(ctx: ClientEmailContext) {
  const pct = ctx.progressPct ?? 0;
  return `Project ${ctx.projectCode} — ${ctx.projectName} is currently ${pct}% complete (status: ${ctx.status}).`;
}

function nextBlock(ctx: ClientEmailContext) {
  const lines: string[] = [];
  if (ctx.nextProcess) lines.push(`Process: ${ctx.nextProcess}`);
  if (ctx.nextSteps) lines.push(`Next steps:\n${ctx.nextSteps}`);
  if (ctx.nextPaymentAt || (ctx.nextPaymentCents || 0) > 0) {
    lines.push(
      `Next payment: ${formatMoney(ctx.nextPaymentCents || 0)} due ${fmtDate(ctx.nextPaymentAt)}`
    );
  }
  return lines.length ? `\n${lines.join("\n")}\n` : "\n";
}

/** Ready-to-copy client emails for project delivery */
export function buildProjectClientEmails(ctx: ClientEmailContext): ClientEmailTemplate[] {
  const code = ctx.projectCode;
  const name = ctx.projectName;

  return [
    {
      id: "kickoff",
      label: "Project kickoff",
      subject: `Project kickoff — ${code} ${name}`,
      body: `${greet(ctx)}

Thank you for confirming your project with MernCrest.

We have opened delivery project ${code}: ${name}.
${ctx.clientBrief ? `\nBrief:\n${ctx.clientBrief}\n` : ""}
${nextBlock(ctx)}
We will keep you updated at each milestone. Please reply to this email if you have any questions.

${sign(ctx)}`,
    },
    {
      id: "status",
      label: "Status update",
      subject: `Update — ${code} ${name}`,
      body: `${greet(ctx)}

${progressLine(ctx)}
${ctx.latestUpdate ? `\nLatest update: ${ctx.latestUpdate.title}\n${ctx.latestUpdate.body}\n` : ""}
${nextBlock(ctx)}
Please let us know if anything needs clarification.

${sign(ctx)}`,
    },
    {
      id: "waiting",
      label: "Waiting on client",
      subject: `Action needed — ${code} ${name}`,
      body: `${greet(ctx)}

To keep ${code} (${name}) moving, we need a few items from your side.
${nextBlock(ctx)}
Once we receive these, we will continue with the next process stage.

${sign(ctx)}`,
    },
    {
      id: "milestone",
      label: "Milestone complete",
      subject: `Milestone completed — ${code}`,
      body: `${greet(ctx)}

Good news — we have completed a milestone on ${code}: ${name}.

${(ctx.milestones || [])
  .filter((m) => m.status === "COMPLETED" || m.status === "DONE")
  .slice(0, 5)
  .map((m) => `• ${m.title}`)
  .join("\n") || "• Latest milestone marked complete"}
${nextBlock(ctx)}
Please review and confirm so we can proceed.

${sign(ctx)}`,
    },
    {
      id: "payment",
      label: "Payment / due date",
      subject: `Payment reminder — ${code}`,
      body: `${greet(ctx)}

This is a friendly reminder regarding project ${code}: ${name}.

Amount due: ${formatMoney(ctx.nextPaymentCents || 0)}
Due date: ${fmtDate(ctx.nextPaymentAt)}

You can pay from your Customer Portal → Billing, or reply to this email for bank details.

${sign(ctx)}`,
    },
    {
      id: "weekly",
      label: "Weekly summary",
      subject: `Weekly summary — ${code} ${name}`,
      body: `${greet(ctx)}

Here is this week's summary for ${code}: ${name}.

${progressLine(ctx)}
${ctx.clientBrief ? `\nScope reminder:\n${ctx.clientBrief}\n` : ""}
${nextBlock(ctx)}
Open tasks / focus for next week will follow the process above. Thank you for your partnership.

${sign(ctx)}`,
    },
    {
      id: "delivery",
      label: "Delivery / handover",
      subject: `Delivery ready — ${code} ${name}`,
      body: `${greet(ctx)}

We are pleased to confirm that ${code}: ${name} is ready for handover / go-live.

${progressLine(ctx)}
${nextBlock(ctx)}
Please confirm acceptance and share any final feedback. We are here for post-delivery support via Portal → Tickets.

${sign(ctx)}`,
    },
  ];
}
