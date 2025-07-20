

// // File: bot.js
// const { Client, LocalAuth } = require("whatsapp-web.js");
// const fs = require("fs");
// const path = require("path");
// const qrcode = require("qrcode");

// const clients = new Map();
// const qrCodes = new Map();
// const readyStatus = new Map();

// const getClientForUser = (userId, retryCount = 3) => {
//   if (clients.has(userId)) return clients.get(userId);

//   const startTime = Date.now(); // track total time

//   const client = new Client({
//     authStrategy: new LocalAuth({
//       clientId: userId,
//       dataPath: path.join(__dirname, "..", ".wwebjs_auth"),
//     }),
//     puppeteer: {
//       headless: "new",
//       executablePath: require("puppeteer").executablePath(), // <--- Faster launch
//       args: [
//         "--no-sandbox",
//         "--disable-setuid-sandbox",
//         "--disable-dev-shm-usage",
//         "--disable-accelerated-2d-canvas",
//         "--disable-gpu",
//         "--single-process",
//         "--no-zygote",
//         "--disable-extensions",
//         "--disable-background-networking",
//         "--disable-software-rasterizer",
//         "--mute-audio",
//         "--hide-scrollbars",
//         "--window-size=1920,1080",
//       ],
//     },
//   });

//   client.on("qr", (qr) => {
//     qrCodes.set(userId, qr);
//     const duration = ((Date.now() - startTime) / 1000).toFixed(2);
//     console.log(`📲 [${userId}] QR Code generated in ${duration}s`);
//   });

//   client.on("authenticated", () => {
//     console.log(`✅ [${userId}] Authenticated`);
//   });

//   client.on("ready", () => {
//     console.log(`✅ [${userId}] Ready`);
//     readyStatus.set(userId, true);
//   });

//   client.on("disconnected", async (reason) => {
//     console.warn(`❌ [${userId}] Disconnected: ${reason}`);
//     try {
//       await destroyClient(userId);
//     } catch (err) {
//       console.error(`⚠️ Error destroying client [${userId}]:`, err.message);
//     }

//     setTimeout(() => {
//       console.log(`🔄 [${userId}] Reinitializing after disconnect.`);
//       getClientForUser(userId);
//     }, 5000);
//   });

//   client.on("message", async (msg) => {
//     const text = msg.body.toLowerCase();
//     try {
//       if (text === "hi" || text === "hello") {
//         await msg.reply(`👋 Hello from LakshmiIT! Try: services, pricing, support.`);
//       } else if (text.includes("services")) {
//         await msg.reply(`💼 Services:\n• Web & Mobile Dev\n• AI\n• Cloud & Marketing`);
//       } else if (text.includes("pricing")) {
//         await msg.reply(`💰 Pricing on request. Call: +91 7897893299`);
//       } else if (text.includes("support")) {
//         await msg.reply(`🛠️ support@lakshmiit.com | +91 7897893299`);
//       } else {
//         await msg.reply(`🤖 Try: hi, services, pricing, support`);
//       }
//     } catch (err) {
//       console.error(`❌ [${userId}] Message error:`, err);
//     }
//   });

//   const initializeWithRetry = async (client, userId, retriesLeft) => {
//     try {
//       console.log(`🚀 [${userId}] Initializing WhatsApp client...`);
//       await client.initialize();
//     } catch (err) {
//       console.error(`⛔ [${userId}] Initialization failed: ${err.message}`);
//       if (retriesLeft > 0) {
//         console.log(`🔁 Retrying init for [${userId}] (${retriesLeft} left)...`);
//         setTimeout(() => initializeWithRetry(client, userId, retriesLeft - 1), 5000);
//       } else {
//         console.error(`💥 [${userId}] Max retries exceeded.`);
//       }
//     }
//   };

//   initializeWithRetry(client, userId, retryCount);
//   clients.set(userId, client);
//   readyStatus.set(userId, false);
//   return client;
// };


