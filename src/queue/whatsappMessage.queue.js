const { Queue } = require("bullmq");
const connection = require("../config/redis");

const whatsappMessageQueue = new Queue("whatsapp-message-queue", {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 3000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

const addWhatsappMessageJob = async ({
  phone,
  message,
  messageLogId,
  priority = 3,
  recipientName,
  messageVariants = []
}) => {
  return whatsappMessageQueue.add(
    "sendWhatsappMessage",
    { phone, message, messageLogId, recipientName, messageVariants },
    { priority }
  );
};

module.exports = {
  whatsappMessageQueue,
  addWhatsappMessageJob
};
