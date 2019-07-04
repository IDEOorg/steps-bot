module.exports = {
  apps: [
    {
      name: 'steps-bot',
      cwd: './',
      kill_timeout: 3000,
      restart_delay: 3000,
      script: 'npm',
      args: 'run start',
      instances: 1,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],

  deploy: {
    production: {
      user: 'node',
      host: '212.83.163.1',
      ref: 'origin/master',
      repo: 'IDEOorg@github.com:steps-bot.git',
      path: '/var/www/production',
      'post-deploy':
        'npm install && pm2 reload ecosystem.config.js --env production',
    },
  },
};
