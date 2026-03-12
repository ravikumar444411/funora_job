const express = require("express");
const router = express.Router();

const contactRoutes = require("./contact.routes");
const messageRoutes = require("./message.routes");
const webhookRoutes = require('./webhook.routes')

router.use("/contacts", contactRoutes);
router.use("/messages", messageRoutes);
router.use("/webhook", webhookRoutes);

module.exports = router;
