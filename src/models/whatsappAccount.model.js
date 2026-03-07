const mongoose = require("mongoose");

const whatsappAccountSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      trim: true
    },
    phoneNumberId: {
      type: String,
      required: true,
      trim: true
    },
    accessToken: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["active", "paused", "blocked"],
      default: "active"
    },
    dailyLimit: {
      type: Number,
      default: 1000,
      min: 1
    },
    sentToday: {
      type: Number,
      default: 0,
      min: 0
    },
    failedToday: {
      type: Number,
      default: 0,
      min: 0
    },
    lastResetAt: {
      type: Date,
      default: Date.now
    },
    lastUsedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("WhatsappAccount", whatsappAccountSchema);
