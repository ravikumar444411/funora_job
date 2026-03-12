const express = require("express");

const router = express.Router();

const { sendBulkMessage,testApi } = require("../controllers/message.controller");

// Queue bulk WhatsApp messages by owner type
router.post("/bulk", sendBulkMessage);
router.post("/test", testApi);

module.exports = router;
