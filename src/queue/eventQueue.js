// queue/eventQueue.js
const { Queue } = require("bullmq");
const redisConnection = require("../config/redis");

// Create a BullMQ queue for events
const eventQueue = new Queue("event_queue", {
    connection: redisConnection, limiter: { max: 100, duration: 1000 }
}); // 100 jobs/sec });

module.exports = eventQueue;
