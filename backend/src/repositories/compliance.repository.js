// Import the database query coordinator function
const { dbQuery } = require('../config/db');

// Inserts a new compliance alert record
async function create({ id, complianceCheckId, userId, alertType, severity, description }) {
  // Run raw insert SQL query
  return dbQuery.run(`
    INSERT INTO compliance_alerts (id, compliance_check_id, user_id, alert_type, severity, description, status)
    VALUES (?, ?, ?, ?, ?, ?, 'OPEN')
  `, [id, complianceCheckId, userId, alertType, severity, description]);
}

// Retrieves all compliance alerts ordered newest first
async function findAll() {
  return dbQuery.all('SELECT * FROM compliance_alerts ORDER BY created_at DESC');
}

// Resolves a specific alert record by its unique ID
async function resolveById(id, resolutionNotes) {
  // Update status, notes, and timestamp
  return dbQuery.run(`
    UPDATE compliance_alerts 
    SET status = 'RESOLVED', resolution_notes = ?, resolved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [resolutionNotes, id]);
}

// Resolves all open compliance alerts associated with a specific investor ID
async function resolveOpenByUserId(userId, notes) {
  // Update all open records to RESOLVED
  return dbQuery.run(
    'UPDATE compliance_alerts SET status = "RESOLVED", resolution_notes = ?, resolved_at = CURRENT_TIMESTAMP WHERE user_id = ? AND status = "OPEN"',
    [notes, userId]
  );
}

// Export the compliance repository queries
module.exports = { create, findAll, resolveById, resolveOpenByUserId };
