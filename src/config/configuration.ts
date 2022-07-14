export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  postgres: {
    host: process.env.POSTGRES_HOST || 'postgres',
    port: parseInt(process.env.POSTGRES_PORT) || 5432,
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database:
      process.env.POSTGRES_DB +
        (process.env.NODE_ENV === 'test' ? '-test' : '') ||
      'ecommerce-platform',
  },
  session: {
    secret: process.env.SESSION_SECRET || 'secret',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT) || 6379,
  },
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  nodeEnv: process.env.NODE_ENV || 'development',
});
