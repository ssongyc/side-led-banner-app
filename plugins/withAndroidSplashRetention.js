const { withMainActivity } = require('expo/config-plugins');
const withSplashScreen = require('expo-splash-screen/app.plugin.js').default;

// Retain the native surface before React's first content event. JS readiness
// remains the sole release owner; no timer or second splash is introduced.
module.exports = function withAndroidSplashRetention(config, options) {
  config = withMainActivity(config, mod => {
    if (mod.modResults.language !== 'kt') {
      throw new Error('Review splash retention for a non-Kotlin Activity.');
    }
    const anchor = 'SplashScreenManager.registerOnActivity(this)';
    const contents = mod.modResults.contents.replace(
      /^\s*SplashScreenManager\.preventAutoHideCalled = true\r?\n/gm, '');
    const creation = contents.indexOf('super.onCreate(null)');
    if (creation < 0 || contents.split(anchor).length !== 2 ||
        contents.indexOf(anchor) > creation) {
      throw new Error('Splash registration must occur once before super.onCreate.');
    }
    mod.modResults.contents = contents.replace(anchor,
      'SplashScreenManager.preventAutoHideCalled = true\n    ' + anchor);
    return mod;
  });
  // Expo mods execute last-registered first: retain the official setup and options.
  return withSplashScreen(config, options);
};
