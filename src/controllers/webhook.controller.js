const Contact = require("../models/contact.model");
const WhatsappReply = require("../models/whatsapp_reply.model");

exports.webhookReply = async (req, res) => {
      console.log("getting webhook reply ========");
  try {

    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value) {
      return res.sendStatus(200);
    }

    if (value.messages) {

      const message = value.messages[0];

      const phone = message.from;
      const messageType = message.type;
      let text = null;

      if (messageType === "text") {
        text = message.text.body;
      }

      const contact = await Contact.findOne({ phone });

      await WhatsappReply.create({
        phone,
        contactId: contact?._id,
        messageType,
        message: text,
        rawPayload: message
      });

      console.log("Saved WhatsApp reply from:", phone);
    }

    res.sendStatus(200);

  } catch (error) {
    console.error("Webhook error:", error);
    res.sendStatus(500);
  }
}


exports.webhookVerify = async (req, res) => {
    console.log("getting webhook verifed ========");

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
};