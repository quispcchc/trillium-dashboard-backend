const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const  authenticateJWT  = require('./src/middleware/authMiddleware');
const { login, getAllUsers, getAuditLogs, createUser, deleteUser, updateUser, resetPassword, resetPasswordWithToken, getAllDashboards } = require('./src/controllers/authController');
const authRoutes = require('./src/routes/authRoutes');

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
  origin: '*',
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type'
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(bodyParser.json());
app.use('/api', authRoutes);

// Routes
app.post('/api/login', login);
app.get('/api/users', authenticateJWT, getAllUsers);
app.get('/api/audit-logs', getAuditLogs);
app.post('/api/create-user', createUser);
app.delete('/api/users/:id', deleteUser);
app.put('/api/users/:id', updateUser);
app.post('/api/reset-password', resetPassword);
app.post('/api/reset-password/:token', resetPasswordWithToken);
app.get('/api/dashboards', getAllDashboards);

app.get('/api/health', (req, res) => {
  res.send('Backend is running');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});