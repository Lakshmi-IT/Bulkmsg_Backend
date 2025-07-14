const Contact = require("../models/contactModel");

// Get all contacts for the logged-in user
exports.getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({ user: req.user._id });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch contacts",
      error: error.message,
    });
  }
};

exports.addContact = async (req, res) => {
  try {
    const { name, whatsapp, group } = req.body;

    console.log(req.body, "CSV body");

    if (!whatsapp || whatsapp.trim() === "") {
      return res.status(400).json({ message: "WhatsApp number is required." });
    }

    const cleanedPhone = whatsapp.trim();

    if (!/^\d{10}$/.test(cleanedPhone)) {
      return res.status(400).json({
        message: "Phone number must be exactly 10 digits.",
      });
    }

    // Check for duplicate
    const existing = await Contact.findOne({
      user: req.user._id,
      whatsapp: cleanedPhone,
    });

    if (existing) {
      return res.status(409).json({ message: "Contact already exists." });
    }

    // Create new contact
    const contact = await Contact.create({
      name: name?.trim() || "User", 
      whatsapp: cleanedPhone,
      group: group?.trim() || "",
      user: req.user._id,
    });

    res.status(201).json({
      message: "Contact created successfully.",
      contact,
    });
  } catch (err) {
    console.error("Error adding contact:", err);
    res.status(500).json({
      message: "Server error. Please try again later.",
    });
  }
};

exports.bulkUploadContacts = async (req, res) => {
  try {
    const userId = req.user.id;
    const contacts = req.body.contacts;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ message: "No contacts provided." });
    }

    // Step 1: Validate contacts
    const validContacts = contacts
      .filter((contact) => contact.name && /^\d{10}$/.test(contact.whatsapp))
      .map((contact) => ({
        name: contact.name.trim() || "User",
        whatsapp: contact.whatsapp.trim(),
        group: contact.group || "customer",
        user: userId,
      }));

    if (validContacts.length === 0) {
      return res.status(400).json({ message: "No valid contacts to upload." });
    }

    // Step 2: Get existing WhatsApp numbers for this user
    const whatsappNumbers = validContacts.map((c) => c.whatsapp);
    const existingContacts = await Contact.find({
      user: userId,
      whatsapp: { $in: whatsappNumbers },
    });

    const existingNumbers = new Set(existingContacts.map((c) => c.whatsapp));

    // Step 3: Filter out duplicates
    const newContacts = validContacts.filter(
      (c) => !existingNumbers.has(c.whatsapp)
    );

    if (newContacts.length === 0) {
      return res.status(200).json({
        message: "All contacts already exist. No new contacts added.",
        skipped: validContacts.length,
      });
    }

    // Step 4: Insert new contacts
    const savedContacts = await Contact.insertMany(newContacts);

    res.status(201).json({
      message: `${savedContacts.length} new contacts uploaded successfully.`,
      contacts: savedContacts,
      skipped: validContacts.length - savedContacts.length,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({ message: "Server error while uploading contacts." });
  }
};

exports.updateContact = async (req, res) => {
  try {
    const contactId = req.params.id;
    const userId = req.user.id;

    const contact = await Contact.findOne({ _id: contactId, user: userId });

    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    const { name, whatsapp, phone, group } = req.body;

    contact.name = name || contact.name;
    contact.whatsapp = whatsapp || contact.whatsapp;
    contact.phone = phone || contact.phone;
    contact.group = group || contact.group;

    const updatedContact = await contact.save();

    res.status(200).json({ updatedContact });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Server error while updating contact" });
  }
};

exports.deleteContact = async (req, res) => {
  try {
    const contactId = req.params.id;
    const userId = req.user.id;

    const deletedContact = await Contact.findOneAndDelete({
      _id: contactId,
      user: userId,
    });

    if (!deletedContact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    res.status(200).json({ message: "Contact deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Server error while deleting contact" });
  }
};
