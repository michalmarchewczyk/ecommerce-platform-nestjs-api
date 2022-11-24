import * as Joi from 'joi';

export const schema = Joi.object({
  PORT: Joi.number().default(3000),
  POSTGRES_HOST: Joi.string().default('postgres'),
  POSTGRES_PORT: Joi.number().default(5432),
  POSTGRES_USER: Joi.string().default('postgres'),
  POSTGRES_PASSWORD: Joi.string().default('postgres'),
  POSTGRES_DB: Joi.string().default('ecommerce-platform'),
  SESSION_SECRET: Joi.string().default('secret'),
  REDIS_HOST: Joi.string().default('redis'),
  REDIS_PORT: Joi.number().default(6379),
  UPLOAD_PATH: Joi.string().default('./uploads'),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  ADMIN_EMAIL: Joi.string().required(),
  ADMIN_PASSWORD: Joi.string().required(),
});
