import Sockette from 'sockette';

import { removeObject } from '@/js/store/actions';
import {
  createEpic,
  createEpicPR,
  createEpicPRFailed,
  updateEpic,
} from '@/js/store/epics/actions';
import {
  commitFailed,
  commitSucceeded,
  datasetsRefreshed,
  deleteFailed,
  deleteOrg,
  fetchFailed,
  orgConvertFailed,
  orgProvisioning,
  orgReassigned,
  orgReassignFailed,
  orgRefreshed,
  provisionFailed,
  provisionOrg,
  recreateOrg,
  refreshError,
  updateOrg,
} from '@/js/store/orgs/actions';
import {
  projectCreated,
  projectCreateError,
  projectError,
  projectsRefreshed,
  projectsRefreshError,
  updateProject,
} from '@/js/store/projects/actions';
import { connectSocket, disconnectSocket } from '@/js/store/socket/actions';
import {
  createTask,
  createTaskPR,
  createTaskPRFailed,
  submitReview,
  submitReviewFailed,
  updateTask,
} from '@/js/store/tasks/actions';
import { orgsRefreshError, refreshUser } from '@/js/store/user/actions';
import * as sockets from '@/js/utils/websockets';

jest.mock('@/js/store/actions');
jest.mock('@/js/store/orgs/actions');
jest.mock('@/js/store/epics/actions');
jest.mock('@/js/store/projects/actions');
jest.mock('@/js/store/tasks/actions');
jest.mock('@/js/store/user/actions');

