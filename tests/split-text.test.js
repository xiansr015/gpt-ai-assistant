import { expect, test } from '@jest/globals';
import { splitText } from '../utils/index.js';

test('splitText', () => {
  expect(splitText('abc', 5)).toEqual(['abc']);
  expect(splitText('abcdef', 3)).toEqual(['abc', 'def']);
  expect(splitText('abcdefg', 3)).toEqual(['abc', 'def', 'g']);
  expect(splitText('a😀b', 2)).toEqual(['a', '😀', 'b']);
  expect(splitText('', 3)).toEqual([]);
});
