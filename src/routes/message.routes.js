const express = require("express");

const router = express.Router();

const { sendBulkMessage } = require("../controllers/message.controller");

// Queue bulk WhatsApp messages by owner type
router.post("/bulk", sendBulkMessage);

module.exports = router;
