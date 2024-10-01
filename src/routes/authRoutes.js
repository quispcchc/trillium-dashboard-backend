const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const  authenticateJWT  = require('../middleware/authMiddleware.js');

router.post('/login', authController.login);
router.get('/users', authenticateJWT, authController.getAllUsers);
router.post('/create-user', authController.createUser);
router.delete('/users/:id', authController.deleteUser);
router.post('/reset-password', authController.resetPassword);
router.post('/reset-password/:token', authController.resetPasswordWithToken);

module.exports = router;
