import * as helpers from '@/utils/helpers';

describe('pluralize', () => {
  test.each([
    [0, 'test', 'tests'],
    [1, 'test', 'test'],
    [2, 'test', 'tests'],
  ])('returns pluralized version: %i %s', (count, input, expected) => {
    expect(helpers.pluralize(count, input)).toEqual(expected);
  });
});
