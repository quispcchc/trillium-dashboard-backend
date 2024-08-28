const nodemailer = require('nodemailer');
const { EMAIL_USER, EMAIL_PASS } = require('../config/config');

const transporter = nodemailer.createTransport({
  service: 'Outlook365', // or another email service provider
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

module.exports = transporter;