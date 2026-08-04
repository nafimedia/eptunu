const { fork } = require('child_process');
const path = require('path');

console.log('🚀 Starting EPTUNU Monorepo Production Server in aaPanel Node Manager...');

const apiScript = path.join(__dirname, 'apps/api/dist/index.js');
const webScript = path.join(__dirname, 'apps/web/build/index.js');

let webPort = process.env.PORT || process.env.WEB_PORT || '3001';
let apiPort = process.env.API_PORT || '3002';

// Ensure Web and API never collide on the same port
if (apiPort === webPort) {
  apiPort = (parseInt(webPort, 10) + 1).toString();
}

console.log(`🌐 Web Frontend target port: ${webPort}`);
console.log(`📡 API Backend target port: ${apiPort}`);

// 1. Launch Fastify API Backend (Port 3002)
const apiProcess = fork(apiScript, [], {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: apiPort,
    HOST: '0.0.0.0'
  }
});

// 2. Launch SvelteKit Web Frontend (Port 3001)
const webProcess = fork(webScript, [], {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: webPort,
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
