const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Import Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const fieldRoutes = require('./routes/fieldRoutes');

const app = express();

// Global Middleware
// Helmet secures our Express app by setting various HTTP headers
app.use(helmet()); 
// CORS allows our React frontend to communicate with this API safely
app.use(cors()); 
// Parses incoming JSON payloads
app.use(express.json()); 

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'Swastha Hospital API is running.' 
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/fields', fieldRoutes);

// Server Initialization
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});