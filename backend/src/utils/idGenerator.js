// Generates a random alphanumeric string ID prefixed with a custom tag (defaulting to 'usr_')
function generateUUID(prefix = 'usr_') {
  // Convert a floating point number to a base-36 string, crop the fraction, and append to prefix
  return prefix + Math.random().toString(36).substr(2, 9);
}

// Generates a random alphanumeric string ID with a required prefix tag
function generateId(prefix) {
  // Convert a floating point number to a base-36 string, crop the fraction, and append to prefix
  return prefix + Math.random().toString(36).substr(2, 9);
}

// Export the ID generator utilities
module.exports = { generateUUID, generateId };
