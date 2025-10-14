module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Remove console logs in production for better performance
      ...(process.env.NODE_ENV === 'production'
        ? [
            [
              'transform-remove-console',
              {
                exclude: ['error', 'warn'],
              },
            ],
          ]
        : []),
    ],
  };
};
