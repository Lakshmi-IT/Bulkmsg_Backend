const express = require('express');
const { getTemplates, createTemplate } = require('../controllers/templateController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', getTemplates);

router.post('/templates', createTemplate);

module.exports = router;
