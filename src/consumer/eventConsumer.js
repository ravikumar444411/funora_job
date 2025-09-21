const { Worker } = require("bullmq");
const redisConnection = require("../config/redis");
const { bulkPushNotification } = require("../controllers/notification.controller");

const worker = new Worker(
    "event_queue", // it should be queue name
    async (job) => {
        try {
            await bulkPushNotification(job.name, job.data, null)
            console.log(`✅ Notifications sent for eventId: ${job.data.eventId}`);
            return Promise.resolve();
        } catch (error) {
            console.error(`❌ Failed to send notifications for eventId: ${eventId}`, error);
            throw error; // retried based on attempts
        }
    },
    { connection: redisConnection }
);

worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
    console.error(`Job ${job.id} failed: ${err.message}`);
});
