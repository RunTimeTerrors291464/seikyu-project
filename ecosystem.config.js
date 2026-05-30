module.exports = {
  apps: [
    {
      name: 'seikyu-v2',
      script: 'dist/src/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