// const destroyClient = async (userId) => {
//   if (!clients.has(userId)) return;
//   const client = clients.get(userId);
//   try {
//     client.removeAllListeners();
//     await client.destroy();
//   } catch (err) {
//     console.warn(`⚠️ Destroy error: ${err.message}`);
//   }
//   clients.delete(userId);
//   qrCodes.delete(userId);
//   readyStatus.delete(userId);
//   const sessionPath = path.join(__dirname, "..", ".wwebjs_auth", userId);
//   if (fs.existsSync(sessionPath)) {
//     fs.rmSync(sessionPath, { recursive: true, force: true });
//   }
// };

// const getQrData = (userId) => qrCodes.get(userId) || null;
// const isBotReady = (userId) => readyStatus.get(userId) || false;
// const sendMessage = async (userId, to, message) => {
//   const client = clients.get(userId);
//   if (!client || !isBotReady(userId)) throw new Error("Client not ready");
//   return await client.sendMessage(to, message);
// };

// process.on("SIGINT", async () => {
//   for (const userId of clients.keys()) await destroyClient(userId);
//   process.exit(0);
// });

// const startBot = () => {
//   getClientForUser("admin");
// };

// module.exports = {
//   getClientForUser,
//   getQrData,
//   isBotReady,
//   sendMessage,
//   destroyClient,
//   startBot,
// };


// File: bot.js

// 

const { Client, MessageMedia } = require("whatsapp-web.js");
const fs = require("fs");
const path = require("path");

const clients = new Map();
const qrCodes = new Map();
const readyStatus = new Map();
const lastQRGeneratedTime = new Map();

function formatNumber(raw) {
  return raw.replace(/\D/g, '') + "@c.us";
}

function waitRandom(min, max) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(res => setTimeout(res, delay));
}

const getClientForUser = (userId, retryCount = 3) => {
  if (clients.has(userId) && readyStatus.get(userId)) {
    console.log(`ℹ️ [${userId}] Client already ready.`);
    return clients.get(userId);
  }

  const startTime = Date.now();

  const client = new Client({
    puppeteer: {
      headless: "new",
      executablePath: require("puppeteer").executablePath(),
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--single-process",
        "--no-zygote",
        "--disable-extensions",
        "--disable-background-networking",
        "--disable-software-rasterizer",
        "--mute-audio",
        "--hide-scrollbars",
        "--window-size=1920,1080",
      ],
    },
  });

  client.on("qr", (qr) => {
    const now = Date.now();
    const lastTime = lastQRGeneratedTime.get(userId) || 0;
    if (now - lastTime < 15000) return;
    lastQRGeneratedTime.set(userId, now);

    qrCodes.set(userId, qr);
    const duration = ((now - startTime) / 1000).toFixed(2);
    console.log(`📲 [${userId}] QR Code generated in ${duration}s`);
  });

  client.on("authenticated", () => {
    console.log(`✅ [${userId}] Authenticated`);
  });

  client.on("auth_failure", (msg) => {
    console.error(`🔐 [${userId}] Auth failure: ${msg}`);
  });

  client.on("ready", () => {
    console.log(`✅ [${userId}] Ready`);
    readyStatus.set(userId, true);
  });

  client.on("disconnected", async (reason) => {
    console.warn(`❌ [${userId}] Disconnected: ${reason}`);
    try {
      await destroyClient(userId);
    } catch (err) {
      console.error(`⚠️ Error destroying client [${userId}]:`, err.message);
    }

    if (reason !== "NAVIGATION") {
      setTimeout(() => {
        console.log(`🔄 [${userId}] Reinitializing after disconnect.`);
        getClientForUser(userId);
      }, 5000);
    }
  });

  client.on("message", async (msg) => {
    const text = msg.body.toLowerCase();
    try {
      if (text === "hi" || text === "hello") {
        await msg.reply(`👋 Hello from LakshmiIT! Try: services, pricing, support.`);
      } else if (text.includes("services")) {
        await msg.reply(`💼 Services:\n• Web & Mobile Dev\n• AI\n• Cloud & Marketing`);
      } else if (text.includes("pricing")) {
        await msg.reply(`💰 Pricing on request. Call: +91 7897893299`);
      } else if (text.includes("support")) {
        await msg.reply(`🛠️ support@lakshmiit.com | +91 7897893299`);
      } else {
        await msg.reply(`🤖 Try: hi, services, pricing, support`);
      }
    } catch (err) {
      console.error(`❌ [${userId}] Message error:`, err);
    }
  });

  const initializeWithRetry = async (client, userId, retriesLeft) => {
    try {
      console.log(`🚀 [${userId}] Initializing WhatsApp client...`);
      await client.initialize();
    } catch (err) {
      console.error(`⛔ [${userId}] Initialization failed: ${err.message}`);
      if (retriesLeft > 0) {
        console.log(`🔁 Retrying init for [${userId}] (${retriesLeft} left)...`);
        setTimeout(() => initializeWithRetry(client, userId, retriesLeft - 1), 5000);
      } else {
        console.error(`💥 [${userId}] Max retries exceeded.`);
      }
    }
  };

  initializeWithRetry(client, userId, retryCount);
  clients.set(userId, client);
  readyStatus.set(userId, false);
  return client;
};

