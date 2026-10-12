import { escapeHtml } from './escape-html';

describe('escapeHtml', () => {
  it('should escape dangerous HTML characters', () => {
    const malicious = '<script>alert("xss")</script> & \'evil\'';
    expect(escapeHtml(malicious)).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &#39;evil&#39;',
    );
  });

  it('should handle null or undefined safely', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml('')).toBe('');
  });

  it('should leave safe text unchanged', () => {
    expect(escapeHtml('Hello World 123')).toBe('Hello World 123');
  });
});
