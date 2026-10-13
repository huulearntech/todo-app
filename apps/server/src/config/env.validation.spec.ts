import 'reflect-metadata';
import { validate } from './env.validation';

describe('Environment Validation (Fail-Fast)', () => {
  const baseValidConfig = {
    NODE_ENV: 'development',
    PORT: '4000',
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/todo_app',
    FRONTEND_URL: 'http://localhost:3000',
    JWT_SECRET: 'access_secret',
    JWT_SECRET_EXPIRATION_SECONDS: '900',
    JWT_REFRESH_SECRET: 'refresh_secret',
    JWT_REFRESH_SECRET_EXPIRATION_SECONDS: '604800',
    CLOUDINARY_CLOUD_NAME: 'test_cloud',
    CLOUDINARY_API_KEY: '123456789',
    CLOUDINARY_API_SECRET: 'secret',
    REDIS_HOST: 'localhost',
    REDIS_PORT: '6379',
  };

  it('successfully validates complete and correct environment config', () => {
    const validated = validate(baseValidConfig);
    expect(validated.PORT).toBe(4000);
    expect(validated.FRONTEND_URL).toBe('http://localhost:3000');
    expect(validated.JWT_SECRET_EXPIRATION_SECONDS).toBe(900);
    expect(validated.REDIS_HOST).toBe('localhost');
    expect(validated.REDIS_PORT).toBe(6379);
  });

  it('fails fast when FRONTEND_URL is missing', () => {
    const configWithoutFrontend = { ...baseValidConfig };
    delete (configWithoutFrontend as Record<string, unknown>).FRONTEND_URL;

    expect(() => validate(configWithoutFrontend)).toThrow();
  });

  it('fails fast when FRONTEND_URL is not a valid URL', () => {
    const configWithInvalidUrl = {
      ...baseValidConfig,
      FRONTEND_URL: 'not-a-valid-url',
    };

    expect(() => validate(configWithInvalidUrl)).toThrow();
  });

  it('fails fast when PORT is missing', () => {
    const configWithoutPort = { ...baseValidConfig };
    delete (configWithoutPort as Record<string, unknown>).PORT;

    expect(() => validate(configWithoutPort)).toThrow();
  });

  it('fails fast when DATABASE_URL is missing', () => {
    const configWithoutDb = { ...baseValidConfig };
    delete (configWithoutDb as Record<string, unknown>).DATABASE_URL;

    expect(() => validate(configWithoutDb)).toThrow();
  });

  it('fails fast when REDIS_HOST is missing', () => {
    const configWithoutRedisHost = { ...baseValidConfig };
    delete (configWithoutRedisHost as Record<string, unknown>).REDIS_HOST;

    expect(() => validate(configWithoutRedisHost)).toThrow();
  });

  it('fails fast when REDIS_PORT is missing', () => {
    const configWithoutRedisPort = { ...baseValidConfig };
    delete (configWithoutRedisPort as Record<string, unknown>).REDIS_PORT;

    expect(() => validate(configWithoutRedisPort)).toThrow();
  });

  it('normalizes empty or whitespace REDIS_PASSWORD to undefined', () => {
    const configWithEmptyPass = {
      ...baseValidConfig,
      REDIS_PASSWORD: '',
    };
    const validatedEmpty = validate(configWithEmptyPass);
    expect(validatedEmpty.REDIS_PASSWORD).toBeUndefined();

    const configWithBlankPass = {
      ...baseValidConfig,
      REDIS_PASSWORD: '   ',
    };
    const validatedBlank = validate(configWithBlankPass);
    expect(validatedBlank.REDIS_PASSWORD).toBeUndefined();
  });

  it('preserves valid non-empty REDIS_PASSWORD', () => {
    const configWithPass = {
      ...baseValidConfig,
      REDIS_PASSWORD: 'redis-super-secret',
    };
    const validated = validate(configWithPass);
    expect(validated.REDIS_PASSWORD).toBe('redis-super-secret');
  });
});
