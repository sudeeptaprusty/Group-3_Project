// In-memory global variable holding the threshold for suspicious transactions (starts at 95.0%)
let aiThreshold = 95.0;

// Getter function returning the current threshold state
function getAiThreshold() {
  return aiThreshold;
}

// Setter function parsing and saving a updated threshold value
function setAiThreshold(threshold) {
  aiThreshold = parseFloat(threshold);
  return aiThreshold;
}

// Export the setting get/set configurations
module.exports = { getAiThreshold, setAiThreshold };
