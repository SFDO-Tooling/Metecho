import reducer from '@/js/store/user/reducer';

describe('reducer', () => {
  test('returns initial state', () => {
    const expected = null;
    const actual = reducer(undefined, {});

    expect(actual).toEqual(expected);
  });

  test('handles USER_LOGGED_IN action', () => {
    const initial = null;
    const expected = { username: 'Test User' };
    const actual = reducer(initial, {
      type: 'USER_LOGGED_IN',
      payload: expected,
    });

    expect(actual).toEqual(expected);
  });

  test('handles USER_LOGGED_OUT action', () => {
    const initial = { username: 'Test User' };
    const expected = null;
    const actual = reducer(initial, { type: 'USER_LOGGED_OUT' });

    expect(actual).toEqual(expected);
  });

  test('handles PROJECTS_REFRESHED action', () => {
    const initial = { id: 'id', currently_fetching_repos: true };
    const expected = { id: 'id', currently_fetching_repos: false };
    const actual = reducer(initial, { type: 'PROJECTS_REFRESHED' });

    expect(actual).toEqual(expected);
  });

  test('handles PROJECTS_REFRESHED action [no user]', () => {
    const initial = null;
    const expected = null;
    const actual = reducer(initial, { type: 'PROJECTS_REFRESHED' });

    expect(actual).toEqual(expected);
  });

  test('handles REFRESH_ORGS_REQUESTED action', () => {
    const initial = { id: 'id', currently_fetching_orgs: false };
    const expected = { id: 'id', currently_fetching_orgs: true };
    const actual = reducer(initial, { type: 'REFRESH_ORGS_REQUESTED' });

    expect(actual).toEqual(expected);
  });

  test('handles REFRESH_ORGS_REQUESTED action [no user]', () => {
    const initial = null;
    const expected = null;
    const actual = reducer(initial, { type: 'REFRESH_ORGS_REQUESTED' });

    expect(actual).toEqual(expected);
  });

  test('handles REFRESH_ORGS_REJECTED action', () => {
    const initial = { id: 'id', currently_fetching_orgs: true };
    const expected = { id: 'id', currently_fetching_orgs: false };
    const actual = reducer(initial, { type: 'REFRESH_ORGS_REJECTED' });

    expect(actual).toEqual(expected);
  });

  test('handles REFRESH_ORGS_REJECTED action [no user]', () => {
    const initial = null;
    const expected = null;
    const actual = reducer(initial, { type: 'REFRESH_ORGS_REJECTED' });

    expect(actual).toEqual(expected);
  });
});
