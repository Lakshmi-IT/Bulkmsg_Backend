const express = require('express');
const { register, login, getAllData, updateUser, deleteUser } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/getAdmins',getAllData)

router.put('/updateUser/:id',updateUser)

router.delete('/delete/:id', deleteUser);


module.exports = router;
