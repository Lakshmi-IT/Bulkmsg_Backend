// const express = require("express");
// const router = express.Router();
// const Contact = require("../models/contactModel");
// const BulkMessage = require("../models/BulkMessage");
// const { getClientForUser, isBotReady } = require("../services/whatsappService"); // ✅ IMPORT isBotReady
// const protect = require("../middleware/authMiddleware");
// const { welcomeMessage } = require("../utils/messageTemplates");

// router.post("/bulk-message", protect, async (req, res) => {
//   const { contactIds, message, messageType } = req.body;
//   const userId = req.user._id?.toString(); // ✅ Ensure userId is a string

//   try {
//     const client = getClientForUser(userId); // ✅ PASS userId
//     const isReady = isBotReady(userId); // ✅ Check readiness

//     if (!client || !isReady) {
//       return res.status(500).json({
//         message: "WhatsApp client is not ready yet. Please scan the QR code.",
//       });
//     }

//     const contacts = await Contact.find({
//       _id: { $in: contactIds },
//       user: userId,
//     });

//     if (!contacts.length) {
//       return res.status(404).json({ message: "No valid contacts found." });
//     }

//     for (const contact of contacts) {
//       let number = contact.whatsapp.toString().trim();
//       if (!number.startsWith("91")) number = "91" + number;
//       const chatId = `${number}@c.us`;

//       const templatedMessage = welcomeMessage(contact.name || "User");

//       let attempts = 0;
//       while (attempts < 2) {
//         try {
//           if (!client || !client.info || !client.info.wid) {
//             console.error(`❌ Client not ready. Stopping.`);
//             return;
//           }

//           await client.sendMessage(chatId, templatedMessage);
//           console.log(`✅ Message sent to: ${number}`);
//           const bulkEntry = await BulkMessage.create({
//             user: userId,
//             contactIds,
//             message,
//             messageType,
//           });
//           res
//             .status(200)
//             .json({ message: "Messages attempted", bulkId: bulkEntry._id });
//         } catch (err) {
//           console.error(
//             `❌ Failed attempt ${attempts + 1} for ${number}:`,
//             err.message
//           );
//           attempts++;
//           if (attempts >= 2) {
//             console.error(`⛔ Giving up on ${number}`);
//           }
//         }
//       }

//       // 2 second delay between messages
//       await new Promise((resolve) => setTimeout(resolve, 3000));
//     }
//     // const bulkEntry = await BulkMessage.create({
//     //   user: userId,
//     //   contactIds,
//     //   message,
//     //   messageType,
//     // });

//     // res
//     //   .status(200)
//     //   .json({ message: "Messages attempted", bulkId: bulkEntry._id });
//   } catch (err) {
//     console.error("Bulk send error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const Contact = require("../models/contactModel");
const BulkMessage = require("../models/BulkMessage");
const { getClientForUser, isBotReady } = require("../services/whatsappService");
const protect = require("../middleware/authMiddleware");
const { welcomeMessage } = require("../utils/messageTemplates");
const Template = require("../models/templateModel");
const { htmlToText } = require("html-to-text");
const userModel = require("../models/userModel");

router.post("/bulk-message", protect, async (req, res) => {
  const { contactIds, message, messageType, selectedId } = req.body;
  const userId = req.user._id?.toString();

  try {
    const client = getClientForUser(userId);
    const isReady = isBotReady(userId);

    if (!client || !isReady) {
      return res.status(500).json({
        message: "WhatsApp client is not ready yet. Please scan the QR code.",
      });
    }

    // ✅ Fetch selected template content if selectedId is provided
    let finalMessage = message;
    if (selectedId) {
      const template = await Template.findOne({
        _id: selectedId,
        user: userId,
      });

      if (!template) {
        return res
          .status(404)
          .json({ message: "Selected template not found." });
      }

      // ✅ Convert HTML rich text to plain text
      finalMessage = htmlToText(template.content, {
        wordwrap: false,
        preserveNewlines: true,
      });
    }

    const contacts = await Contact.find({
      _id: { $in: contactIds },
      user: userId,
    });

    if (!contacts.length) {
      return res.status(404).json({ message: "No valid contacts found." });
    }

    const results = [];

    for (const contact of contacts) {
      let number = contact.whatsapp.toString().trim();
      if (!number.startsWith("91")) number = "91" + number;
      const chatId = `${number}@c.us`;

      // Replace placeholders in message (optional)
      const personalizedMessage = finalMessage.replace(
        "{{name}}",
        contact.name || "User"
      );

      let status = "pending";
      let attempts = 0;

      while (attempts < 2) {
        try {
          await client.sendMessage(chatId, personalizedMessage);
          console.log(`✅ Message sent to: ${number}`);
          status = "sent";

          // Decrease one credit from user
          await userModel.findByIdAndUpdate(userId, { $inc: { credits: -1 } });

          break;

        
        } catch (err) {
          attempts++;
          console.error(
            `❌ Failed attempt ${attempts} for ${number}:`,
            err.message
          );
          if (attempts >= 2) {
            console.error(`⛔ Giving up on ${number}`);
            status = "failed";
          }
        }
      }

      const bulkEntry = await BulkMessage.create({
        contactIds: [contact._id],
        message: finalMessage,
        messageType,
        status,
      });

      results.push({
        contact: contact.name,
        number,
        status,
        entryId: bulkEntry._id,
      });

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    res.status(200).json({
      message: "Bulk messaging completed.",
      results,
    });
  } catch (err) {
    console.error("Bulk send error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/getallSentMessages", protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const sentMessages = await BulkMessage.find({
      status: "sent",
    })
      .populate("contactIds", "name whatsapp") // Only include name and whatsapp fields from Contact
      .sort({ createdAt: -1 }); // latest first

    res.status(200).json({
      message: "Sent messages fetched successfully.",
      count: sentMessages.length,
      data: sentMessages,
    });
  } catch (err) {
    console.error("Error fetching sent messages:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
