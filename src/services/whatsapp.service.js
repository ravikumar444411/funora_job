const redisConnection = require("../config/redis");
const WhatsappAccount = require("../models/whatsappAccount.model");
const {
  sendWhatsappTextMessage,
  sendWhatsappTemplateMessage
} = require("../client/whatsapp.client");

const ROTATION_KEY = "whatsapp:rotation:index";
const DEFAULT_TEMPLATE_NAME = process.env.WHATSAPP_DEFAULT_TEMPLATE_NAME || "welcome_to_funora_new";
const DEFAULT_TEMPLATE_LANGUAGE = process.env.WHATSAPP_DEFAULT_TEMPLATE_LANGUAGE || "en";
const DEFAULT_FUNORA_LINK = process.env.FUNORA_DEFAULT_LINK || "https://funora.co.in/";

const randomDelay = (min = 2000, max = 7000) => {
  const safeMin = Number.isFinite(min) ? min : 2000;
  const safeMax = Number.isFinite(max) ? max : 7000;
  if (safeMax <= safeMin) return safeMin;
  return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
};

const selectMessageVariant = (message, variants = [], recipientName = "") => {
  const candidates = [message, ...variants].filter(Boolean);
  if (!candidates.length) {
    return message;
  }

  const selected = candidates[Math.floor(Math.random() * candidates.length)];
  if (!recipientName) {
    return selected;
  }

  return selected.replace(/\{\{\s*name\s*\}\}/gi, recipientName);
};

const getFallbackAccountFromEnv = () => {
  if (!process.env.PHONE_NUMBER_ID || !process.env.WHATSAPP_TOKEN) {
    return null;
  }

  return {
    _id: null,
    phoneNumber: process.env.WHATSAPP_BUSINESS_NUMBER || "default",
    phoneNumberId: process.env.PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_TOKEN,
    defaultTemplateName: process.env.WHATSAPP_DEFAULT_TEMPLATE_NAME || DEFAULT_TEMPLATE_NAME,
    defaultTemplateLanguageCode: process.env.WHATSAPP_DEFAULT_TEMPLATE_LANGUAGE || DEFAULT_TEMPLATE_LANGUAGE,
    defaultTemplateLink: process.env.FUNORA_DEFAULT_LINK || DEFAULT_FUNORA_LINK,
    dailyLimit: Number(process.env.WHATSAPP_DEFAULT_DAILY_LIMIT || 1000),
    sentToday: 0
  };
};

const buildTemplateBodyParameters = ({
  recipientName = "",
  templateBodyParameters = [],
  templateLink,
  account
}) => {
  if (Array.isArray(templateBodyParameters) && templateBodyParameters.length > 0) {
    return templateBodyParameters;
  }

  return [
    recipientName || "there",
    templateLink || account?.defaultTemplateLink || DEFAULT_FUNORA_LINK
  ];
};

const getRotationAccounts = async () => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  await WhatsappAccount.updateMany(
    { lastResetAt: { $lt: startOfToday }, status: { $ne: "blocked" } },
    { $set: { sentToday: 0, lastResetAt: now, status: "active" } }
  );

  const accounts = await WhatsappAccount.find({
    status: "active",
    $expr: { $lt: ["$sentToday", "$dailyLimit"] }
  }).sort({ createdAt: 1 });

  if (accounts.length) {
    return accounts;
  }

  const fallbackAccount = getFallbackAccountFromEnv();
  return fallbackAccount ? [fallbackAccount] : [];
};

const getNextWhatsappAccount = async () => {
  const accounts = await getRotationAccounts();
  if (!accounts.length) {
    throw new Error("No active WhatsApp accounts available for sending");
  }

  const nextIndex = await redisConnection.incr(ROTATION_KEY);
  return accounts[(nextIndex - 1) % accounts.length];
};

const markSendResult = async (account, success) => {
  if (!account || !account._id) {
    return;
  }

  if (success) {
    const updated = await WhatsappAccount.findByIdAndUpdate(
      account._id,
      { $inc: { sentToday: 1 }, $set: { lastUsedAt: new Date() } },
      { new: true }
    );

    if (updated && updated.sentToday >= updated.dailyLimit && updated.status !== "paused") {
      await WhatsappAccount.findByIdAndUpdate(account._id, { status: "paused" });
    }
    return;
  }

  await WhatsappAccount.findByIdAndUpdate(account._id, {
    $inc: { failedToday: 1 },
    $set: { lastUsedAt: new Date() }
  });
};

const sendWhatsappMessage = async ({
  phone,
  message,
  variants = [],
  recipientName = "",
  templateName,
  templateLanguageCode,
  templateBodyParameters = [],
  templateLink
}) => {
  if (!phone) {
    throw new Error("phone is required");
  }

  const account = await getNextWhatsappAccount();
  const selectedTemplateName =
    templateName || account?.defaultTemplateName || DEFAULT_TEMPLATE_NAME;
  const selectedTemplateLanguageCode =
    templateLanguageCode ||
    account?.defaultTemplateLanguageCode ||
    DEFAULT_TEMPLATE_LANGUAGE;

  try {
    let response;
    let messageType = "template";

    if (selectedTemplateName) {
      const bodyParameters = buildTemplateBodyParameters({
        recipientName,
        templateBodyParameters,
        templateLink,
        account
      });

      response = await sendWhatsappTemplateMessage({
        phoneNumberId: account.phoneNumberId,
        accessToken: account.accessToken,
        to: phone,
        templateName: selectedTemplateName,
        languageCode: selectedTemplateLanguageCode,
        bodyParameters
      });
    } else {
      if (!message) {
        throw new Error("message is required when templateName is not provided");
      }

      const finalMessage = selectMessageVariant(message, variants, recipientName);
      response = await sendWhatsappTextMessage({
        phoneNumberId: account.phoneNumberId,
        accessToken: account.accessToken,
        to: phone,
        message: finalMessage
      });
      messageType = "text";
    }

    await markSendResult(account, true);

    return {
      accountId: account._id,
      phoneNumberId: account.phoneNumberId,
      messageType,
      templateName: selectedTemplateName || null,
      data: response
    };
  } catch (error) {
    await markSendResult(account, false);
    throw error;
  }
};

module.exports = {
  getNextWhatsappAccount,
  randomDelay,
  selectMessageVariant,
  sendWhatsappMessage
};
