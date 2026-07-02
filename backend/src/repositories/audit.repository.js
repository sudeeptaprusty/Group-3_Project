// Import the database query coordinator function
const { dbQuery } = require('../config/db');

// Executes query to retrieve all audit logs ordered newest first
async function findAll() {
  const logs = await dbQuery.all('SELECT * FROM audit_logs ORDER BY created_at DESC');
  // Map and parse the serialized JSON strings back into objects
  return logs.map((l) => ({
    ...l,
    changes: l.changes ? JSON.parse(l.changes) : null,
  }));
}

// Export the audit repository queries
module.exports = { findAll };
