// PM2 process config — run with: pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "truck-driver-jobs",
      script: "./node_modules/.bin/tsx",
      args: "server/index.ts",
      cwd: "/var/www/truck-driver-jobs",

      // Environment
      env: {
        NODE_ENV: "production",
        PORT: "3001",
      },

      // Reliability
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",

      // Logs (view with: pm2 logs truck-driver-jobs)
      error_file: "/var/log/pm2/tdj-error.log",
      out_file: "/var/log/pm2/tdj-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true,
    },
  ],
};
