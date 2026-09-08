const profiles = require('./advertising.config.json');
module.exports = ({ config }) => {
  const profile = process.env.LEDPOP_AD_PROFILE ?? 'production';
  if (!Object.hasOwn(profiles, profile)) throw new Error('Invalid LEDPOP_AD_PROFILE');
  const buildProfile = process.env.EAS_BUILD_PROFILE;
  if (buildProfile === 'production' && profile !== 'production') throw new Error('Store builds require production ads');
  if (process.env.EAS_BUILD_PLATFORM && process.env.EXPO_PUBLIC_WEB_AD_DIAGNOSTICS === '1') throw new Error('Web diagnostics cannot be used in native builds');
  const ids = profiles[profile];
  for (const platform of ['android', 'ios']) {
    const entry = ids[platform];
    const publisher = profile === 'test' ? 'ca-app-pub-3940256099942544' : 'ca-app-pub-3506417530430977';
    if (entry.platform !== platform || !entry.appId.startsWith(publisher + '~') ||
        !entry.banner.startsWith(publisher + '/') || !entry.rewarded.startsWith(publisher + '/')) {
      throw new Error('Advertising profile/platform configuration mismatch: ' + platform);
    }
  }
  if (config.plugins.filter(p => Array.isArray(p) && p[0] === 'react-native-google-mobile-ads').length !== 1) throw new Error('Expected one AdMob config plugin');
  const plugins = config.plugins.map(p => Array.isArray(p) && p[0] === 'react-native-google-mobile-ads'
    ? [p[0], { ...p[1], androidAppId: ids.android.appId, iosAppId: ids.ios.appId }] : p);
  return { ...config, plugins, extra: { ...config.extra, advertising: { profile, ...ids } } };
};
