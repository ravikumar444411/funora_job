require("./config/loadEnv");
const app = require("./app");
const { startWhatsappDailyCron } = require("./jobs/whatsappDailyCron.job");

const PORT = process.env.PORT || 4000;

// Routes
app.get("/", (req, res) => {
  res.send("funora job server start 🌎🚀");
});

if (String(process.env.RUN_WHATSAPP_WORKER_IN_API || "true").toLowerCase() === "true") {
  require("./queue/whatsappMessage.worker");
}

startWhatsappDailyCron();

app.listen(PORT, () => {
  console.log(`🚀 Server running new on http://localhost:${PORT}`);
});
