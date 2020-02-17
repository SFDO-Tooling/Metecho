import Sockette from 'sockette';

import {
  commitFailed,
  commitSucceeded,
  deleteFailed,
  deleteOrg,
  orgRefreshed,
  provisionFailed,
  provisionOrg,
  refreshError,
  updateFailed,
  updateOrg,
} from '@/store/orgs/actions';
import {
  createProjectPR,
  createProjectPRFailed,
  updateProject,
} from '@/store/projects/actions';
import {
  repoError,
  reposRefreshed,
  updateRepo,
} from '@/store/repositories/actions';
import { connectSocket, disconnectSocket } from '@/store/socket/actions';
import {
  createTaskPR,
  createTaskPRFailed,
  updateTask,
} from '@/store/tasks/actions';
import * as sockets from '@/utils/websockets';

jest.mock('@/store/orgs/actions');
jest.mock('@/store/projects/actions');
jest.mock('@/store/repositories/actions');
jest.mock('@/store/tasks/actions');

const actions = {
  commitFailed,
  commitSucceeded,
  createProjectPR,
  createProjectPRFailed,
  createTaskPR,
  createTaskPRFailed,
  deleteFailed,
  deleteOrg,
  orgRefreshed,
  provisionFailed,
  provisionOrg,
  refreshError,
  repoError,
  reposRefreshed,
  updateFailed,
  updateOrg,
  updateProject,
  updateRepo,
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
    ['REPOSITORY_UPDATE', 'updateRepo'],
    ['REPOSITORY_UPDATE_ERROR', 'repoError'],
    ['PROJECT_UPDATE', 'updateProject'],
    ['PROJECT_CREATE_PR', 'createProjectPR'],
    ['PROJECT_CREATE_PR_FAILED', 'createProjectPRFailed'],
    ['TASK_UPDATE', 'updateTask'],
    ['TASK_CREATE_PR', 'createTaskPR'],
    ['TASK_CREATE_PR_FAILED', 'createTaskPRFailed'],
    ['SCRATCH_ORG_PROVISION', 'provisionOrg'],
    ['SCRATCH_ORG_PROVISION_FAILED', 'provisionFailed'],
    ['SCRATCH_ORG_DELETE_FAILED', 'deleteFailed'],
    ['SCRATCH_ORG_UPDATE', 'updateOrg'],
    ['SCRATCH_ORG_FETCH_CHANGES_FAILED', 'updateFailed'],
    ['SCRATCH_ORG_COMMIT_CHANGES', 'commitSucceeded'],
    ['SCRATCH_ORG_COMMIT_CHANGES_FAILED', 'commitFailed'],
    ['SCRATCH_ORG_REFRESH', 'orgRefreshed'],
    ['SCRATCH_ORG_REFRESH_FAILED', 'refreshError'],
  ])('handles %s event', (type, action) => {
    const payload = { foo: 'bar' };
    const msg = { type, payload };
    sockets.getAction(msg);

    // eslint-disable-next-line import/namespace
    expect(actions[action]).toHaveBeenCalledWith(payload);
  });

  describe('USER_REPOS_REFRESH', () => {
    test('calls reposRefreshed', () => {
      const event = { type: 'USER_REPOS_REFRESH' };
      sockets.getAction(event);

      expect(reposRefreshed).toHaveBeenCalledTimes(1);
    });
  });

  describe('SCRATCH_ORG_DELETE', () => {
    test('calls deleteOrg', () => {
      const payload = { foo: 'bar' };
      const event = { type: 'SCRATCH_ORG_DELETE', payload };
      sockets.getAction(event);

      expect(deleteOrg).toHaveBeenCalledWith({ org: payload });
    });
  });

  describe('SCRATCH_ORG_REMOVE', () => {
    test('calls deleteOrg', () => {
      const model = { foo: 'bar' };
      const message = 'Error things.';
      const event = { type: 'SCRATCH_ORG_REMOVE', payload: { model, message } };
      sockets.getAction(event);

      expect(deleteOrg).toHaveBeenCalledWith({ org: model, message });
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
