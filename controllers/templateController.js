const Template = require('../models/templateModel');

// Get all templates for logged-in user
exports.getTemplates = async (req, res) => {
  try {
    const templates = await Template.find({ user: req.user._id });
    res.status(200).json(templates);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch templates',
      error: error.message,
    });
  }
};

// Create a new template
exports.createTemplate = async (req, res) => {
  try {
    const { type, subject, content, templateId } = req.body;

    if (!type || !subject || !content) {
      return res.status(400).json({ message: 'Type, subject, and content are required.' });
    }

    // Check case-insensitively if a subject already exists
    const existingTemplate = await Template.findOne({
      subject: { $regex: `^${subject}$`, $options: 'i' },
      user: req.user._id,
    });

    if (existingTemplate) {
      return res.status(409).json({ message: 'Subject already exists (case-insensitive).' });
    }

    const template = await Template.create({
      type,
      subject, // Store as-is, or use subject.toLowerCase() if you want all lowercase
      content,
      templateId: templateId || '',
      user: req.user._id,
    });

    res.status(201).json({
      message: 'Template created successfully',
      template,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create template',
      error: error.message,
    });
  }
};

