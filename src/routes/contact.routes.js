const express = require("express");

const router = express.Router();

const {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
  getContactFilterData
  
} = require("../controllers/contact.controller");


// Create Contact
router.post("/", createContact);


// Get All Contacts
router.get("/", getContacts);


// Get Single Contact
router.get("/:id", getContactById);


// Update Contact
router.put("/:id", updateContact);


// Delete Contact
router.delete("/:id", deleteContact);

router.post("/filter-contact", getContactFilterData);



module.exports = router;