const express = require('express');
const path = require('path');
require('dotenv').config();
const dogRoutes = require('./routes/dogRoutes');

const app = express();

// Add
const expressSession = require('express-session');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// Add
app.use(expressSession({
  secret: 'yourSecret', // use a secure secret in production
  resave: false,
  saveUninitialized: false
}));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);
app.use('/api', dogRoutes);

// Export the app instead of listening here
module.exports = app;