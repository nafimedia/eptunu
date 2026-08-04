module.exports = {
  apps: [
    {
      name: 'eptunu-api',
      script: './apps/api/dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3005,
        HOST: '0.0.0.0'
      }
    },
    {
      name: 'eptunu-web',
      script: './apps/web/build/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOST: '0.0.0.0'
      }
    }
  ]
};
