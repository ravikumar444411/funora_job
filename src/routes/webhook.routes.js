const express = require("express");

const router = express.Router();

const { webhookReply,webhookVerify } = require("../controllers/webhook.controller");

// Queue bulk WhatsApp messages by owner type
router.post("/save-reply", webhookReply);
router.get("/save-reply", webhookVerify);

module.exports = router;
