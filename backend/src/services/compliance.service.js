// Import the database repository that queries compliance/AML alerts table
const complianceRepo = require('../repositories/compliance.repository');
// Import the audit logger utility function to record compliance actions
const { logAuditAction } = require('../utils/auditLogger');

// Retrieves all AML and compliance alerts from the database
async function getAllAlerts() {
  // Execute database query to retrieve all alerts and return the list
  return complianceRepo.findAll();
}

// Resolves a flagged compliance alert with resolution actions and notes
async function resolveAlert({ alertId, resolution, notes }) {
  // Validate that alertId and resolution parameters are provided
  if (!alertId || !resolution) {
    const error = new Error('Missing resolution parameters.');
    error.statusCode = 400;
    throw error;
  }

  // Update the compliance alert status and notes in the database
  await complianceRepo.resolveById(alertId, `${resolution}: ${notes}`);

  // Log the resolution action in the system audit logs for compliance tracking
  await logAuditAction('USER', 'Compliance Officer', 'compliance_alerts', alertId, 'UPDATE', {
    message: `AML Alert resolved successfully. Actions: ${resolution}.`,
  });

  return { status: 'success' };
}

// Export the compliance service module functions
module.exports = { getAllAlerts, resolveAlert };
