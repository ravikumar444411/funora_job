// queue/eventQueue.js
const { Queue } = require("bullmq");
const redisConnection = require("../config/redis");

// Create a BullMQ queue for events
const reminderQueue = new Queue("new_event_reminder_added", {
    connection: redisConnection, limiter: { max: 100, duration: 1000 }
}); // 100 jobs/sec });

module.exports = reminderQueue;
