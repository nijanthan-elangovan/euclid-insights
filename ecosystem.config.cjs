module.exports = {
  apps: [
    {
      name: 'euclid-insights',
      script: './dist/server/entry.mjs',
      node_args: '--env-file=.env',
      env: {
        HOST: '0.0.0.0',
        PORT: 4321,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
    },
  ],
};
