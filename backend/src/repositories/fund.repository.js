// Import the database query coordinator function
const { dbQuery } = require('../config/db');

// Retrieves all active mutual fund schemes from the database
async function findAllActive() {
  return dbQuery.all('SELECT * FROM funds WHERE is_active = true');
}

// Retrieves a specific mutual fund scheme record by its unique ID
async function findById(id) {
  return dbQuery.get('SELECT * FROM funds WHERE id = ?', [id]);
}

// Export the fund repository queries
module.exports = { findAllActive, findById };
