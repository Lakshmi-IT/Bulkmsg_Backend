const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const templateRoutes = require("./routes/templateRoutes");
const bulkmsgRoutes = require("./routes/bulkmsgRoutes");
const {
  startBot,
  qrDataUrlRef,
  isBotReady,
  getClientForUser,
  getQrData,
} = require("./services/whatsappService");



const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/bulk", bulkmsgRoutes);

// app.get("/get-qr", (req, res) => {
 
//   const qr = qrDataUrlRef();
//   if (qr) {
//     res.json({
//       success: true,
//       qr,
//       ready: isBotReady(), // ← call the function to get a boolean
//     });
//   } else {
//     res.json({
//       success: false,
//       message: "QR code not generated yet.",
//       ready: isBotReady(), // ← you can still report readiness if you like
//     });
//   }
// });

app.get("/get-qr/:userId", async (req, res) => {
  const { userId } = req.params;

  // Start or get the client
  getClientForUser(userId);

  // Wait briefly to allow QR to generate (optional but helpful)
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const qr = getQrData(userId); // pass userId here
  const ready = isBotReady(userId); // pass userId here

  if (qr) {
    res.json({
      success: true,
      qr,
      ready,
    });
  } else {
    res.json({
      success: false,
      message: "QR code not generated yet.",
      ready,
    });
  }
});





module.exports = app;





