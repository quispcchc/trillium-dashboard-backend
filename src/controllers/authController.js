const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('../utils/mailer');
const { JWT_SECRET } = require('../config/config');

// In-memory user storage (for demonstration)
const users = [
  {
    username: 'quisp@carlingtonchc.org',
    password: bcrypt.hashSync('AliVeli123.', 10), // hashed password
    resetToken: null, // Field for storing reset token
    resetTokenExpiry: null // Field for storing reset token expiry time
  }
];

const login = (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
};

const resetPassword = (req, res) => {
  const { email } = req.body;
  const user = users.find(u => u.username === email);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Generate a reset token and expiry time
  const resetToken = crypto.randomBytes(20).toString('hex');
  const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

  user.resetToken = resetToken;
  user.resetTokenExpiry = resetTokenExpiry;

  // Send reset email
  const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset',
    text: `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}`
  };

  nodemailer.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      return res.status(500).json({ message: 'Error sending email' });
    }
    res.json({ message: 'Password reset email sent' });
  });
};

const resetPasswordWithToken = (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const user = users.find(u => u.resetToken === token && u.resetTokenExpiry > Date.now());

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired reset token' });
  }

  user.password = bcrypt.hashSync(password, 10);
  user.resetToken = null;
  user.resetTokenExpiry = null;

  res.json({ message: 'Password has been reset' });
};

module.exports = { login, resetPassword, resetPasswordWithToken };