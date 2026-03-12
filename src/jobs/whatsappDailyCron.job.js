const cron = require("node-cron");
const Contact = require("../models/contact.model");
const { whatsappMessageQueue } = require("../queue/whatsappMessage.queue");

const CRON_ENABLED = String(process.env.WHATSAPP_DAILY_CRON_ENABLED || "true").toLowerCase() === "true";
const CRON_EXPRESSION = process.env.WHATSAPP_DAILY_CRON_EXPRESSION || "0 12 * * *";
const CRON_TIMEZONE = process.env.WHATSAPP_DAILY_CRON_TIMEZONE || "Asia/Kolkata";
const TEMPLATE_NAME = process.env.WHATSAPP_DAILY_TEMPLATE_NAME || "welcome_to_funora_new";
const TEMPLATE_LANGUAGE_CODE = process.env.WHATSAPP_DAILY_TEMPLATE_LANGUAGE || "en";
const TEMPLATE_LINK = process.env.WHATSAPP_DAILY_TEMPLATE_LINK || "https://funora.co.in/";
const PRIORITY = Number(process.env.WHATSAPP_DAILY_PRIORITY || 3);
const OWNER_TYPES = (process.env.WHATSAPP_DAILY_OWNER_TYPES || "User,Organizer")
  .split(",")
  .map((type) => type.trim())
  .filter(Boolean);

const queueDailyWhatsappTemplateJobs = async () => {
  const filter = OWNER_TYPES.length ? { ownerType: { $in: OWNER_TYPES } } : {};
  const contacts = await Contact.find(filter).select("name phone ownerType");

  if (!contacts.length) {
    console.log("[whatsapp-cron] No contacts found for daily run.");
    return;
  }

  const jobs = contacts.map((contact) => ({
    name: "sendWhatsappMessage",
    data: {
      phone: contact.phone,
      recipientName: contact.name,
      templateName: TEMPLATE_NAME,
      templateLanguageCode: TEMPLATE_LANGUAGE_CODE,
      templateBodyParameters: [contact.name, TEMPLATE_LINK],
      templateLink: TEMPLATE_LINK
    },
    opts: {
      priority: PRIORITY
    }
  }));

  await whatsappMessageQueue.addBulk(jobs);

  console.log(
    `[whatsapp-cron] Queued ${jobs.length} WhatsApp template jobs (template: ${TEMPLATE_NAME}).`
  );
};

const startWhatsappDailyCron = () => {
  if (!CRON_ENABLED) {
    console.log("[whatsapp-cron] Daily cron is disabled by env.");
    return null;
  }

  const task = cron.schedule(
    CRON_EXPRESSION,
    async () => {
      try {
        await queueDailyWhatsappTemplateJobs();
      } catch (error) {
        console.error("[whatsapp-cron] Failed to queue daily jobs:", error.message);
      }
    },
    {
      timezone: CRON_TIMEZONE
    }
  );

  console.log(
    `[whatsapp-cron] Scheduled daily WhatsApp campaign at '${CRON_EXPRESSION}' (${CRON_TIMEZONE}).`
  );

  return task;
};

module.exports = {
  startWhatsappDailyCron,
  queueDailyWhatsappTemplateJobs
};
