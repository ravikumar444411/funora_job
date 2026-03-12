const express = require("express");
const router = express.Router();

const contactRoutes = require("./contact.routes");
const messageRoutes = require("./message.routes");

router.use("/contacts", contactRoutes);
router.use("/messages", messageRoutes);

module.exports = router;
