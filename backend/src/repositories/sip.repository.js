// Import the database query coordinator function
const { dbQuery } = require('../config/db');

// Inserts a new SIP mandate schedule record
async function create({ id, investorName, fundName, amount, sipDate, nextDebit, createdAt }) {
  // Run raw insert SQL query
  return dbQuery.run(`
    INSERT INTO sip_schedules (id, investor_name, fund_name, amount, date, status, next_debit, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?)
  `, [id, investorName, fundName, amount, sipDate, nextDebit, createdAt || new Date().toISOString(), createdAt || new Date().toISOString()]);
}

// Retrieves all registered SIP schedules
async function findAll() {
  return dbQuery.all('SELECT * FROM sip_schedules ORDER BY id DESC');
}

// Retrieves a specific SIP schedule by its unique ID
async function findById(id) {
  return dbQuery.get('SELECT * FROM sip_schedules WHERE id = ?', [id]);
}

// Updates status (e.g. pause, resume, cancel) of a specific SIP mandate
async function updateStatus(id, status) {
  return dbQuery.run('UPDATE sip_schedules SET status = ?, updated_at = ? WHERE id = ?', [status, new Date().toISOString(), id]);
}

// Export the SIP repository queries
module.exports = { create, findAll, findById, updateStatus };
