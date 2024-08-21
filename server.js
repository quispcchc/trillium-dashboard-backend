const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { authenticateJWT } = require('./src/middleware/authMiddleware');
const { login, resetPassword, resetPasswordWithToken } = require('./src/controllers/authController');
const { getPowerBIReport } = require('./src/services/powerBiService');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());

// Routes
app.post('/login', login);
app.post('/reset-password', resetPassword);
app.post('/reset-password/:token', resetPasswordWithToken);
app.get('/report', authenticateJWT, getPowerBIReport);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});