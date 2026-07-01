// Import the database repository that queries internal system users/admin tables
const systemUserRepo = require('../repositories/systemUser.repository');
// Import the audit logger utility function to record compliance actions
const { logAuditAction } = require('../utils/auditLogger');
// Import the unique ID generator utility
const { generateId } = require('../utils/idGenerator');

// Retrieves all registered AMC personnel (admins, analysts, officers)
async function getAllSystemUsers() {
  // Execute database query and return lists
  return systemUserRepo.findAll();
}

// Registers a new internal AMC team member in the directory
async function createSystemUser({ fullName, email, role }) {
  // Validate that all required parameters are provided
  if (!fullName || !email || !role) {
    const error = new Error('Missing user parameters.');
    error.statusCode = 400;
    throw error;
  }

  // Generate unique internal user identifier prefix
  const id = generateId('sys-usr-');
  // Insert team member record in database
  await systemUserRepo.create({ id, fullName, email, role });

  // Log personnel creation details inside system audit logs
  await logAuditAction('SYSTEM', 'ADMIN_SHELL', 'system_users', id, 'CREATE', {
    message: `Added new system personnel: ${fullName} as ${role.replace('_', ' ')}.`,
  });

  return { status: 'success' };
}

// Export the system user services
module.exports = { getAllSystemUsers, createSystemUser };
