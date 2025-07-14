const express = require("express");
const router = express.Router();
const Contact = require("../models/contactModel");
const BulkMessage = require("../models/BulkMessage");
const { getClientForUser, isBotReady } = require("../services/whatsappService"); // ✅ IMPORT isBotReady
const protect = require("../middleware/authMiddleware");
const { welcomeMessage } = require("../utils/messageTemplates");

router.post("/bulk-message", protect, async (req, res) => {
  const { contactIds, message, messageType } = req.body;
  const userId = req.user._id?.toString(); // ✅ Ensure userId is a string

  try {
    const client = getClientForUser(userId); // ✅ PASS userId
    const isReady = isBotReady(userId);      // ✅ Check readiness

    if (!client || !isReady) {
      return res.status(500).json({
        message: "WhatsApp client is not ready yet. Please scan the QR code.",
      });
    }

    const contacts = await Contact.find({
      _id: { $in: contactIds },
      user: userId,
    });

    if (!contacts.length) {
      return res.status(404).json({ message: "No valid contacts found." });
    }

    for (const contact of contacts) {
      let number = contact.whatsapp.toString().trim();
      if (!number.startsWith("91")) number = "91" + number;
      const chatId = `${number}@c.us`;

      try {
        const templatedMessage = welcomeMessage(contact.name || "User");
        await client.sendMessage(chatId, templatedMessage);
        console.log(`✅ Message sent to: ${number}`);
      } catch (err) {
        console.error(`❌ Failed to send message to ${number}:`, err.message);
      }
    }

    const bulkEntry = await BulkMessage.create({
      user: userId,
      contactIds,
      message,
      messageType,
    });

    res.status(200).json({ message: "Messages attempted", bulkId: bulkEntry._id });
  } catch (err) {
    console.error("Bulk send error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
