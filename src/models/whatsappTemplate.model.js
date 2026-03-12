const mongoose = require("mongoose");

const whatsappTemplateSchema = new mongoose.Schema(
  {
    name: { 
      type: String,
      required: true,
      trim: true //template name
    },
    languageCode: {
      type: String,
      default: "en",
      trim: true
    },
    link: {
      type: String,
      default: "https://funora.co.in/",
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("WhatsappTemplate", whatsappTemplateSchema);
