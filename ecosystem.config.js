module.exports = {
  apps: [
    {
      name: 'naxtap-api',
      script: 'backend/hono.ts',
      interpreter: 'node',
      interpreter_args: '--loader ts-node/esm',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0',
      },
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
    },
    {
      name: 'naxtap-web',
      script: 'serve',
      args: '-s dist -l 3001',
      instances: 1,
      env: {
        NODE_ENV: 'production',
      },
      watch: false,
      max_memory_restart: '512M',
      error_file: './logs/web-err.log',
      out_file: './logs/web-out.log',
      log_file: './logs/web-combined.log',
      time: true,
    }
  ],
};
