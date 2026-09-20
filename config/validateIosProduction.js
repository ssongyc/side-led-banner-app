// Invoked exclusively by the iOS production branch of app.config.js.
// Android does not evaluate this file; keep iOS-only validation separate.
module.exports = function validateIosProduction() {
  const analyticsKey = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY?.trim();
  if (!analyticsKey || analyticsKey === 'your_amplitude_api_key_here') {
    throw new Error('iOS production requires EXPO_PUBLIC_AMPLITUDE_API_KEY in the EAS production environment');
  }
};
