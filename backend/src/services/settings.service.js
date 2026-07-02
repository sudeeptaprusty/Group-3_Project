// Import the database bootstrap coordinator module
const { initializeDatabase } = require('../config/db');
// Import the global settings variables storage functions
const { getAiThreshold, setAiThreshold } = require('../ml/settingsStore');

// Updates the global AI compliance trigger threshold setting
async function updateAiThreshold(threshold) {
  // Validate that the threshold parameter is provided
  if (!threshold) {
    const error = new Error('Missing threshold value.');
    error.statusCode = 400;
    throw error;
  }
  // Save the new value in the local config store
  const value = setAiThreshold(threshold);
  console.log(`[SETTINGS] AI confidence threshold updated to: ${value}%`);
  return { status: 'success', threshold: value };
}

// Retrieves the active global AI compliance threshold setting
function getAiThresholdSetting() {
  return { threshold: getAiThreshold() };
}

// Resets and runs database seeders again for testing purposes
async function resetDatabase() {
  // Force initializeDatabase with clean tables (dropping existing ones)
  await initializeDatabase(true);
  return { status: 'success', message: 'Database wiped and reset to seed states.' };
}

// Export the settings service module functions
module.exports = { updateAiThreshold, getAiThresholdSetting, resetDatabase };