const actions = {
  commitFailed,
  commitSucceeded,
  createEpic,
  createEpicPR,
  createEpicPRFailed,
  createTask,
  createTaskPR,
  createTaskPRFailed,
  datasetsRefreshed,
  deleteFailed,
  deleteOrg,
  orgConvertFailed,
  orgProvisioning,
  orgReassignFailed,
  orgReassigned,
  orgRefreshed,
  orgsRefreshError,
  projectCreateError,
  projectCreated,
  projectError,
  projectsRefreshError,
  projectsRefreshed,
  provisionFailed,
  provisionOrg,
  recreateOrg,
  refreshError,
  refreshUser,
  removeObject,
  submitReview,
  submitReviewFailed,
  updateEpic,
  fetchFailed,
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
    ['PROJECT_UPDATE', 'updateProject', true],
    ['PROJECT_CREATE', 'projectCreated', false],
    ['PROJECT_CREATE_ERROR', 'projectCreateError', false],
    ['EPIC_CREATE', 'createEpic', true],
    ['EPIC_UPDATE', 'updateEpic', true],
    ['EPIC_CREATE_PR', 'createEpicPR', false],
    ['EPIC_CREATE_PR_FAILED', 'createEpicPRFailed', false],
    ['TASK_CREATE', 'createTask', true],
    ['TASK_UPDATE', 'updateTask', true],
    ['TASK_CREATE_PR', 'createTaskPR', false],
    ['TASK_CREATE_PR_FAILED', 'createTaskPRFailed', false],
    ['TASK_SUBMIT_REVIEW', 'submitReview', false],
    ['TASK_SUBMIT_REVIEW_FAILED', 'submitReviewFailed', false],
    ['SCRATCH_ORG_PROVISIONING', 'orgProvisioning', true],
    ['SCRATCH_ORG_PROVISION', 'provisionOrg', false],
    ['SCRATCH_ORG_PROVISION_FAILED', 'provisionFailed', false],
    ['SCRATCH_ORG_UPDATE', 'updateOrg', true],
    ['SCRATCH_ORG_FETCH_CHANGES_FAILED', 'fetchFailed', false],
    ['SCRATCH_ORG_DELETE', 'deleteOrg', false],
    ['SCRATCH_ORG_REMOVE', 'deleteOrg', false],
    ['SCRATCH_ORG_DELETE_FAILED', 'deleteFailed', false],
    ['SCRATCH_ORG_REFRESH', 'orgRefreshed', false],
    ['SCRATCH_ORG_REFRESH_FAILED', 'refreshError', false],
    ['SCRATCH_ORG_RECREATE', 'recreateOrg', true],
    ['SCRATCH_ORG_REASSIGN', 'orgReassigned', true],
    ['SCRATCH_ORG_REASSIGN_FAILED', 'orgReassignFailed', false],
    ['SCRATCH_ORG_CONVERT_FAILED', 'orgConvertFailed', false],
    ['SOFT_DELETE', 'removeObject', true],
    ['SCRATCH_ORG_PARSE_DATASETS', 'datasetsRefreshed', false],
    ['SCRATCH_ORG_PARSE_DATASETS_FAILED', 'datasetsRefreshed', false],
  ])('handles %s event', (type, action, modelOnly) => {
    const payload = { model: 'bar' };
    const msg = { type, payload };
    const expected = modelOnly ? 'bar' : payload;
    sockets.getAction(msg);

    expect(actions[action]).toHaveBeenCalledWith(expected);
  });

  describe('USER_REPOS_REFRESH', () => {
    test('calls projectsRefreshed', () => {
      const event = { type: 'USER_REPOS_REFRESH' };
      sockets.getAction(event);

      expect(projectsRefreshed).toHaveBeenCalledTimes(1);
    });
  });

  describe('USER_REPOS_ERROR', () => {
    test('calls projectsRefreshError', () => {
      const event = { type: 'USER_REPOS_ERROR', payload: { message: 'foo' } };
      sockets.getAction(event);

      expect(projectsRefreshError).toHaveBeenCalledWith('foo');
    });
  });

  describe('USER_ORGS_REFRESH', () => {
    test('calls refreshUser', () => {
      const event = { type: 'USER_ORGS_REFRESH' };
      sockets.getAction(event);

      expect(refreshUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('USER_ORGS_REFRESH_ERROR', () => {
    test('calls orgsRefreshError', () => {
      const event = {
        type: 'USER_ORGS_REFRESH_ERROR',
        payload: { message: 'foo' },
      };
      sockets.getAction(event);

      expect(orgsRefreshError).toHaveBeenCalledWith('foo');
    });
  });

  describe('REFRESH_GH_USERS_ERROR', () => {
    test('calls projectError', () => {
      const event = {
        type: 'REFRESH_GH_USERS_ERROR',
        payload: { model: { name: 'Test Name' } },
      };
      sockets.getAction(event);

      expect(projectError).toHaveBeenCalledTimes(1);
    });
  });

  describe('REFRESH_GH_ISSUES_ERROR', () => {
    test('calls projectError', () => {
      const event = {
        type: 'REFRESH_GH_ISSUES_ERROR',
        payload: { model: { name: 'Test Name' } },
      };
      sockets.getAction(event);

      expect(projectError).toHaveBeenCalledTimes(1);
    });
  });

  describe('SCRATCH_ORG_COMMIT_CHANGES', () => {
    test('calls commitSucceeded', () => {
      const payload = { model: 'bar' };
      const msg = { type: 'SCRATCH_ORG_COMMIT_CHANGES', payload };
      sockets.getAction(msg);

      expect(commitSucceeded).toHaveBeenCalledWith(payload, {
        is_metadata: true,
      });
    });
  });

  describe('SCRATCH_ORG_COMMIT_CHANGES_FAILED', () => {
    test('calls commitFailed', () => {
      const payload = { model: 'bar' };
      const msg = { type: 'SCRATCH_ORG_COMMIT_CHANGES_FAILED', payload };
      sockets.getAction(msg);

      expect(commitFailed).toHaveBeenCalledWith(payload, { is_metadata: true });
    });
  });

  describe('SCRATCH_ORG_COMMIT_DATASET', () => {
    test('calls commitSucceeded', () => {
      const payload = { model: 'bar' };
      const msg = { type: 'SCRATCH_ORG_COMMIT_DATASET', payload };
      sockets.getAction(msg);

      expect(commitSucceeded).toHaveBeenCalledWith(payload, {
        is_metadata: false,
      });
    });
  });

  describe('SCRATCH_ORG_COMMIT_DATASET_FAILED', () => {
    test('calls commitFailed', () => {
      const payload = { model: 'bar' };
      const msg = { type: 'SCRATCH_ORG_COMMIT_DATASET_FAILED', payload };
      sockets.getAction(msg);

      expect(commitFailed).toHaveBeenCalledWith(payload, {
        is_metadata: false,
      });
    });
  });

  describe('SCRATCH_ORG_COMMIT_OMNISTUDIO', () => {
    test('calls commitSucceeded', () => {
      const payload = { model: 'bar' };
      const msg = { type: 'SCRATCH_ORG_COMMIT_OMNISTUDIO', payload };
      sockets.getAction(msg);

      expect(commitSucceeded).toHaveBeenCalledWith(payload, {
        is_metadata: true,
      });
    });
  });

  describe('SCRATCH_ORG_COMMIT_OMNISTUDIO_FAILED', () => {
    test('calls commitFailed', () => {
      const payload = { model: 'bar' };
      const msg = { type: 'SCRATCH_ORG_COMMIT_OMNISTUDIO_FAILED', payload };
      sockets.getAction(msg);

      expect(commitFailed).toHaveBeenCalledWith(payload, {
        is_metadata: true,
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
    expect(Sockette.mock.calls[0][0]).toBe('/my/url');
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
        const payload = { model: {} };
        socketInstance.onmessage({
          data: { type: 'SCRATCH_ORG_PROVISION', payload },
        });

        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(actions.provisionOrg).toHaveBeenCalledWith(payload);
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
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      test('logs', () => {
        socketInstance.onclose();

        expect(window.console.info).toHaveBeenCalledWith('[WebSocket] closed');
      });

      test('dispatches disconnectSocket action after 5 seconds', () => {
        jest.spyOn(window, 'setTimeout');
        socketInstance.onopen();
        socketInstance.onclose();

        expect(window.setTimeout).toHaveBeenCalledWith(
          expect.any(Function),
          5000,
        );

        jest.runAllTimers();
        const expected = disconnectSocket();

        expect(dispatch).toHaveBeenCalledWith(expected);

        window.setTimeout.mockClear();
        socketInstance.onclose();

        expect(window.setTimeout).not.toHaveBeenCalled();
      });

      test('does not dispatch disconnectSocket action if reconnected', () => {
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
      jest.useFakeTimers();
      socket = sockets.createSocket(opts);
    });

    afterEach(() => {
      jest.useRealTimers();
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
