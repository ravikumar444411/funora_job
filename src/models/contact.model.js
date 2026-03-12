const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
{
  ownerType: {
    type: String,
    enum: ["User", "Organizer"],
    required: true
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

  optedIn: {
    type: Boolean,
    default: true
  },

},
{ timestamps: true }
);

module.exports = mongoose.model("Contact", contactSchema);
