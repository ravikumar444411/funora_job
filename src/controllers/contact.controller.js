const Contact = require("../../src/models/contact.model");


// Create Contact
exports.createContact = async (req, res) => {
  try {

    const contact = await Contact.create(req.body);

    res.status(201).json({
      success: true,
      data: contact
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};



// Get All Contacts
exports.getContacts = async (req, res) => {
  try {

    const contacts = await Contact.find();

    res.json({
      success: true,
      count: contacts.length,
      data: contacts
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};



// Get Single Contact
exports.getContactById = async (req, res) => {
  try {

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    res.json({
      success: true,
      data: contact
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};



// Update Contact
exports.updateContact = async (req, res) => {
  try {

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    res.json({
      success: true,
      data: contact
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};



// Delete Contact
exports.deleteContact = async (req, res) => {
  try {

    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }

    res.json({
      success: true,
      message: "Contact deleted"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};



exports.getContactFilterData = async (req, res) => {
  try {
    const { ownerType } = req.query;

    const filter = {};

    if (ownerType) {
      if (!["User", "Organizer"].includes(ownerType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ownerType. Allowed values: User, Organizer"
        });
      }

      filter.ownerType = ownerType;
    }

    let query = Contact.find(filter);

    const contacts = await query;

    res.json({
      success: true,
      count: contacts.length,
      data: contacts
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};