const { Queue, Worker } = require("bullmq");
const connection = require("../config/redis");
const { sendWhatsappMessage, randomDelay } = require("../services/whatsapp.service");
const Notification = require("../models/notification.model");

const queueName = "whatsapp-message-queue";
const queue = new Queue(queueName, { connection });

const minDelayMs = Number(process.env.WHATSAPP_MIN_DELAY_MS || 2000);
const maxDelayMs = Number(process.env.WHATSAPP_MAX_DELAY_MS || 7000);
const sendWindowStartHour = Number(process.env.WHATSAPP_SEND_WINDOW_START || 9);
const sendWindowEndHour = Number(process.env.WHATSAPP_SEND_WINDOW_END || 21);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isWithinSendWindow = (date = new Date()) => {
  const hour = date.getHours();
  return hour >= sendWindowStartHour && hour < sendWindowEndHour;
};

const msUntilNextWindow = (date = new Date()) => {
  const next = new Date(date);
  next.setMinutes(0, 0, 0);

  if (date.getHours() >= sendWindowEndHour) {
    next.setDate(next.getDate() + 1);
  }

  next.setHours(sendWindowStartHour, 0, 0, 0);
  return Math.max(1000, next.getTime() - date.getTime());
};

const whatsappMessageWorker = new Worker(
  queueName,
  async (job) => {
    const {
      messageLogId,
      phone,
      message,
      messageVariants = [],
      recipientName = ""
    } = job.data;

    if (!isWithinSendWindow()) {
      const delay = msUntilNextWindow();

      await queue.add(job.name || "sendWhatsappMessage", job.data, {
        delay,
        priority: job.opts.priority || 3,
        attempts: job.opts.attempts || 5,
        backoff: job.opts.backoff || { type: "exponential", delay: 3000 },
        removeOnComplete: true,
        removeOnFail: false
      });

      console.log(`Outside send window. Re-queued job ${job.id} with ${delay}ms delay`);
      return;
    }

    await sleep(randomDelay(minDelayMs, maxDelayMs));

    try {
      const response = await sendWhatsappMessage({
        phone,
        message,
        variants: messageVariants,
        recipientName
      });

      if (messageLogId) {
        await Notification.findByIdAndUpdate(messageLogId, {
          status: "sent",
          metadata: {
            provider: "whatsapp-cloud-api",
            senderPhoneNumberId: response.phoneNumberId,
            priority: job.opts.priority || 3
          }
        });
      }

      console.log("WhatsApp message sent to:", phone);
    } catch (error) {
      if (messageLogId) {
        await Notification.findByIdAndUpdate(messageLogId, {
          status: "failed",
          metadata: {
            provider: "whatsapp-cloud-api",
            error: error.message,
            priority: job.opts.priority || 3
          }
        });
      }

      throw error;
    }
  },
  {
    connection,
    concurrency: Number(process.env.WHATSAPP_WORKER_CONCURRENCY || 5),
    limiter: {
      max: Number(process.env.WHATSAPP_RATE_LIMIT_MAX || 20),
      duration: 1000
    }
  }
);

whatsappMessageWorker.on("completed", (job) => {
  console.log("Job completed:", job.id);
});

whatsappMessageWorker.on("failed", (job, err) => {
  console.log("Job failed:", job?.id, err.message);
});

module.exports = whatsappMessageWorker;
