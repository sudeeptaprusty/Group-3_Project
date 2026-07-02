// Import the Express framework module
const express = require('express');
// Import the CORS (Cross-Origin Resource Sharing) middleware module
const cors = require('cors');
// Import the body-parser middleware to parse request bodies
const bodyParser = require('body-parser');
// Import node's core path utility module
const path = require('path');
// Import the mounted router index file containing all /api subroutes
const apiRoutes = require('./routes');

// Initialize the Express application instance
const app = express();

// Apply CORS middleware to allow cross-origin requests from the React dev server
app.use(cors());
// Parse incoming requests with JSON payloads
app.use(bodyParser.json());
// Parse incoming requests containing URL-encoded form payloads
app.use(bodyParser.urlencoded({ extended: true }));

// Mount all API paths under the '/api' prefix namespace
app.use('/api', apiRoutes);

// Server built static frontend bundle assets from the client build folder
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// Catch-all route to serve the React app for all non-API requests (Fixes SPA routing)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

// Export the configured Express app module
module.exports = app;
