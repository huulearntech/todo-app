import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsInt, IsString, validateSync } from 'class-validator';
import { Type } from 'class-transformer';

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
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    config,
    { enableImplicitConversion: true } // Automatically converts strings to numbers/booleans
  );
  
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
