export default () => ({
  port: parseInt(process.env.PORT ?? '3002', 10),
  jwt: {
    secret: process.env.JWT_ACCESS_SECRET ?? 'change-me-access-secret',
  },
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    name: process.env.DB_NAME ?? 'praxion',
    synchronize: (process.env.DB_SYNCHRONIZE ?? 'true') === 'true',
  },
  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL,
    adminPassword: process.env.SEED_ADMIN_PASSWORD,
  },
});
