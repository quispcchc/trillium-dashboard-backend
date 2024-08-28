require('dotenv').config();

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  POWER_BI_CLIENT_ID: process.env.POWER_BI_CLIENT_ID || 'your-powerbi-client-id',
  POWER_BI_CLIENT_SECRET: process.env.POWER_BI_CLIENT_SECRET || 'your-powerbi-client-secret',
  POWER_BI_TENANT_ID: process.env.POWER_BI_TENANT_ID || 'your-powerbi-tenant-id',
  POWER_BI_REPORT_ID: process.env.POWER_BI_REPORT_ID || 'your-powerbi-report-id',
  POWER_BI_GROUP_ID: process.env.POWER_BI_GROUP_ID || 'your-powerbi-group-id',
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  DB_CONFIG: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'your-database-password',
    database: process.env.DB_NAME || 'your-database-name'
  }
};