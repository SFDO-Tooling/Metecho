import { TASK_STATUSES } from '~js/utils/constants';
import * as helpers from '~js/utils/helpers';

describe('pluralize', () => {
  test.each([
    [0, 'test', 'tests'],
    [1, 'test', 'test'],
    [2, 'test', 'tests'],
  ])('returns pluralized version: %i %s', (count, input, expected) => {
    expect(helpers.pluralize(count, input)).toEqual(expected);
  });
});

describe('getBranchLink', () => {
  test.each([
    [
      { pr_url: 'pr', pr_is_open: true },
      { branchLink: 'pr', branchLinkText: 'View Pull Request' },
    ],
    [
      {
        pr_url: 'pr',
        pr_is_open: false,
        status: TASK_STATUSES.COMPLETED,
      },
      { branchLink: 'pr', branchLinkText: 'View Pull Request' },
    ],
    [
      {
        pr_url: 'pr',
        pr_is_open: false,
        status: TASK_STATUSES.CANCELED,
        has_unmerged_commits: true,
        branch_diff_url: 'diff',
      },
      { branchLink: 'diff', branchLinkText: 'View Changes' },
    ],
    [
      { has_unmerged_commits: true, branch_diff_url: 'diff' },
      { branchLink: 'diff', branchLinkText: 'View Changes' },
    ],
    [
      { branch_url: 'branch' },
      { branchLink: 'branch', branchLinkText: 'View Branch' },
    ],
    [{}, { branchLink: undefined, branchLinkText: undefined }],
  ])(
    'returns branchLink and branchLinkText for input: %o',
    (input, expected) => {
      expect(helpers.getBranchLink(input)).toEqual(expected);
    },
  );
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
