const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow .cjs files (for Firebase/AsyncStorage compatibility)
config.resolver.assetExts.push('cjs');

// Prevent Metro from trying to resolve package.json "exports" field
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
