const cron = require("node-cron");
const Contact = require("../models/contact.model");
const WhatsappTemplate = require("../models/whatsappTemplate.model");
const { whatsappMessageQueue } = require("../queue/whatsappMessage.queue");

const CRON_ENABLED = String(process.env.WHATSAPP_DAILY_CRON_ENABLED || "true").toLowerCase() === "true";
const CRON_EXPRESSION = process.env.WHATSAPP_DAILY_CRON_EXPRESSION || "0 12 * * *";
const CRON_TIMEZONE = process.env.WHATSAPP_DAILY_CRON_TIMEZONE || "Asia/Kolkata";
const TEMPLATE_NAME = process.env.WHATSAPP_DAILY_TEMPLATE_NAME || "welcome_to_funora_new";
const TEMPLATE_LANGUAGE_CODE = process.env.WHATSAPP_DAILY_TEMPLATE_LANGUAGE || "en";
const TEMPLATE_LINK = process.env.WHATSAPP_DAILY_TEMPLATE_LINK || "https://funora.co.in/";
const PRIORITY = Number(process.env.WHATSAPP_DAILY_PRIORITY || 3);
const SEND_WINDOW_START_HOUR = Number(process.env.WHATSAPP_SEND_WINDOW_START || 9);
const SEND_WINDOW_END_HOUR = Number(process.env.WHATSAPP_SEND_WINDOW_END || 21);
const SPREAD_MINUTES = Number(process.env.WHATSAPP_DAILY_SPREAD_MINUTES || 0);
const OWNER_TYPES = (process.env.WHATSAPP_DAILY_OWNER_TYPES || "User,Organizer")
  .split(",")
  .map((type) => type.trim())
  .filter(Boolean);

const getDailyTemplates = async () => {
  try {
    const templates = await WhatsappTemplate.find({ isActive: true })
      .select("name languageCode link")
      .lean();

    const cleaned = templates
      .map((template) => ({
        name: String(template?.name || "").trim(),
        languageCode: String(template?.languageCode || "").trim(),
        link: String(template?.link || "").trim()
      }))
      .filter((template) => template.name);

    if (cleaned.length) {
      return cleaned;
    }
  } catch (error) {
    console.warn("[whatsapp-cron] Failed to load templates from DB. Falling back to default.");
  }

  return [
    {
      name: TEMPLATE_NAME,
      languageCode: TEMPLATE_LANGUAGE_CODE,
      link: TEMPLATE_LINK
    }
  ];
};

const hashString = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const getDailyWindow = (now = new Date()) => {
  const windowStart = new Date(now);
  windowStart.setHours(SEND_WINDOW_START_HOUR, 0, 0, 0);
  const windowEnd = new Date(now);
  windowEnd.setHours(SEND_WINDOW_END_HOUR, 0, 0, 0);

  if (windowEnd <= windowStart) {
    windowEnd.setDate(windowEnd.getDate() + 1);
  }

  if (now > windowEnd) {
    windowStart.setDate(windowStart.getDate() + 1);
    windowEnd.setDate(windowEnd.getDate() + 1);
  }

  return { windowStart, windowEnd };
};

const getDelayForContact = (contactKey, now = new Date()) => {
  const { windowStart, windowEnd } = getDailyWindow(now);
  const base = now < windowStart ? windowStart : now;

  if (base >= windowEnd) {
    return Math.max(1000, windowStart.getTime() - now.getTime());
  }

  const defaultSpreadMs = Math.max(1000, windowEnd.getTime() - windowStart.getTime());
  const spreadMs = SPREAD_MINUTES > 0 ? SPREAD_MINUTES * 60 * 1000 : defaultSpreadMs;
  const spreadEnd = new Date(base.getTime() + spreadMs);
  const effectiveEnd = spreadEnd < windowEnd ? spreadEnd : windowEnd;
  const effectiveSpreadMs = Math.max(1000, effectiveEnd.getTime() - base.getTime());

  const offsetMs = hashString(contactKey) % effectiveSpreadMs;
  return Math.max(0, base.getTime() + offsetMs - now.getTime());
};

const queueDailyWhatsappTemplateJobs = async () => {
  const filter = OWNER_TYPES.length
    ? { ownerType: { $in: OWNER_TYPES }, optedIn: true }
    : { optedIn: true };
  const contacts = await Contact.find(filter).select("name phone ownerType");

  if (!contacts.length) {
    console.log("[whatsapp-cron] No contacts found for daily run.");
    return;
  }

  const templates = await getDailyTemplates();
  if (!templates.length) {
    console.log("[whatsapp-cron] No valid templates found for daily run.");
    return;
  }

  const now = new Date();
  const jobs = contacts.map((contact) => {
    const contactKey = String(contact._id || contact.phone);
    const templateIndex = hashString(contactKey) % templates.length;
    const template = templates[templateIndex];
    const templateLink = template.link || TEMPLATE_LINK;

    return {
      name: "sendWhatsappMessage",
      data: {
        phone: contact.phone,
        recipientName: contact.name,
        templateName: template.name,
        templateLanguageCode: template.languageCode || TEMPLATE_LANGUAGE_CODE,
        templateBodyParameters: [contact.name, templateLink],
        templateLink
      },
      opts: {
        priority: PRIORITY,
        delay: getDelayForContact(contactKey, now)
      }
    };
  });

  await whatsappMessageQueue.addBulk(jobs);

  console.log(
    `[whatsapp-cron] Queued ${jobs.length} WhatsApp template jobs (templates: ${templates.length}).`
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
