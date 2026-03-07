require("./config/loadEnv");
const app = require("./app");

const PORT = process.env.PORT || 4000;

// Routes
app.get("/", (req, res) => {
  res.send("funora job server start 🌎🚀");
});


// // require("./jobs/test_job/cronJob");
// require("./consumer/eventConsumer"); // event consumer
// require("./consumer/reminderConsumer"); // event consumer
// // require("./consumer/updateEventConsumer"); // event consumer
if (String(process.env.RUN_WHATSAPP_WORKER_IN_API || "true").toLowerCase() === "true") {
  require("./queue/whatsappMessage.worker");
}


app.listen(PORT, () => {
  console.log(`🚀 Server running new on http://localhost:${PORT}`);
});
