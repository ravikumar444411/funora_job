const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
{
  ownerType: {
    type: String,
    enum: ["User", "Organizer"],
    required: true
  },

  // if this contact is a registered platform user
  platformUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  platformOrganizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organizers",
    default: null
  },

  name: {
    type: String,
    required: true
  },

  phone: {
    type: String,
    required: true
  },

  email: {
    type: String
  },

},
{ timestamps: true }
);

module.exports = mongoose.model("Contact", contactSchema);