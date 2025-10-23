// // Simple script to run the web app without import.meta issues
// const { spawn } = require('child_process');
// const path = require('path');

// // Set environment variables to disable problematic features
// process.env.EXPO_WEB_BUNDLE_ANALYZER = 'false';
// process.env.EXPO_WEB_OPTIMIZE_BUNDLE = 'false';

// // Start the Expo server
// const expo = spawn('npx', ['expo', 'start', '--web', '--clear'], {
//   stdio: 'inherit',
//   shell: true,
//   cwd: __dirname
// });

// expo.on('error', (err) => {
//   console.error('Failed to start Expo:', err);
// });

// expo.on('close', (code) => {
//   console.log(`Expo process exited with code ${code}`);
// });
