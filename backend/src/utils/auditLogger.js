// Import the database query coordinator function
const { dbQuery } = require('../config/db');
// Import the unique ID generator utility helper
const { generateId } = require('./idGenerator');

// Writes a structured log row to the immutable audit logs table in the database
async function logAuditAction(actorType, actorName, entityType, entityId, action, changes) {
  // Generate a unique ID prefixed with log-
  const logId = generateId('log-');
  try {
    // Insert audit record containing the actor, table entity modified, details, and mock client browser headers
    await dbQuery.run(`
      INSERT INTO audit_logs (id, actor_type, actor_name, entity_type, entity_id, action, changes, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, '203.0.113.195', 'Mozilla/5.0 Node-Express-SQLite')
    `, [logId, actorType, actorName, entityType, entityId, action, JSON.stringify(changes)]);
    console.log(`[AUDIT] ${actorName} (${actorType}) logged ${action} on ${entityType}`);
  } catch (err) {
    // Catch database execution failures without blocking the main request cycle
    console.error('Audit logging failed:', err.message);
  }
}

// Export the audit logger function
module.exports = { logAuditAction };
