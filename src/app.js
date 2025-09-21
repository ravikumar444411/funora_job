const express = require("express");
const connectDB = require("./config/db");
const eventQueueRoutes = require("./routes/event.route");
const reminderQueueRoutes = require("./routes/reminder.route");
require("dotenv").config();

const app = express();
app.use(express.json()); // Middleware to parse JSON

// Connect to MongoDB
connectDB();


app.use("/api/event", eventQueueRoutes);
app.use("/api/reminder", reminderQueueRoutes);

module.exports = app;