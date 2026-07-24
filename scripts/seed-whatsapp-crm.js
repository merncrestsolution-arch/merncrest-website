const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

const MERNcrest_WA_DISPLAY = "0713838638";
const MERNcrest_WA_E164 = "94713838638";

/**
 * Seed WhatsApp business line 0713838638 (+94713838638) + full automation.
 */
(async () => {
  const config = {
    provider: process.env.WHATSAPP_TOKEN ? "meta" : "stub",
    businessNumber: MERNcrest_WA_DISPLAY,
    businessNumberE164: MERNcrest_WA_E164,
    fromNumber: "+94713838638",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    wabaId: process.env.WHATSAPP_WABA_ID || "",
    displayName: "MernCrest Solutions",
    fullAutomation: true,
    autoReply: true,
    paymentDrips: true,
    nluChatbot: true,
  };

  await p.systemGatewayConfig.upsert({
    where: { provider: "WHATSAPP" },
    create: {
      provider: "WHATSAPP",
      active: true,
      configJson: JSON.stringify(config),
    },
    update: { active: true, configJson: JSON.stringify(config) },
  });

  const templates = [
    {
      name: "inquiry_auto_reply",
      body: `Hi {{name}}, thanks for contacting MernCrest on WhatsApp (${MERNcrest_WA_DISPLAY}). Reply MENU for options.`,
    },
    {
      name: "order_confirmed",
      body: "Order {{orderNumber}} confirmed. Track: {{trackingUrl}}",
    },
    {
      name: "payment_reminder",
      body: `Reminder: Invoice {{invoiceNumber}} amount {{amount}} is due. WhatsApp ${MERNcrest_WA_DISPLAY}`,
    },
    {
      name: "leave_status",
      body: "Your {{leaveType}} leave was {{status}}.",
    },
    {
      name: "ticket_update",
      body: "Support ticket {{ticketNumber}} is now {{status}}.",
    },
    {
      name: "task_assign",
      body: "New task: {{taskTitle}}",
    },
    {
      name: "attendance_punch",
      body: "Attendance {{action}} recorded.",
    },
    {
      name: "payment_due_d0",
      body: "Hi {{name}}, invoice {{invoiceNumber}} for {{amount}} is due.",
    },
    {
      name: "payment_due_d3",
      body: "Reminder: {{invoiceNumber}} ({{amount}}) still unpaid.",
    },
    {
      name: "payment_due_d7",
      body: "Final notice: {{invoiceNumber}} overdue — settle {{amount}} today.",
    },
    {
      name: "welcome_menu",
      body: `Welcome to MernCrest. Business WhatsApp: ${MERNcrest_WA_DISPLAY}`,
    },
  ];
  for (const t of templates) {
    await p.whatsAppTemplate.upsert({
      where: { name: t.name },
      create: {
        ...t,
        status: "LOCAL",
        active: true,
        locale: "EN",
        category: "UTILITY",
        providerKey: t.name,
      },
      update: { body: t.body, active: true },
    });
  }

  const automations = [
    {
      name: "Inquiry auto-response",
      trigger: "INQUIRY",
      bodyTemplate: `Hi {{name}}, thanks for contacting MernCrest WhatsApp (${MERNcrest_WA_DISPLAY}).`,
    },
    {
      name: "New order notify",
      trigger: "NEW_ORDER",
      bodyTemplate: "Order {{orderNumber}} confirmed. {{trackingUrl}}",
    },
    {
      name: "Payment due sequence",
      trigger: "PAYMENT_DUE",
      bodyTemplate: "Payment reminder: Invoice {{invoiceNumber}} · {{amount}} due.",
    },
    {
      name: "Leave status notify",
      trigger: "LEAVE_STATUS",
      bodyTemplate: "Leave update: {{leaveType}} → {{status}}",
    },
    {
      name: "Task assignment alert",
      trigger: "TASK_ASSIGN",
      bodyTemplate: "New task: {{taskTitle}}",
    },
    {
      name: "Ticket update",
      trigger: "TICKET_UPDATE",
      bodyTemplate: "Ticket {{ticketNumber}} is now {{status}}.",
    },
    {
      name: "Attendance punch",
      trigger: "ATTENDANCE",
      bodyTemplate: "Attendance {{action}} recorded.",
    },
  ];
  for (const a of automations) {
    const ex = await p.whatsAppAutomation.findFirst({ where: { trigger: a.trigger } });
    if (ex) {
      await p.whatsAppAutomation.update({
        where: { id: ex.id },
        data: { ...a, active: true },
      });
    } else {
      await p.whatsAppAutomation.create({ data: { ...a, active: true } });
    }
  }
  await p.whatsAppAutomation.updateMany({ data: { active: true } });

  const dripSteps = JSON.stringify([
    {
      dayOffset: 0,
      bodyTemplate:
        "Hi {{name}}, invoice {{invoiceNumber}} for {{amount}} is due. Pay at merncrest.lk/portal/invoices",
      templateName: "payment_due_d0",
    },
    {
      dayOffset: 3,
      bodyTemplate:
        "Reminder: {{invoiceNumber}} ({{amount}}) is still unpaid. Reply PAY for bank details.",
      templateName: "payment_due_d3",
    },
    {
      dayOffset: 7,
      bodyTemplate:
        "Final notice: {{invoiceNumber}} overdue. Please settle {{amount}} today.",
      templateName: "payment_due_d7",
    },
  ]);
  const drip = await p.paymentDripSequence.findFirst({
    where: { name: "Invoice overdue drip" },
  });
  if (drip) {
    await p.paymentDripSequence.update({
      where: { id: drip.id },
      data: { stepsJson: dripSteps, active: true },
    });
  } else {
    await p.paymentDripSequence.create({
      data: {
        name: "Invoice overdue drip",
        description: "Day 0 / +3 / +7 via 0713838638",
        stepsJson: dripSteps,
        active: true,
      },
    });
  }

  await p.whatsAppConversation.upsert({
    where: { phone: MERNcrest_WA_E164 },
    create: {
      phone: MERNcrest_WA_E164,
      customerName: "MernCrest Business Line",
      status: "OPEN",
      lastMessageAt: new Date(),
    },
    update: { customerName: "MernCrest Business Line" },
  });

  console.log(
    `OK — WhatsApp ${MERNcrest_WA_DISPLAY} (+${MERNcrest_WA_E164}) full automation enabled`
  );
  console.log(`Click-to-chat: https://wa.me/${MERNcrest_WA_E164}`);
  await p.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await p.$disconnect();
  process.exit(1);
});
