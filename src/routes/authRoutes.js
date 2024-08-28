const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);

// Route to request password reset
router.post('/reset-password', authController.resetPassword);

// Route to reset password with token
router.post('/reset-password/:token', authController.resetPasswordWithToken);

module.exports = router;
