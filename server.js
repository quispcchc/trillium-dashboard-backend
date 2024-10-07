const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const  authenticateJWT  = require('./src/middleware/authMiddleware');
const { login, getAllUsers, createUser, deleteUser, updateUser, resetPassword, resetPasswordWithToken } = require('./src/controllers/authController');
const { getPowerBIReport } = require('./src/services/powerBiService');
const authRoutes = require('./src/routes/authRoutes');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());
app.use('/api', authRoutes);

// Routes
app.post('/login', login);
app.get('/users', authenticateJWT, getAllUsers);
app.post('/create-user', createUser);
app.delete('/users/:id', deleteUser);
app.put('/users/:id', updateUser);
app.post('/reset-password', resetPassword);
app.post('/reset-password/:token', resetPasswordWithToken);
app.get('/report', authenticateJWT, getPowerBIReport);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});