const redisConnection = require("../config/redis");
const WhatsappAccount = require("../models/whatsappAccount.model");
const { sendWhatsappTextMessage } = require("../client/whatsapp.client");

const ROTATION_KEY = "whatsapp:rotation:index";

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
    dailyLimit: Number(process.env.WHATSAPP_DEFAULT_DAILY_LIMIT || 1000),
    sentToday: 0
  };
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

const sendWhatsappMessage = async ({ phone, message, variants = [], recipientName = "" }) => {

  if (!phone || !message) {
    throw new Error("phone and message are required");
  }

  const account = await getNextWhatsappAccount();
  const finalMessage = selectMessageVariant(message, variants, recipientName);

  try {
    const response = await sendWhatsappTextMessage({
      phoneNumberId: account.phoneNumberId,
      accessToken: account.accessToken,
      to: phone,
      message: finalMessage
    });
    await markSendResult(account, true);
    return {
      accountId: account._id,
      phoneNumberId: account.phoneNumberId,
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
