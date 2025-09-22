const { createBullBoard } = require("@bull-board/api");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { ExpressAdapter } = require("@bull-board/express");
const eventQueue = require("../queue/eventQueue"); // Adjust path if needed
const reminderQueue = require("../queue/reminderQueue"); // Adjust path if needed

// Import your queue
// Or if you export eventQueue separately from queue/eventQueue.js:
// const { eventQueue } = require("../queue/eventQueue");

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
    queues: [new BullMQAdapter(eventQueue), new BullMQAdapter(reminderQueue)], // Add more queues here if needed
    serverAdapter,
});

module.exports = serverAdapter;
