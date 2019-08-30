import * as actions from '@/store/tasks/actions';

describe('updateTask', () => {
  test('returns TaskUpdated', () => {
    const expected = { type: 'TASK_UPDATE', payload: {} };

    expect(actions.updateTask({})).toEqual(expected);
  });
});
