const express = require("express");

const router = express.Router();

const { webhookReply,webhookVerify } = require("../controllers/webhook.controller");

// Queue bulk WhatsApp messages by owner type
router.post("/reply", webhookReply);
router.get("/verify", webhookVerify);

module.exports = router;
