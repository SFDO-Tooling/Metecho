import * as actions from '@/store/projects/actions';

describe('updateProject', () => {
  test('returns ProjectUpdated', () => {
    const expected = { type: 'PROJECT_UPDATE', payload: {} };

    expect(actions.updateProject({})).toEqual(expected);
  });
});
