const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();

const expressSession = require('express-session');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

app.use(expressSession({
  secret: 'yourSecret', // use a secure secret in production
  resave: false,
  saveUninitialized: false
}));
app.use(express.json());

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// Export the app instead of listening here
module.exports = app;