import * as actions from '@/store/orgs/actions';

describe('provisionOrg', () => {
  beforeEach(() => {
    window.socket = { unsubscribe: jest.fn() };
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'socket');
  });

  test('unsubscribes from socket and returns action', () => {
    const org = { id: 'org-id' };
    const actual = actions.provisionOrg(org);

    expect(window.socket.unsubscribe).toHaveBeenCalledWith({
      model: 'scratch_org',
      id: 'org-id',
    });
    expect(actual).toEqual({ type: 'SCRATCH_ORG_PROVISIONED', payload: org });
  });
});

describe('provisionFailed', () => {
  beforeEach(() => {
    window.socket = { unsubscribe: jest.fn() };
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'socket');
  });

  test('unsubscribes from socket and returns action', () => {
    const org = { id: 'org-id' };
    const actual = actions.provisionFailed(org);

    expect(window.socket.unsubscribe).toHaveBeenCalledWith({
      model: 'scratch_org',
      id: 'org-id',
    });
    expect(actual).toEqual({
      type: 'SCRATCH_ORG_PROVISION_FAILED',
      payload: org,
    });
  });
});
