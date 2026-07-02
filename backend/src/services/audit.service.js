// Import the database repository that queries the system audit logs table
const auditRepo = require('../repositories/audit.repository');

// Retrieves all logged system and user actions from the audit database
async function getAllLogs() {
  // Execute database query to retrieve all logs and return the list
  return auditRepo.findAll();
}

// Export the logs service module functions
module.exports = { getAllLogs };
