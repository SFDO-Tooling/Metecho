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

describe('splitChangeset', () => {
  test('removes members of one changeset from another', () => {
    const changeset1 = {
      foo: [1, 2],
      bar: [3, 4],
    };
    const changeset2 = {
      foo: [1],
      bar: [3, 4],
      buz: [5],
    };
    const { remaining, removed } = helpers.splitChangeset(
      changeset1,
      changeset2,
    );

    expect(remaining).toEqual({ foo: [2] });
    expect(removed).toEqual({ foo: [1], bar: [3, 4] });
  });

  test('works if changesets have no overlap', () => {
    const changeset1 = {
      foo: [1, 2],
      bar: [3, 4],
    };
    const changeset2 = {
      foo: [5],
    };
    const { remaining, removed } = helpers.splitChangeset(
      changeset1,
      changeset2,
    );

    expect(remaining).toEqual(changeset1);
    expect(removed).toEqual({});
  });
});

describe('mergeChangesets', () => {
  test('adds members of one changeset to another', () => {
    const changeset1 = {
      foo: [1, 2],
      bar: [3, 4],
    };
    const changeset2 = {
      foo: [1],
      bar: [3, 4],
      buz: [5],
    };
    const actual = helpers.mergeChangesets(changeset1, changeset2);
    const expected = {
      foo: [1, 2],
      bar: [3, 4],
      buz: [5],
    };

    expect(actual).toEqual(expected);
  });
});
