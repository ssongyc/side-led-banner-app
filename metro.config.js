// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const path = require('path');
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const native = platform === 'android' || platform === 'ios';
  if (native && process.env.EXPO_PUBLIC_WEB_AD_DIAGNOSTICS === '1') throw new Error('Web ad diagnostics are forbidden in native bundles');
  const resolved = context.resolveRequest(context, moduleName, platform);
  if (native && resolved.type === 'sourceFile') {
    const relative = path.relative(__dirname, resolved.filePath).replace(/\\/g, '/');
    if (!relative.startsWith('../') && !relative.startsWith('node_modules/') && /\.web\.[jt]sx?$/.test(relative)) {
      throw new Error('Web-only source resolved in native bundle: ' + relative);
    }
  }
  return resolved;
};
module.exports = config;
