import { expect, test } from '@jest/globals';
import { handleEvents } from '../app/index.js';
import { isAllowedUser } from '../utils/index.js';
import { createEvents, MOCK_USER_01, MOCK_USER_02 } from './utils.js';

test('isAllowedUser', () => {
  expect(isAllowedUser(MOCK_USER_01, [])).toEqual(true);
  expect(isAllowedUser(MOCK_USER_01, [MOCK_USER_01])).toEqual(true);
  expect(isAllowedUser(MOCK_USER_02, [MOCK_USER_01])).toEqual(false);
});

test('APP_ALLOWED_USER_IDS is empty by default', async () => {
  const results = await handleEvents([
    ...createEvents(['嗨！'], undefined, MOCK_USER_02),
  ]);
  expect(results.length).toEqual(1);
});
