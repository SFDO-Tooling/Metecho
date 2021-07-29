import * as actions from '@/js/store/socket/actions';

describe('connectSocket', () => {
  test('returns SocketConnected', () => {
    const expected = { type: 'SOCKET_CONNECTED' };

    expect(actions.connectSocket()).toEqual(expected);
  });
});

describe('disconnectSocket', () => {
  test('returns SocketDisconnected', () => {
    const expected = { type: 'SOCKET_DISCONNECTED' };

    expect(actions.disconnectSocket()).toEqual(expected);
  });
});
