require('dotenv').config();

const db_config = {}

if (process.env.NODE_ENV === 'development') {
  db_config['host'] = process.env.DB_HOST;
  db_config['port'] = process.env.DB_PORT;
} else {
  db_config.socketPath = `/cloudsql/${process.env.DB_INSTANCE}`;
}

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  DB_CONFIG: {
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'your-database-name',
    ...db_config
  }
};
