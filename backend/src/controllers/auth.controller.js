// Import the authentication services module
const authService = require('../services/auth.service');
// Import Express route handlers error wrapper utilities
const { asyncHandler, handleServiceError } = require('../utils/asyncHandler');

// POST handler to register a new investor profile
const register = asyncHandler(async (req, res) => {
  try {
    // Send register payload parameters to auth service
    const user = await authService.register(req.body);
    // Return register success response with 201 Created
    res.status(201).json({ status: 'success', user });
  } catch (err) {
    // Check if error is client validation error (HTTP 400)
    if (err.statusCode === 400) return res.status(400).json({ error: err.message });
    console.error('Registration failed:', err.message);
    // Return error if unique email/phone check fails
    res.status(500).json({ error: 'Database constraint violation. Email/Phone must be unique.' });
  }
});

// POST handler to login system personnel and investors
const login = asyncHandler(async (req, res) => {
  try {
    // Send login email and password parameters to auth service
    const user = await authService.login(req.body);
    // Return authenticated user object with 200 OK
    res.status(200).json({ status: 'success', user });
  } catch (err) {
    // Return HTTP 400 or 401 client error if parameters or passwords mismatch
    if (err.statusCode === 400 || err.statusCode === 401) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('Login failed:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET handler to validate user session via JWT token
const verifySession = asyncHandler(async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Access token missing' });
    }
    
    const user = await authService.verifySession(token);
    res.status(200).json({ status: 'success', user });
  } catch (err) {
    res.status(401).json({ error: err.message || 'Invalid session' });
  }
});

// POST handler to log logout actions to audit log
const logout = asyncHandler(async (req, res) => {
  try {
    await authService.logout(req.body);
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout failed:', err.message);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Export the registration, login, session, and logout handler endpoints
module.exports = { register, login, verifySession, logout };
