const Contact = require("../../src/models/contact.model");


// Push message to queue
exports.sendBulkMessage = async (req, res) => {
  try {
    const { message, ownerType } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Valid message is required"
      });
    }

    if (!ownerType || !["User", "Organizer"].includes(ownerType)) {
      return res.status(400).json({
        success: false,
        message: "Valid ownerType is required (User or Organizer)"
      });
    }

    const contacts = await Contact.find({ ownerType });

    if (!contacts.length) {
      return res.status(404).json({
        success: false,
        message: `No contacts found for ownerType: ${ownerType}`
      });
    }

    const jobs = [];

    for (const contact of contacts) {
      jobs.push({
        contactId: contact._id,
        phone: contact.phone,
        message
      });
    }

    // Lazy-load queue so Redis is only required when this API is used.
    const whatsAppQueue = require("../process/whatsAppQueue");

    // push bulk jobs to queue
    await whatsAppQueue.addBulk(
      jobs.map(job => ({
        name: "sendWhatsappMessage",
        data: job
      }))
    );

    res.json({
      success: true,
      message: "Messages queued successfully",
      totalJobs: jobs.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
