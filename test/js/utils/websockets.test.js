import Sockette from 'sockette';

import { fetchObjects } from '@/store/actions';
import {
  commitFailed,
  commitSucceeded,
  deleteFailed,
  deleteOrg,
  provisionFailed,
  provisionOrg,
  updateOrg,
} from '@/store/orgs/actions';
import { updateProject } from '@/store/projects/actions';
import { connectSocket, disconnectSocket } from '@/store/socket/actions';
import { updateTask } from '@/store/tasks/actions';
import * as sockets from '@/utils/websockets';

jest.mock('@/store/actions');
jest.mock('@/store/orgs/actions');
jest.mock('@/store/projects/actions');
jest.mock('@/store/tasks/actions');

const actions = {
  commitFailed,
  commitSucceeded,
  deleteFailed,
  deleteOrg,
  fetchObjects,
  provisionOrg,
  provisionFailed,
  updateOrg,
  updateProject,
  updateTask,
};
for (const action of Object.values(actions)) {
  action.mockReturnValue({ type: 'TEST', payload: {} });
}

const mockJson = jest.fn();
const mockClose = jest.fn();
const mockOpen = jest.fn();
const dispatch = jest.fn();
jest.mock('sockette', () =>
  jest.fn().mockImplementation(() => ({
    json: mockJson,
    close: mockClose,
    open: mockOpen,
  })),
);

const opts = { url: '/my/url', dispatch };

afterEach(() => {
  Sockette.mockClear();
  mockJson.mockClear();
  mockClose.mockClear();
  mockOpen.mockClear();
  dispatch.mockClear();
  for (const action of Object.values(actions)) {
    action.mockClear();
  }
});

describe('getAction', () => {
  test.each([
    ['PROJECT_UPDATE', 'updateProject'],
    ['TASK_UPDATE', 'updateTask'],
    ['SCRATCH_ORG_PROVISION', 'provisionOrg'],
    ['SCRATCH_ORG_PROVISION_FAILED', 'provisionFailed'],
    ['SCRATCH_ORG_DELETE', 'deleteOrg'],
    ['SCRATCH_ORG_DELETE_FAILED', 'deleteFailed'],
    ['SCRATCH_ORG_UPDATE', 'updateOrg'],
    ['COMMIT_CREATE', 'commitSucceeded'],
    ['COMMIT_FAILED', 'commitFailed'],
  ])('handles %s event', (type, action) => {
    const payload = { foo: 'bar' };
    const msg = { type, payload };
    sockets.getAction(msg);

    // eslint-disable-next-line import/namespace
    expect(actions[action]).toHaveBeenCalledWith(payload);
  });

  describe('USER_REPOS_REFRESH', () => {
    test('fetches repositories', () => {
      const event = { type: 'USER_REPOS_REFRESH' };
      sockets.getAction(event);

      expect(fetchObjects).toHaveBeenCalledTimes(1);
      expect(fetchObjects).toHaveBeenCalledWith({
        objectType: 'repository',
        reset: true,
      });
    });
  });

  test('handles unknown event', () => {
    const event = { type: 'UNKNOWN' };
    const expected = null;
    const actual = sockets.getAction(event);

    expect(actual).toEqual(expected);
  });

  test('handles unknown event without type', () => {
    const event = { foo: 'bar' };
    const expected = null;
    const actual = sockets.getAction(event);

    expect(actual).toEqual(expected);
  });
});

