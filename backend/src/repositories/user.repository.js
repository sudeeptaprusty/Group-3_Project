// Import the database query coordinator function
const { dbQuery } = require('../config/db');

// Inserts a new user record into the database users table
async function createUser({ id, email, phone, password, fullName, dob, role }) {
  const hash = password || 'bcrypt_mock_hashed_password';
  return dbQuery.run(`
    INSERT INTO users (id, email, phone, password_hash, full_name, date_of_birth, role, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
  `, [id, email, phone, hash, fullName, dob, role]);
}

// Retrieves a user record by their unique ID
async function findById(id) {
  return dbQuery.get('SELECT * FROM users WHERE id = ?', [id]);
}

// Updates the account status of a specific user
async function updateStatus(id, status) {
  return dbQuery.run('UPDATE users SET status = ? WHERE id = ?', [status, id]);
}

// Retrieves all investors with accumulated AUM and active SIP mandate counts
async function findInvestorsWithStats() {
  return dbQuery.all(`
    SELECT 
      u.id, u.full_name AS fullName, u.email, u.phone, u.status, u.created_at,
      coalesce(sum(inv.current_value), 0) as aum,
      coalesce(sum(case when inv.investment_type = 'SIP' AND inv.status = 'ACTIVE' then 1 else 0 end), 0) as activeSips
    FROM users u
    LEFT JOIN investments inv ON inv.user_id = u.id
    WHERE u.role = 'INVESTOR'
    GROUP BY u.id, u.full_name, u.email, u.phone, u.status, u.created_at
  `);
}

// Retrieves investors with their accumulated AUM for churn analytics calculation
async function findInvestorsForAnalytics() {
  return dbQuery.all(`
    SELECT 
      u.id, u.full_name AS fullName, u.email, u.phone, u.status, u.created_at,
      coalesce(sum(inv.current_value), 0) as aum
    FROM users u
    LEFT JOIN investments inv ON inv.user_id = u.id
    WHERE u.role = 'INVESTOR'
    GROUP BY u.id, u.full_name, u.email, u.phone, u.status, u.created_at
  `);
}

// Retrieves a user record by email (used during authentication checks)
async function findByEmail(email) {
  return dbQuery.get('SELECT * FROM users WHERE email = ?', [email]);
}

// Export the user repository queries
module.exports = {
  createUser,
  findById,
  findByEmail,
  updateStatus,
  findInvestorsWithStats,
  findInvestorsForAnalytics,
};
