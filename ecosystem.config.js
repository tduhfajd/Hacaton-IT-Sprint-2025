module.exports = {
  apps: [
    {
      name: 'user-frontend',
      cwd: '/home/macadamm/it-support/frontend/user',
      script: 'npm',
      args: 'run preview -- --host 0.0.0.0 --port 3000',
      env: {
        NODE_ENV: 'production',
        VITE_API_URL: 'https://api-smartsupport.vadimevgrafov.ru',
        VITE_WS_URL: 'wss://api-smartsupport.vadimevgrafov.ru'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },
    {
      name: 'operator-frontend',
      cwd: '/home/macadamm/it-support/frontend/operator',
      script: 'npm',
      args: 'run preview -- --host 0.0.0.0 --port 3003',
      env: {
        NODE_ENV: 'production',
        VITE_API_URL: 'https://api-smartsupport.vadimevgrafov.ru',
        VITE_WS_URL: 'wss://api-smartsupport.vadimevgrafov.ru'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },
    {
      name: 'admin-frontend',
      cwd: '/home/macadamm/it-support/frontend/admin',
      script: 'npm',
      args: 'run preview -- --host 0.0.0.0 --port 3004',
      env: {
        NODE_ENV: 'production',
        VITE_API_URL: 'https://api-smartsupport.vadimevgrafov.ru',
        VITE_WS_URL: 'wss://api-smartsupport.vadimevgrafov.ru'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    }
  ]
};

