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
    res.json({ token, userName: user.first_name, userRole: user.role, userEmail: user.mail, accessibleTabs: user.accessible_tabs, accessibleForms: user.accessible_forms});
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


const getAllUsers = async (req, res) => {
  try {
    const [rows] = await promisePool.query('SELECT user_id, first_name, last_name, department, mail, job_title, role, accessible_tabs, accessible_forms FROM users');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const [rows] = await promisePool.query('SELECT * FROM audit_logs');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createUser = async (req, res) => {
  const { first_name, last_name, mail, tabs, forms, department, job_title, password, created_by } = req.body;

  try {
    // Checking if the user already exists
    const [existingUserRows] = await promisePool.query('SELECT * FROM users WHERE mail = ?', [mail]);
    if (existingUserRows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password before storing it
    const hashedPassword = bcrypt.hashSync(password, 10);
    const tabsJson = JSON.stringify(tabs);
    const formsJson = JSON.stringify(forms);

    // Insert the new user into the database
    const [result] = await promisePool.query(
      'INSERT INTO users (first_name, last_name, mail, accessible_tabs, accessible_forms, department, job_title, password, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [first_name, last_name, mail, tabsJson, formsJson, department, job_title, hashedPassword, created_by]
    );

   // Insert into audit log
    await promisePool.query(
      'INSERT INTO audit_logs (performed_by, details) VALUES (?, ?)',
      [created_by, `Created user with email: ${mail}`]
    );

    // Fetch the newly created user
    const newUser = {
      user_id: result.insertId,
      first_name,
      last_name,
      mail,
      accessible_tabs: JSON.parse(tabsJson),
      accessible_forms: JSON.parse(formsJson),
      department,
      job_title,
    };

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  const { updated_by, mail } = req.body;

  try {
    // Delete the user from the database
    const [result] = await promisePool.query('DELETE FROM users WHERE user_id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Insert into audit log
    await promisePool.query(
      'INSERT INTO audit_logs (performed_by, details) VALUES (?, ?)',
      [updated_by, `Deleted user with email: ${mail}`]
    );

    res.status(204).send(); // No content response
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateUser = async (req, res) => {
  const { user_id, first_name, last_name, mail, role, department, job_title, password, updated_by } = req.body;

  try {
    // Fetch the user from the database
    const [rows] = await promisePool.query('SELECT * FROM users WHERE user_id = ?', [user_id]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prepare the update query and parameters
    const updates = [];
    const params = [];
    const details = [];

    // Update fields only if they are provided
    if (first_name && first_name !== user.first_name) {
      updates.push('first_name = ?');
      params.push(first_name);
      details.push(`first_name changed from ${user.first_name} to ${first_name}`);
    }
    if (last_name && last_name !== user.last_name) {
      updates.push('last_name = ?');
      params.push(last_name);
      details.push(`last_name changed from ${user.last_name} to ${last_name}`);
    }
    if (mail && mail !== user.mail) {
      updates.push('mail = ?');
      params.push(mail);
      details.push(`mail changed from ${user.mail} to ${mail}`);
    }
    if (role && role !== user.role) {
      updates.push('role = ?');
      params.push(role);
      details.push(`role changed from ${user.role} to ${role}`);
    }
    if (department && department !== user.department) {
      updates.push('department = ?');
      params.push(department);
      details.push(`department changed from ${user.department} to ${department}`);
    }
    if (job_title && job_title !== user.job_title) {
      updates.push('job_title = ?');
      params.push(job_title);
      details.push(`job_title changed from ${user.job_title} to ${job_title}`);
    }
    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      updates.push('password = ?');
      params.push(hashedPassword);
      details.push('Password updated');
    }

    if (updated_by) {
      updates.push('updated_by = ?');
      params.push(updated_by);
    }

    // If no fields to update, return a message
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    // Combine updates and execute query
    const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`;
    params.push(user_id);

    await promisePool.query(updateQuery, params);

    // Insert into audit log only the changes that were made
    if (details.length > 0) {
      await promisePool.query(
        'INSERT INTO audit_logs (performed_by, details) VALUES (?, ?)',
        [updated_by, `${user.mail} User Updated: ${details.join('; ')}`]
      );
    }

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
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
    let resetUrl;
    if (process.env.NODE_ENV === 'development') {
      resetUrl = `http://localhost:4200/reset-password/${resetToken}`;
    } else {
      resetUrl = `https://frontend-dot-trillium-dashboard.nn.r.appspot.com/reset-password/${resetToken}`;
    }
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

module.exports = { login, getAllUsers, getAuditLogs, createUser, deleteUser, updateUser, resetPassword, resetPasswordWithToken };