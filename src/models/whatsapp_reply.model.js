const mongoose = require("mongoose");

const whatsappReplySchema = new mongoose.Schema({

  phone: String,

  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contact"
  },

  messageType: String,

  message: String,

  rawPayload: Object

}, { timestamps: true });

module.exports = mongoose.model("WhatsappReply", whatsappReplySchema);