const express = require('express');
const router = express.Router();
const startBot = require('../services/whatsappService'); // Adjust path as needed

let isBotStarted = false;

router.get('/start', (req, res) => {
  if (!isBotStarted) {
    startBot();
    isBotStarted = true;
    return res.status(200).json({ message: 'WhatsApp bot started successfully.' });
  } else {
    return res.status(200).json({ message: 'WhatsApp bot is already running.' });
  }
});

module.exports = router;
