const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['sms', 'whatsapp'],
      default: 'whatsapp',
    },
    subject: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
    },
    templateId: {
      type: String,
      default: '',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Template', templateSchema);
