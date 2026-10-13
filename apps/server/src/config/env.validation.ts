import { plainToInstance, Type, Transform } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsInt,
  IsString,
  IsUrl,
  IsOptional,
  MinLength,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV!: Environment;

  @Type(() => Number)
  @IsNumber()
  PORT!: number;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  JWT_SECRET!: string;

  @Type(() => Number)
  @IsInt()
  JWT_SECRET_EXPIRATION_SECONDS!: number;

  @IsString()
  JWT_REFRESH_SECRET!: string;

  @Type(() => Number)
  @IsInt()
  JWT_REFRESH_SECRET_EXPIRATION_SECONDS!: number;

  @IsString()
  CLOUDINARY_CLOUD_NAME!: string;

  @IsString()
  CLOUDINARY_API_KEY!: string;

  @IsString()
  CLOUDINARY_API_SECRET!: string;

  @IsString()
  REDIS_HOST!: string;

  @Type(() => Number)
  @IsInt()
  REDIS_PORT!: number;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed === '' ? undefined : trimmed;
    }
    return value;
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  REDIS_PASSWORD?: string;

  @IsOptional()
  @IsString()
  MAIL_HOST?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  MAIL_PORT?: number;

  @IsOptional()
  @IsString()
  MAIL_USER?: string;

  @IsOptional()
  @IsString()
  MAIL_PASS?: string;

  @IsOptional()
  @IsString()
  MAIL_FROM?: string;

  @IsString()
  @IsUrl({ require_tld: false, require_protocol: true })
  FRONTEND_URL!: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    config,
    { enableImplicitConversion: true }, // Automatically converts strings to numbers/booleans
  );

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
