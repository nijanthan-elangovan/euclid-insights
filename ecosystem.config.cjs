module.exports = {
  apps: [
    {
      name: 'euclid-insights',
      script: './dist/server/entry.mjs',
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
