// Import the database query coordinator function
const { dbQuery } = require('../config/db');

// Retrieves all registered AMC system staff users
async function findAll() {
  return dbQuery.all('SELECT * FROM system_users');
}

// Inserts a new system staff member record
async function create({ id, fullName, email, role }) {
  // Run raw insert SQL query
  return dbQuery.run(`
    INSERT INTO system_users (id, full_name, email, role)
    VALUES (?, ?, ?, ?)
  `, [id, fullName, email, role]);
}

// Retrieves a system staff user record by their unique login email address
async function findByEmail(email) {
  return dbQuery.get('SELECT * FROM system_users WHERE email = ?', [email]);
}

// Export the system user repository queries
module.exports = { findAll, create, findByEmail };
