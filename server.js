const { fork } = require('child_process');
const path = require('path');

console.log('🚀 Starting EPTUNU Monorepo Production Server in aaPanel Node Manager...');

const apiScript = path.join(__dirname, 'apps/api/dist/index.js');
const webScript = path.join(__dirname, 'apps/web/build/index.js');

// 1. Launch Fastify API Backend (Port 3001)
const apiProcess = fork(apiScript, [], {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: process.env.API_PORT || '3001',
    HOST: '0.0.0.0'
  }
});

// 2. Launch SvelteKit Web Frontend (Port 5173)
const webProcess = fork(webScript, [], {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: process.env.PORT || process.env.WEB_PORT || '5173',
    HOST: '0.0.0.0'
  }
});

apiProcess.on('error', (err) => console.error('❌ Fastify API Error:', err));
webProcess.on('error', (err) => console.error('❌ SvelteKit Web Error:', err));

process.on('SIGINT', () => {
  apiProcess.kill();
  webProcess.kill();
  process.exit();
});

process.on('SIGTERM', () => {
  apiProcess.kill();
  webProcess.kill();
  process.exit();
});
