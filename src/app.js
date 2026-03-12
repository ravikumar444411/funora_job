const express = require('express');
const connectDB = require('./config/db');
const eventQueueRoutes = require('./routes/event.route');
const reminderQueueRoutes = require('./routes/reminder.route');
const instaRoutes = require('./automation_insta/routes/insta_routes');
const bullBoardRouter = require('./config/bullBoard');
const whatsappRoutes = require("./routes/whatsapp.routes");

require('dotenv').config();

const app = express();

app.use(express.json());

connectDB();

app.use('/admin/queues', bullBoardRouter.getRouter());
app.use('/api/event', eventQueueRoutes);
app.use('/api/reminder', reminderQueueRoutes);
app.use('/api/insta', instaRoutes);
app.use("/api/whatsapp", whatsappRoutes);

module.exports = app;
