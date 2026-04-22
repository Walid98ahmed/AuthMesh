export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  auth: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'change-me-access-secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  services: {
    userServiceBaseUrl: process.env.USER_SERVICE_BASE_URL ?? 'http://localhost:3002',
  },
});
