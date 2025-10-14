const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable minification in production
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    compress: {
      drop_console: true, // Remove console.* calls
      pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific functions
    },
    mangle: {
      keep_fnames: false, // Mangle function names for smaller bundle
    },
    output: {
      comments: false, // Remove comments
      ascii_only: true, // Better compatibility
    },
  },
  // Enable hermes bytecode for faster startup
  hermesParser: true,
};

// Optimize resolver
config.resolver = {
  ...config.resolver,
  // Asset extensions for better bundling
  assetExts: [
    ...config.resolver.assetExts.filter((ext) => ext !== 'svg'),
    'db',
    'mp3',
    'ttf',
    'obj',
    'png',
    'jpg',
  ],
  sourceExts: [...config.resolver.sourceExts, 'svg'],
};

// Enable caching for faster rebuilds
config.cacheStores = [
  ...(config.cacheStores || []),
];

module.exports = config;
