// Generate a secure random JWT secret key
const crypto = require('crypto');
const key = crypto.randomBytes(32).toString('base64');
console.log(key);