describe('createSocket', () => {
  test('creates socket with url', () => {
    sockets.createSocket(opts);

    expect(Sockette).toHaveBeenCalledTimes(1);
    expect(Sockette.mock.calls[0][0]).toEqual('/my/url');
  });

  describe('events', () => {
    let socket, socketInstance;

    beforeEach(() => {
      socket = sockets.createSocket(opts);
      socketInstance = Sockette.mock.calls[0][1];
    });

    describe('onopen', () => {
      test('logs', () => {
        socketInstance.onopen();

        expect(window.console.info).toHaveBeenCalledWith(
          '[WebSocket] connected',
        );
      });

      test('subscribes/unsubscribes to/from pending objects', () => {
        const payload = { model: 'foo', id: 'bar' };
        socket.subscribe(payload);
        socket.unsubscribe(payload);
        socketInstance.onopen();

        expect(mockJson).toHaveBeenCalledTimes(2);
        expect(mockJson).toHaveBeenCalledWith({
          ...payload,
          action: 'SUBSCRIBE',
        });
        expect(mockJson).toHaveBeenCalledWith({
          ...payload,
          action: 'UNSUBSCRIBE',
        });
      });

      test('dispatches connectSocket action', () => {
        socketInstance.onopen();
        const expected = connectSocket();

        expect(dispatch).toHaveBeenCalledWith(expected);
      });
    });

    describe('after reconnect', () => {
      test('logs', () => {
        socketInstance.onreconnect();
        socketInstance.onreconnect();
        socketInstance.onopen();

        expect(window.console.info).toHaveBeenCalledWith(
          '[WebSocket] reconnected',
        );
      });
    });

    describe('onmessage', () => {
      test('logs', () => {
        socketInstance.onmessage({});

        expect(window.console.info).toHaveBeenCalledWith(
          '[WebSocket] received:',
          undefined,
        );
      });

      test('dispatches action', () => {
        socketInstance.onmessage({
          data: { type: 'SCRATCH_ORG_PROVISION', payload: {} },
        });

        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(actions.provisionOrg).toHaveBeenCalledWith({});
      });
    });

    describe('onreconnect', () => {
      test('logs', () => {
        socketInstance.onreconnect();

        expect(window.console.info).toHaveBeenCalledWith(
          '[WebSocket] attempting to reconnect…',
        );
      });
    });

    describe('onmaximum', () => {
      test('logs', () => {
        socketInstance.onmaximum();

        expect(window.console.info).toHaveBeenCalledWith(
          '[WebSocket] ending reconnect after Infinity attempts',
        );
      });
    });

    describe('onclose', () => {
      test('logs', () => {
        socketInstance.onclose();

        expect(window.console.info).toHaveBeenCalledWith('[WebSocket] closed');
      });

      test('dispatches disconnectSocket action after 5 seconds', () => {
        jest.useFakeTimers();
        socketInstance.onopen();
        socketInstance.onclose();

        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 5000);

        jest.runAllTimers();
        const expected = disconnectSocket();

        expect(dispatch).toHaveBeenCalledWith(expected);

        setTimeout.mockClear();
        socketInstance.onclose();

        expect(setTimeout).not.toHaveBeenCalled();
      });

      test('does not dispatch disconnectSocket action if reconnected', () => {
        jest.useFakeTimers();
        socketInstance.onopen();
        socketInstance.onclose();
        socketInstance.onopen();
        jest.runAllTimers();
        const expected = disconnectSocket();

        expect(dispatch).not.toHaveBeenCalledWith(expected);
      });
    });

    describe('onerror', () => {
      test('logs', () => {
        socketInstance.onerror();

        expect(window.console.info).toHaveBeenCalledWith('[WebSocket] error');
      });
    });
  });

  describe('subscribe', () => {
    let socket;

    beforeEach(() => {
      socket = sockets.createSocket(opts);
    });

    describe('ws open', () => {
      test('subscribes to object', () => {
        const payload = { model: 'foo', id: 'bar' };
        Sockette.mock.calls[0][1].onopen();
        socket.subscribe(payload);

        expect(mockJson).toHaveBeenCalledWith({
          ...payload,
          action: 'SUBSCRIBE',
        });
      });
    });
  });

  describe('unsubscribe', () => {
    let socket;

    beforeEach(() => {
      socket = sockets.createSocket(opts);
    });

    describe('ws open', () => {
      test('unsubscribes from object', () => {
        const payload = { model: 'foo', id: 'bar' };
        Sockette.mock.calls[0][1].onopen();
        socket.unsubscribe(payload);

        expect(mockJson).toHaveBeenCalledWith({
          ...payload,
          action: 'UNSUBSCRIBE',
        });
      });
    });
  });

  describe('reconnect', () => {
    let socket;

    beforeEach(() => {
      socket = sockets.createSocket(opts);
      jest.useFakeTimers();
    });

    test('closes and reopens ws connection', () => {
      Sockette.mock.calls[0][1].onopen();
      mockOpen.mockClear();
      socket.reconnect();

      expect(mockClose).toHaveBeenCalledWith(1000, 'user logged out');
      expect(mockOpen).not.toHaveBeenCalled();

      jest.advanceTimersByTime(750);

      expect(mockOpen).not.toHaveBeenCalled();

      Sockette.mock.calls[0][1].onclose();
      jest.advanceTimersByTime(500);

      expect(mockOpen).toHaveBeenCalledTimes(1);
    });
  });
});
