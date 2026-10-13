import { Lexorank } from './lexorank.util';

describe('Lexorank', () => {
  describe('getMidpoint', () => {
    it('returns a midpoint between two distinct characters', () => {
      const mid = Lexorank.getMidpoint('a', 'c');
      expect(mid).toBe('b');
      expect('a' < mid && mid < 'c').toBe(true);
    });

    it('returns a midpoint when gap is 1 by descending to next character', () => {
      const mid = Lexorank.getMidpoint('a', 'b');
      expect('a' < mid && mid < 'b').toBe(true);
      expect(mid.startsWith('a')).toBe(true);
    });

    it('returns a midpoint when prev is empty (insert at beginning)', () => {
      const mid = Lexorank.getMidpoint('', 'm');
      expect(mid < 'm').toBe(true);
      expect(mid > '').toBe(true);
    });

    it('returns a midpoint when next is empty (append at end)', () => {
      const mid = Lexorank.getMidpoint('m', '');
      expect(mid > 'm').toBe(true);
    });

    it('maintains strict alphabetical order for multiple consecutive midpoints', () => {
      let first = 'a';
      const second = 'z';
      for (let i = 0; i < 5; i++) {
        const mid = Lexorank.getMidpoint(first, second);
        expect(first < mid && mid < second).toBe(true);
        first = mid;
      }
    });
  });
});
