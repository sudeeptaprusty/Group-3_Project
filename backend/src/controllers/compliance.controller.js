// Import the compliance services module
const complianceService = require('../services/compliance.service');
// Import Express route handlers error wrapper utilities
const { asyncHandler, handleServiceError } = require('../utils/asyncHandler');

// GET handler to retrieve list of all compliance alerts
const getAlerts = asyncHandler(async (_req, res) => {
  try {
    // Fetch alerts from service layer
    const alerts = await complianceService.getAllAlerts();
    // Ensure alerts is an array
    if (!alerts || !Array.isArray(alerts)) {
      return res.status(500).json({ error: 'Invalid compliance alerts data returned from service' });
    }
    // Return alerts response with status 200 OK
    res.status(200).json(alerts);
  } catch (err) {
    // Return status 500 error response if execution fails
    res.status(500).json({ error: err.message });
  }
});

// POST handler to resolve a specific compliance alert override
const resolve = asyncHandler(async (req, res) => {
  try {
    // Forward resolution parameters to compliance service
    const result = await complianceService.resolveAlert(req.body);
    // Return success response with status 200 OK
    res.status(200).json(result);
  } catch (err) {
    // Handle error formatting
    handleServiceError(res, err, 'Alert resolution failed.');
  }
});

// Export the compliance controller handler endpoints
module.exports = { getAlerts, resolve };
