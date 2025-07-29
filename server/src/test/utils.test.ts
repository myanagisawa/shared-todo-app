import { describe, it, expect } from '@jest/globals';

// Sample utility function tests
describe('Utility Functions', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle string operations', () => {
    const result = 'hello world'.toUpperCase();
    expect(result).toBe('HELLO WORLD');
  });

  it('should work with arrays', () => {
    const numbers = [1, 2, 3, 4, 5];
    const sum = numbers.reduce((acc, num) => acc + num, 0);
    expect(sum).toBe(15);
  });
});