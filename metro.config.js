const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// This line helps prevent 'import.meta' errors on native
config.resolver.sourceExts.push('mjs'); 

module.exports = config;