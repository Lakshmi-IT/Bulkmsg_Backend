const mongoose = require('mongoose');

const bulkMessageSchema = new mongoose.Schema({
  contactIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      required: true
    }
  ],
  message: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['whatsapp', 'sms'],
    default: 'whatsapp'
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const BulkMessage = mongoose.model('BulkMessage', bulkMessageSchema);
module.exports = BulkMessage;
