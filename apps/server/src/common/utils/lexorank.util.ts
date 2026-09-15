export class Lexorank {
  private static readonly MIN_CHAR = 'a'.charCodeAt(0);
  private static readonly MAX_CHAR = 'z'.charCodeAt(0);

  /**
   * Generates a string strictly between `prev` and `next`.
   * Pass empty string ('') if there is no boundary.
   */
  static getMidpoint(prev: string, next: string): string {
    const p = prev || String.fromCharCode(this.MIN_CHAR);
    const n = next || String.fromCharCode(this.MAX_CHAR + 1);

    let result = '';
    let i = 0;

    while (true) {
      const pChar = p.charCodeAt(i) || this.MIN_CHAR;
      const nChar = n.charCodeAt(i) || (this.MAX_CHAR + 1);

      if (pChar === nChar) {
        result += String.fromCharCode(pChar);
        i++;
        continue;
      }

      if (nChar - pChar > 1) {
        const midChar = Math.floor((pChar + nChar) / 2);
        result += String.fromCharCode(midChar);
        break;
      } else {
        // Gap is only 1 (e.g., 'a' and 'b'). Move to the next character depth.
        result += String.fromCharCode(pChar);
        i++;
        // If prev ran out of characters, next char is effectively the minimum
        const nextPChar = p.charCodeAt(i) || this.MIN_CHAR;
        if (this.MAX_CHAR - nextPChar > 1) {
          const midChar = Math.floor((nextPChar + this.MAX_CHAR + 1) / 2);
          result += String.fromCharCode(midChar);
          break;
        }
      }
    }
    return result;
  }
}
