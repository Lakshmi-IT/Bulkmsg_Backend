// // bot.js
// const { Client, LocalAuth } = require("whatsapp-web.js");
// const fs = require("fs");
// const path = require("path");
// const qrcode = require("qrcode");

// let client = null;
// let qrDataUrl = null;
// let isReconnecting = false;
// let isDestroying = false;
// let isReady = false;

// // Reset and recreate client
// const resetClient = async () => {
//   if (isDestroying) return;
//   isDestroying = true;

//   try {
//     if (client) {
//       client.removeAllListeners();

//       // Allow pending tasks to settle
//       await new Promise((r) => setImmediate(r));

//       await client.destroy().catch((err) => {
//         console.warn("⚠️ Error destroying client:", err.message);
//       });

//       client = null;
//       console.log("🛑 Client destroyed.");
//     }

//     const sessionPath = path.join(__dirname, "..", ".wwebjs_auth");
//     if (fs.existsSync(sessionPath)) {
//       fs.rmSync(sessionPath, { recursive: true, force: true });
//       console.log("🧹 Auth session removed.");
//     }

//     qrDataUrl = null;

//     // Delay before reinitializing
//     setTimeout(() => {
//       console.log("🔁 Reinitializing client...");
//       isDestroying = false;
//       initializeClient();
//     }, 4000);
//   } catch (err) {
//     isDestroying = false;
//     console.error("❌ Error during reset:", err);
//   }
// };

// // Initialize WhatsApp client
// const initializeClient = () => {
//   if (client || isReconnecting) {
//     console.log("⚠️ Client already initializing or running.");
//     return;
//   }

//   isReconnecting = true;

//   client = new Client({
//     authStrategy: new LocalAuth(),
//     puppeteer: {
//       headless: true,
//       args: ["--no-sandbox", "--disable-setuid-sandbox"],
//     },
//   });

//   client.on("qr", (qr) => {
//     qrcode.toDataURL(qr, (err, url) => {
//       if (err) {
//         console.error("❌ QR generation error:", err);
//       } else {
//         qrDataUrl = url;
//         console.log("📲 QR Code ready");
//       }
//     });
//   });

//   client.on("authenticated", () => {
//     console.log("✅ Authenticated successfully");
//   });

//   client.on("ready", () => {
//     console.log("✅ WhatsApp bot is ready");
//     isReconnecting = false;
//      isReady = true;
//   });

//   client.on("disconnected", async (reason) => {
//     console.log("❌ Disconnected. Reason:", reason);
//     isReconnecting = false;
//       isReady = false;  

//     // swallow any Puppeteer race errors here
//     try {
//       await new Promise((r) => setTimeout(r, 1000));
//       await resetClient();
//     } catch (err) {
//       console.warn("⚠️ Error in disconnect handler:", err.message);
//     }
//   });

//   client.on("message", async (msg) => {
//     const text = msg.body.toLowerCase();

//     try {
//       if (text === "hi" || text === "hello") {
//         await msg.reply(`👋 Hello! Welcome to *LakshmiIT*.\nTry: services, pricing, support`);
//       } else if (text.includes("services")) {
//         await msg.reply(`💼 Services:\n• Web & Mobile Dev\n• Cloud\n• AI/ML\n• Marketing`);
//       } else if (text.includes("pricing")) {
//         await msg.reply(`💰 Pricing on request. Call: +91 7897893299`);
//       } else if (text.includes("support")) {
//         await msg.reply(`🛠️ support@lakshmiit.com | +91 7897893299`);
//       } else if (text.includes("website")) {
//         await msg.reply(`🌐 https://www.lakshmiit.com`);
//       } else if (text.includes("location")) {
//         await msg.reply(`📍 Hyderabad\nhttps://goo.gl/maps/YOUR_LOCATION`);
//       } else if (text.includes("brochure")) {
//         const filePath = path.join(__dirname, "..", "LakshmiIT_Brochure.pdf");
//         if (fs.existsSync(filePath)) {
//           await msg.reply("📎 Sending brochure...");
//           await client.sendMessage(msg.from, fs.createReadStream(filePath), {
//             caption: "📄 LakshmiIT Brochure",
//           });
//         } else {
//           await msg.reply("⚠️ Brochure not found.");
//         }
//       } else {
//         await msg.reply(`🤖 Try: hi, services, pricing, support, website`);
//       }
//     } catch (err) {
//       console.error("❌ Message handler error:", err);
//     }
//   });

//   client.initialize();
// };

// const startBot = () => {
//   initializeClient();
// };

// const getQrData = () => qrDataUrl;
// const isBotReady = () => isReady; 

// module.exports = {
//   startBot,
//   getClient: () => client,
//   qrDataUrlRef: getQrData,
//   isBotReady
// };

// // Graceful shutdown
// process.on("SIGINT", async () => {
//   console.log("\n👋 Gracefully shutting down...");
//   if (client) {
//     try {
//       await client.destroy();
//       console.log("🛑 Client destroyed on shutdown.");
//     } catch (err) {
//       console.warn("⚠️ Shutdown destroy error:", err.message);
//     }
//   }
//   process.exit(0);
// });

// // --- these two prevent your crash on ProtocolError ---
// process.on("unhandledRejection", (reason) => {
//   console.warn("🧨 Unhandled Rejection:", reason);
// });
// process.on("uncaughtException", (err) => {
//   console.warn("💥 Uncaught Exception:", err);
// });


