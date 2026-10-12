import { getSafeRedirectUrl } from '@todo/shared';

describe('getSafeRedirectUrl', () => {
  it('should return valid relative paths unchanged', () => {
    expect(getSafeRedirectUrl('/tasks')).toBe('/tasks');
    expect(getSafeRedirectUrl('/projects/123')).toBe('/projects/123');
    expect(getSafeRedirectUrl('/tasks?status=pending#details')).toBe(
      '/tasks?status=pending#details',
    );
  });

  it('should return fallback for falsy or empty inputs', () => {
    expect(getSafeRedirectUrl(null)).toBe('/');
    expect(getSafeRedirectUrl(undefined)).toBe('/');
    expect(getSafeRedirectUrl('')).toBe('/');
    expect(getSafeRedirectUrl(null, '/custom')).toBe('/custom');
  });

  it('should reject scheme-relative protocol urls (//)', () => {
    expect(getSafeRedirectUrl('//evil.com')).toBe('/');
    expect(getSafeRedirectUrl('//evil.com/path')).toBe('/');
  });

  it('should reject backslash evasion attacks (/\\)', () => {
    expect(getSafeRedirectUrl('/\\evil.com')).toBe('/');
    expect(getSafeRedirectUrl('/\\evil.com/path')).toBe('/');
    expect(getSafeRedirectUrl('\\evil.com')).toBe('/');
  });

  it('should reject URL-encoded backslashes (/%5c)', () => {
    expect(getSafeRedirectUrl('/%5cevil.com')).toBe('/');
    expect(getSafeRedirectUrl('/%5Cevil.com')).toBe('/');
  });

  it('should reject absolute URLs with external schemes', () => {
    expect(getSafeRedirectUrl('http://evil.com')).toBe('/');
    expect(getSafeRedirectUrl('https://evil.com')).toBe('/');
    expect(getSafeRedirectUrl('javascript:alert(1)')).toBe('/');
    expect(getSafeRedirectUrl('data:text/html,evil')).toBe('/');
  });

  it('should safely allow paths with http in pathname without protocol', () => {
    expect(getSafeRedirectUrl('/http://example.com')).toBe('/http://example.com');
  });
});
