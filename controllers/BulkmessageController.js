const express = require('express');
const router = express.Router();
const BulkMessage = require('../models/BulkMessage');





exports.getBulkmessages = async (req, res) => {
  try {
    const response = await BulkMessage.find({ user: req.user._id });
    res.json(response);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch contacts",
      error: error.message,
    });
  }
};

exports.bulkmessages= async (req, res) => {
  const { contactIds, message, messageType } = req.body;

  try {
    // Store in DB
    const bulkEntry = new BulkMessage({ contactIds, message, messageType });
    await bulkEntry.save();

  
    console.log('Bulk message saved:', bulkEntry._id);

    res.status(200).json({ message: 'Bulk message saved', bulkId: bulkEntry._id });
  } catch (err) {
    console.error('Error saving bulk message:', err);
    res.status(500).json({ message: 'Server error' });
  }
};



