// Import the Express framework module
const express = require('express');
// Import the authentication controller handling user access and sessions
const authController = require('../controllers/auth.controller');

// Initialize the Express router instance
const router = express.Router();

// POST /api/auth/register - Handles client/investor profile registration
router.post('/register', authController.register);
// POST /api/auth/login - Handles logins for both investors and internal staff
router.post('/login', authController.login);
// GET /api/auth/session - Validates JWT session token and returns current user details
router.get('/session', authController.verifySession);
// POST /api/auth/logout - Records user logout activity to audit logs
router.post('/logout', authController.logout);

// Export the authentication router module
module.exports = router;
