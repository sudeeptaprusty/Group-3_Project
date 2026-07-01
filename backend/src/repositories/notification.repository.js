// Import the database query coordinator function
const { dbQuery } = require('../config/db');

// Inserts a new customer messaging notification record
async function create({ id, userId, channel, type, title, body }) {
  // Run raw insert SQL query
  return dbQuery.run(`
    INSERT INTO notifications (id, user_id, channel, type, title, body)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [id, userId, channel, type, title, body]);
}

// Export the notifications repository queries
module.exports = { create };