const { Client, LocalAuth } = require("whatsapp-web.js");
const fs = require("fs");
const path = require("path");
const qrcode = require("qrcode");

const clients = new Map(); // Store clients by userId
const qrCodes = new Map(); // Store latest QR for each user
const readyStatus = new Map(); // Store ready status for each user

// Create or get an existing WhatsApp client for a user
const getClientForUser = (userId, retryCount = 3) => {
  if (clients.has(userId)) return clients.get(userId);

  const client = new Client({
    authStrategy: new LocalAuth({ clientId: userId }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  // Setup client events
  client.on("qr", (qr) => {
    qrcode.toDataURL(qr, (err, url) => {
      if (!err) {
        qrCodes.set(userId, url);
        console.log(`📲 [${userId}] QR Code ready`);
      } else {
        console.error(`❌ [${userId}] QR generation error:`, err);
      }
    });
  });

  client.on("authenticated", () => {
    console.log(`✅ [${userId}] Authenticated`);
  });

  client.on("ready", () => {
    console.log(`✅ [${userId}] Ready`);
    readyStatus.set(userId, true);
  });

  client.on("disconnected", async (reason) => {
    console.log(`❌ [${userId}] Disconnected: ${reason}`);
    await destroyClient(userId);
    console.log(`🔁 [${userId}] Reinitializing after disconnect...`);
    setTimeout(() => getClientForUser(userId), 3000); // auto-reinit after 3s
  });

  client.on("message", async (msg) => {
    const text = msg.body.toLowerCase();
    try {
      if (text === "hi" || text === "hello") {
        await msg.reply(`👋 Hello! Welcome to *LakshmiIT*.\nTry: services, pricing, support`);
      } else if (text.includes("services")) {
        await msg.reply(`💼 Services:\n• Web & Mobile Dev\n• Cloud\n• AI/ML\n• Marketing`);
      } else if (text.includes("pricing")) {
        await msg.reply(`💰 Pricing on request. Call: +91 7897893299`);
      } else if (text.includes("support")) {
        await msg.reply(`🛠️ support@lakshmiit.com | +91 7897893299`);
      } else if (text.includes("website")) {
        await msg.reply(`🌐 https://www.lakshmiit.com`);
      } else if (text.includes("location")) {
        await msg.reply(`📍 Hyderabad\nhttps://goo.gl/maps/YOUR_LOCATION`);
      } else if (text.includes("brochure")) {
        const filePath = path.join(__dirname, "..", "LakshmiIT_Brochure.pdf");
        if (fs.existsSync(filePath)) {
          await msg.reply("📎 Sending brochure...");
          await client.sendMessage(msg.from, fs.createReadStream(filePath), {
            caption: "📄 LakshmiIT Brochure",
          });
        } else {
          await msg.reply("⚠️ Brochure not found.");
        }
      } else {
        await msg.reply(`🤖 Try: hi, services, pricing, support, website`);
      }
    } catch (err) {
      console.error(`❌ [${userId}] Message handler error:`, err);
    }
  });

  // Initialize with retry logic
  const initializeWithRetry = async (retriesLeft) => {
    try {
      await client.initialize();
      console.log(`🚀 [${userId}] Initialization successful`);
    } catch (err) {
      console.error(`⛔ [${userId}] Initialization failed: ${err.message}`);
      if (retriesLeft > 0) {
        console.log(`🔁 [${userId}] Retrying in 5s... (${retriesLeft} retries left)`);
        setTimeout(() => initializeWithRetry(retriesLeft - 1), 5000);
      } else {
        console.log(`❌ [${userId}] Failed to initialize after retries.`);
      }
    }
  };

  initializeWithRetry(retryCount);

  clients.set(userId, client);
  readyStatus.set(userId, false);

  return client;
};

// Destroy a client session and clean up
const destroyClient = async (userId) => {
  if (!clients.has(userId)) return;

  const client = clients.get(userId);
  try {
    client.removeAllListeners();
    await client.destroy();
    console.log(`🛑 [${userId}] Client destroyed.`);
  } catch (err) {
    console.warn(`⚠️ [${userId}] Error destroying client:`, err.message);
  }

  clients.delete(userId);
  qrCodes.delete(userId);
  readyStatus.delete(userId);

  // Optional: remove session files
  const sessionPath = path.join(__dirname, "..", ".wwebjs_auth", userId);
  if (fs.existsSync(sessionPath)) {
    fs.rmSync(sessionPath, { recursive: true, force: true });
    console.log(`🧹 [${userId}] Auth session removed`);
  }
};

// Get QR data URL
const getQrData = (userId) => qrCodes.get(userId) || null;

// Check if client is ready
const isBotReady = (userId) => readyStatus.get(userId) || false;

// Send message
const sendMessage = async (userId, to, message) => {
  const client = clients.get(userId);
  if (!client || !isBotReady(userId)) throw new Error("Client not ready");

  return await client.sendMessage(to, message);
};

// Shutdown all clients on SIGINT
process.on("SIGINT", async () => {
  console.log("\n👋 Gracefully shutting down all clients...");
  for (const userId of clients.keys()) {
    await destroyClient(userId);
  }
  process.exit(0);
});

process.on("unhandledRejection", (reason) => {
  console.warn("🧨 Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.warn("💥 Uncaught Exception:", err);
});

// Start the default session
const startBot = () => {
  getClientForUser("admin");
};

module.exports = {
  getClientForUser,
  getQrData,
  isBotReady,
  sendMessage,
  destroyClient,
  startBot,
};
