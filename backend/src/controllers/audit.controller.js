// Import the audit services module
const auditService = require('../services/audit.service');
// Import Express route handlers error wrapper utilities
const { asyncHandler } = require('../utils/asyncHandler');

// GET handler to retrieve list of all logged system actions
const getAll = asyncHandler(async (_req, res) => {
  try {
    // Fetch logs from service layer
    const logs = await auditService.getAllLogs();
    // Ensure logs is an array
    if (!logs || !Array.isArray(logs)) {
      return res.status(500).json({ error: 'Invalid audit logs data returned from service' });
    }
    // Return logs response with status 200 OK
    res.status(200).json(logs);
  } catch (err) {
    // Return status 500 error response if execution fails
    res.status(500).json({ error: err.message });
  }
});

// Export the audit logs controller handler endpoints
module.exports = { getAll };
