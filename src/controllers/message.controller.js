const Contact = require("../models/contact.model");
const { whatsappMessageQueue } = require("../queue/whatsappMessage.queue");
const {queueDailyWhatsappTemplateJobs} = require("../jobs/whatsappDailyCron.job")

exports.sendBulkMessage = async (req, res) => {
  try {
    const {
      ownerType,
      message,
      templateName = process.env.WHATSAPP_DEFAULT_TEMPLATE_NAME || "welcome_to_funora_new",
      templateLanguageCode = process.env.WHATSAPP_DEFAULT_TEMPLATE_LANGUAGE || "en",
      templateLink = process.env.FUNORA_DEFAULT_LINK || "https://funora.co.in/"
    } = req.body;

    if (!ownerType || !["User", "Organizer"].includes(ownerType)) {
      return res.status(400).json({
        success: false,
        message: "Valid ownerType is required (User or Organizer)"
      });
    }

    const contacts = await Contact.find({ ownerType }).select("name phone ownerType");

    if (!contacts.length) {
      return res.status(404).json({
        success: false,
        message: `No contacts found for ownerType: ${ownerType}`
      });
    }

    const jobs = contacts.map((contact) => ({
      name: "sendWhatsappMessage",
      data: {
        phone: contact.phone,
        message,
        recipientName: contact.name,
        templateName,
        templateLanguageCode,
        templateBodyParameters: [contact.name, templateLink],
        templateLink
      },
      opts: { priority: 3 }
    }));

    await whatsappMessageQueue.addBulk(jobs);

    return res.json({
      success: true,
      message: "Messages queued successfully",
      totalJobs: jobs.length,
      mode: templateName ? "template" : "text",
      templateName: templateName || null
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


exports.testApi =  async (req, res) => {
  try {
  const result = await queueDailyWhatsappTemplateJobs();
  console.log("reslt");
  res.send(result)
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
