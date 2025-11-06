// Lightweight ts-node runner for the backend without ESM loader hassles
const path = require('path');
require('ts-node').register({
  transpileOnly: true,
  project: path.join(__dirname, 'tsnode.json')
});
require('dotenv').config();
require('./server.ts');
