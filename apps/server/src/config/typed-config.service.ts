import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from './env.validation';

@Injectable()
export class TypedConfigService {
  // Pass 'true' as the second generic to enforce strict layout checks
  constructor(private configService: ConfigService<EnvironmentVariables, true>) {}

  /**
   * Gets a configuration variable securely.
   * Guaranteed to match the type in EnvironmentVariables and never return undefined.
   */
  get<K extends keyof EnvironmentVariables>(key: K): EnvironmentVariables[K] {
    // The '!' tells TypeScript we guarantee this value exists due to our startup validation
    return this.configService.get(key, { infer: true })!;
  }
}