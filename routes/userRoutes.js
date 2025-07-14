const express = require('express');
const { getContacts, addContact, updateContact, deleteContact, bulkUploadContacts } = require('../controllers/userController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // all routes below are protected
router.get('/get-contacts', getContacts);
router.post('/contacts', addContact);

router.post('/contacts/bulk', bulkUploadContacts);

router.put('/contacts/:id', protect, updateContact);
router.delete('/contacts/:id', protect, deleteContact);

module.exports = router;