const destroyClient = async (userId) => {
  if (!clients.has(userId)) return;
  const client = clients.get(userId);
  try {
    client.removeAllListeners();
    await client.destroy();
  } catch (err) {
    console.warn(`⚠️ Destroy error: ${err.message}`);
  }
  clients.delete(userId);
  qrCodes.delete(userId);
  readyStatus.delete(userId);
};

const getQrData = (userId) => qrCodes.get(userId) || null;
const isBotReady = (userId) => readyStatus.get(userId) || false;

const sendMessage = async (userId, to, message) => {
  const client = clients.get(userId);
  if (!client || !isBotReady(userId)) throw new Error("Client not ready");
  return await client.sendMessage(to, message);
};

const sendBulkMessages = async (userId, { numbers, message, attachment }) => {
  const client = clients.get(userId);
  if (!client || !isBotReady(userId)) {
    console.error(`❌ [${userId}] Not connected or not ready.`);
    return { error: "WhatsApp not connected" };
  }

  if (!Array.isArray(numbers) || numbers.length === 0) {
    return { error: "Invalid numbers list" };
  }

  const media = attachment ? MessageMedia.fromFilePath(attachment) : null;
  let sentCount = 0;
  let failedCount = 0;

  console.log(`🚀 [${userId}] Starting bulk send to ${numbers.length} numbers.`);

  for (let i = 0; i < numbers.length; i++) {
    const rawNumber = numbers[i];
    const chatId = formatNumber(rawNumber);

    try {
      const isRegistered = await client.getNumberId(rawNumber.replace(/\D/g, ''));
      if (!isRegistered) {
        console.log(`⚠️ [${userId}] Skipping ${rawNumber} (not on WhatsApp)`);
        continue;
      }

      if (media) {
        await client.sendMessage(chatId, media, { caption: message });
      } else {
        await client.sendMessage(chatId, message);
      }

      sentCount++;
      console.log(`✅ [${userId}] Sent to ${rawNumber}`);
    } catch (err) {
      failedCount++;
      console.error(`❌ [${userId}] Failed to send to ${rawNumber}:`, err.message);
    }

    await waitRandom(3000, 10000);

    if ((i + 1) % 120 === 0) {
      console.log(`⏸ [${userId}] Cooldown for 2 minutes...`);
      await waitRandom(120000, 150000);
    }
  }

  console.log(`🎉 [${userId}] Done. ✅ Sent: ${sentCount}, ❌ Failed: ${failedCount}`);

  return {
    success: true,
    sent: sentCount,
    failed: failedCount,
    total: numbers.length,
  };
};

process.on("SIGINT", async () => {
  for (const userId of clients.keys()) {
    await destroyClient(userId);
  }
  process.exit(0);
});

const startBot = () => {
  getClientForUser("admin");
};

module.exports = {
  getClientForUser,
  getQrData,
  isBotReady,
  sendMessage,
  sendBulkMessages,
  destroyClient,
  startBot,
};
