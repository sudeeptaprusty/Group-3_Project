// Import the database repository that queries the core user/investor tables
const userRepo = require('../repositories/user.repository');
// Import the database repository that queries the system staff/admin tables
const systemUserRepo = require('../repositories/systemUser.repository');
// Import the audit logger utility function to record compliance actions
const { logAuditAction } = require('../utils/auditLogger');
// Import the unique ID generator utility
const { generateUUID } = require('../utils/idGenerator');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fintrend_secure_jwt_secret_token_generation_key_2026';

// Handles registration of new investor profiles
async function register({ email, fullName, dob, phone, role, password }) {
  // Validate that all required registration fields are provided
  if (!email || !fullName || !dob || !phone || !password) {
    const error = new Error('Missing required registration fields.');
    error.statusCode = 400;
    throw error;
  }

  // Generate a cryptographically secure random UUID for the new user
  const userId = generateUUID();
  // Assign role or default to INVESTOR
  const defaultRole = role || 'INVESTOR';

  // Hash password using bcryptjs
  const hashedPassword = await bcrypt.hash(password, 10);

  // Persist the user credentials and details to the database
  await userRepo.createUser({
    id: userId,
    email,
    phone,
    password: hashedPassword, // Store the secure bcrypt hash
    fullName,
    dob,
    role: defaultRole,
  });

  // If role is a system user role, also persist in system_users table
  if (defaultRole !== 'INVESTOR') {
    await systemUserRepo.create({
      id: userId,
      fullName,
      email,
      role: defaultRole,
    });
  }

  // Log the registration event in the system audit logs
  await logAuditAction('USER', fullName, 'users', userId, 'CREATE', {
    message: `New investor account registered for ${fullName} (${email}).`,
    role: defaultRole,
    status: 'ACTIVE',
  });

  // Generate session token
  const token = jwt.sign({ id: userId, email, role: defaultRole }, JWT_SECRET, { expiresIn: '1d' });

  // Return the registration details payload with token
  return {
    id: userId,
    email,
    fullName,
    dob,
    phone,
    role: defaultRole,
    status: 'ACTIVE',
    token
  };
}

// Authenticates user and staff credentials
async function login({ email, password }) {
  // Validate that email and password fields are populated
  if (!email || !password) {
    const error = new Error('Email and password are required.');
    error.statusCode = 400;
    throw error;
  }

  // 1. Find user in unified users table
  const user = await userRepo.findByEmail(email);
  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // 2. Validate password using bcryptjs
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // 3. Handle system personnel roles vs investor roles
  if (user.role !== 'INVESTOR') {
    // Ensure system staff exists in the system_users table
    const systemUser = await systemUserRepo.findByEmail(email);
    if (!systemUser) {
      await systemUserRepo.create({
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role
      });
    }

    const userObj = {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      status: user.status || 'ACTIVE'
    };

    // Log the staff login success event to the audit logs
    await logAuditAction('SYSTEM', userObj.fullName, 'auth', userObj.id, 'LOGIN', {
      message: `AMC personnel ${userObj.fullName} (${userObj.role}) logged in.`,
    });

    const token = jwt.sign({ id: userObj.id, email: userObj.email, role: userObj.role }, JWT_SECRET, { expiresIn: '1d' });

    return {
      ...userObj,
      token
    };
  }

  // 4. Handle standard investor user login
  const userObj = {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status
  };

  // Log the client login success event to the audit logs
  await logAuditAction('USER', userObj.fullName, 'auth', userObj.id, 'LOGIN', {
    message: `Investor ${userObj.fullName} logged in.`,
  });

  const token = jwt.sign({ id: userObj.id, email: userObj.email, role: userObj.role }, JWT_SECRET, { expiresIn: '1d' });

  return {
    ...userObj,
    token
  };
}

// Validates active session via JWT token
async function verifySession(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await userRepo.findById(decoded.id);
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 401;
      throw error;
    }

    return {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone || null,
      role: user.role,
      status: user.status,
      token
    };
  } catch (err) {
    const error = new Error('Invalid or expired session.');
    error.statusCode = 401;
    throw error;
  }
}

// Records user logout event in audit log
async function logout({ userId, fullName, role }) {
  const actorType = role === 'INVESTOR' ? 'USER' : 'SYSTEM';
  await logAuditAction(actorType, fullName || 'User', 'auth', userId || 'unknown', 'LOGOUT', {
    message: `${role || 'User'} logged out.`,
  });
}

// Export the authentication services
module.exports = { register, login, verifySession, logout };
