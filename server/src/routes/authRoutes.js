const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, register, login, logout, getMe, getUsers, toggleUserRole, updateUser, deleteUser } = require('../controllers/AuthController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.get('/users', authenticate, authorizeAdmin, getUsers);
router.patch('/users/:phone/role', authenticate, authorizeAdmin, toggleUserRole);
router.put('/users/:phone', authenticate, authorizeAdmin, updateUser);
router.delete('/users/:phone', authenticate, authorizeAdmin, deleteUser);

module.exports = router;
