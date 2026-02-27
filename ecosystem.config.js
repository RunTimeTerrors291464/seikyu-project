require('dotenv').config();

const getMaxThreads = (serviceName) => {
  const envKey = `${serviceName.toUpperCase()}_MAX_THREADS`;
  const maxThreads = process.env[envKey];
  return maxThreads ? parseInt(maxThreads, 10) : 4;
};

module.exports = {
  apps: [
    {
      name: 'platform',
      script: './dist/apps/platform/main.js',
      instances: getMaxThreads('platform'),
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: './logs/platform-error.log',
      out_file: './logs/platform-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'api-gateway',
      script: './dist/apps/api-gateway/main.js',
      instances: getMaxThreads('api_gateway'),
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/gateway-error.log',
      out_file: './logs/gateway-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'invoices',
      script: './dist/apps/invoices/main.js',
      instances: getMaxThreads('invoices'),
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
      error_file: './logs/invoices-error.log',
      out_file: './logs/invoices-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
