const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('../utils/mailer');
const { JWT_SECRET, DB_CONFIG } = require('../config/config');
const mysql = require('mysql2');

// Create a MySQL connection pool
const pool = mysql.createPool(DB_CONFIG);
const promisePool = pool.promise();

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Fetch user from the database
    const [rows] = await promisePool.query('SELECT * FROM users WHERE mail = ?', [username]);
    const user = rows[0];

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, userName: user.first_name});
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


const getAllUsers = async (req, res) => {
  try {
    const [rows] = await promisePool.query('SELECT user_id, first_name, last_name, department, mail FROM users');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


const resetPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const [rows] = await promisePool.query('SELECT * FROM users WHERE mail = ?', [email]);
    const user = rows.length > 0 ? rows[0] : null;

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Format the expiry date to MySQL DATETIME format
    const formattedExpiry = resetTokenExpiry.toISOString().slice(0, 19).replace('T', ' ');

    await promisePool.query('UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE mail = ?', [resetToken, formattedExpiry, email]);

    const resetUrl = `http://localhost:4200/reset-password/${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset link',
      text: `Hello ${user.first_name},\n\nWe received a request to reset the password for your account.\n\nTo reset your password, click on the link below:\n\n${resetUrl}`
    };

    nodemailer.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ success: false, message: 'Error sending email' });
      }
      res.json({ success: true, message: 'Password reset email sent' });
    });
  } catch (error) {
    console.error('Error processing password reset request:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


// Reset Password with Token
const resetPasswordWithToken = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const [rows] = await promisePool.query('SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiry > ?', [token, Date.now()]);
    const user = rows.length > 0 ? rows[0] : null;

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    await promisePool.query('UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE mail = ?', [hashedPassword, user.mail]);

    res.json({ success: true, message: 'Password has been reset' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { login, getAllUsers, resetPassword, resetPasswordWithToken };