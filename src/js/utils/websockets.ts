import { ThunkDispatch } from 'redux-thunk';
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
import { Org } from '@/store/orgs/reducer';
import {
  createProjectPR,
  createProjectPRFailed,
  updateProject,
} from '@/store/projects/actions';
import { Project } from '@/store/projects/reducer';
import {
  repoError,
  reposRefreshed,
  updateRepo,
} from '@/store/repositories/actions';
import { Repository } from '@/store/repositories/reducer';
import { connectSocket, disconnectSocket } from '@/store/socket/actions';
import {
  createTaskPR,
  createTaskPRFailed,
  submitReview,
  submitReviewFailed,
  updateTask,
} from '@/store/tasks/actions';
import { Task } from '@/store/tasks/reducer';
import {
  ObjectTypes,
  WEBSOCKET_ACTIONS,
  WebsocketActions,
} from '@/utils/constants';
import { log } from '@/utils/logging';

export interface Socket {
  subscribe: (payload: Subscription) => void;
  unsubscribe: (payload: Subscription) => void;
  reconnect: () => void;
}

interface Subscription {
  action?: WebsocketActions;
  model: ObjectTypes;
  id: string;
}

interface SubscriptionEvent {
  ok?: string;
  error?: string;
}
interface ErrorEvent {
  type: 'BACKEND_ERROR';
  payload: { message: string };
}
interface ReposRefreshedEvent {
  type: 'USER_REPOS_REFRESH';
}
interface RepoUpdatedEvent {
  type: 'REPOSITORY_UPDATE';
  payload: Repository;
}
interface RepoUpdateErrorEvent {
  type: 'REPOSITORY_UPDATE_ERROR';
  payload: {
    message?: string;
    model: Repository;
    originating_user_id: string;
  };
}
interface ProjectUpdatedEvent {
  type: 'PROJECT_UPDATE';
  payload: Project;
}
interface ProjectCreatePREvent {
  type: 'PROJECT_CREATE_PR';
  payload: {
    model: Project;
    originating_user_id: string;
  };
}
interface ProjectCreatePRFailedEvent {
  type: 'PROJECT_CREATE_PR_FAILED';
  payload: {
    message?: string;
    model: Project;
    originating_user_id: string;
  };
}
interface TaskUpdatedEvent {
  type: 'TASK_UPDATE';
  payload: Task;
}
interface TaskCreatePREvent {
  type: 'TASK_CREATE_PR';
  payload: {
    model: Task;
    originating_user_id: string;
  };
}
interface TaskCreatePRFailedEvent {
  type: 'TASK_CREATE_PR_FAILED';
  payload: {
    message?: string;
    model: Task;
    originating_user_id: string;
  };
}
interface TaskSubmitReviewEvent {
  type: 'TASK_SUBMIT_REVIEW';
  payload: {
    model: Task;
    originating_user_id: string;
  };
}
interface TaskSubmitReviewFailedEvent {
  type: 'TASK_SUBMIT_REVIEW_FAILED';
  payload: {
    message?: string;
    model: Task;
    originating_user_id: string;
  };
}
interface OrgProvisionedEvent {
  type: 'SCRATCH_ORG_PROVISION';
  payload: Org;
}
interface OrgProvisionFailedEvent {
  type: 'SCRATCH_ORG_PROVISION_FAILED';
  payload: {
    message?: string;
    model: Org;
  };
}
interface OrgUpdatedEvent {
  type: 'SCRATCH_ORG_UPDATE';
  payload: Org;
}
interface OrgUpdateFailedEvent {
  type: 'SCRATCH_ORG_FETCH_CHANGES_FAILED';
  payload: {
    message?: string;
    model: Org;
  };
}
interface OrgDeletedEvent {
  type: 'SCRATCH_ORG_DELETE';
  payload: Org;
}
interface OrgDeleteFailedEvent {
  type: 'SCRATCH_ORG_DELETE_FAILED';
  payload: {
    message?: string;
    model: Org;
  };
}
interface OrgRemovedEvent {
  type: 'SCRATCH_ORG_REMOVE';
  payload: {
    message?: string;
    model: Org;
  };
}
interface OrgRefreshedEvent {
  type: 'SCRATCH_ORG_REFRESH';
  payload: Org;
}
interface OrgRefreshFailedEvent {
  type: 'SCRATCH_ORG_REFRESH_FAILED';
  payload: {
    message?: string;
    model: Org;
  };
}
interface CommitSucceededEvent {
  type: 'SCRATCH_ORG_COMMIT_CHANGES';
  payload: Org;
}
interface CommitFailedEvent {
  type: 'SCRATCH_ORG_COMMIT_CHANGES_FAILED';
  payload: {
    message?: string;
    model: Org;
  };
}
type ModelEvent =
  | ErrorEvent
  | ReposRefreshedEvent
  | RepoUpdatedEvent
  | RepoUpdateErrorEvent
  | ProjectUpdatedEvent
  | ProjectCreatePREvent
  | ProjectCreatePRFailedEvent
  | TaskUpdatedEvent
  | TaskCreatePREvent
  | TaskCreatePRFailedEvent
  | TaskSubmitReviewEvent
  | TaskSubmitReviewFailedEvent
  | OrgProvisionedEvent
  | OrgProvisionFailedEvent
  | OrgUpdatedEvent
  | OrgUpdateFailedEvent
  | OrgDeletedEvent
  | OrgDeleteFailedEvent
  | OrgRemovedEvent
  | OrgRefreshedEvent
  | OrgRefreshFailedEvent
  | CommitSucceededEvent
  | CommitFailedEvent;
type EventType = SubscriptionEvent | ModelEvent;

const isSubscriptionEvent = (event: EventType): event is SubscriptionEvent =>
  (event as ModelEvent).type === undefined;

export const getAction = (event: EventType) => {
  if (!event || isSubscriptionEvent(event)) {
    return null;
  }
  switch (event.type) {
    case 'USER_REPOS_REFRESH':
      return reposRefreshed();
    case 'PROJECT_UPDATE':
      return updateProject(event.payload);
    case 'PROJECT_CREATE_PR':
      return createProjectPR(event.payload);
    case 'PROJECT_CREATE_PR_FAILED':
      return createProjectPRFailed(event.payload);
    case 'REPOSITORY_UPDATE':
      return updateRepo(event.payload);
    case 'REPOSITORY_UPDATE_ERROR':
      return repoError(event.payload);
    case 'TASK_UPDATE':
      return updateTask(event.payload);
    case 'TASK_CREATE_PR':
      return createTaskPR(event.payload);
    case 'TASK_CREATE_PR_FAILED':
      return createTaskPRFailed(event.payload);
    case 'TASK_SUBMIT_REVIEW':
      return submitReview(event.payload);
    case 'TASK_SUBMIT_REVIEW_FAILED':
      return submitReviewFailed(event.payload);
    case 'SCRATCH_ORG_PROVISION':
      return provisionOrg(event.payload);
    case 'SCRATCH_ORG_PROVISION_FAILED':
      return provisionFailed(event.payload);
    case 'SCRATCH_ORG_UPDATE':
      return updateOrg(event.payload);
    case 'SCRATCH_ORG_FETCH_CHANGES_FAILED':
      return updateFailed(event.payload);
    case 'SCRATCH_ORG_DELETE':
      return deleteOrg({ org: event.payload });
    case 'SCRATCH_ORG_REMOVE':
      return deleteOrg({
        org: event.payload.model,
        message: event.payload.message,
      });
    case 'SCRATCH_ORG_DELETE_FAILED':
      return deleteFailed(event.payload);
    case 'SCRATCH_ORG_REFRESH':
      return orgRefreshed(event.payload);
    case 'SCRATCH_ORG_REFRESH_FAILED':
      return refreshError(event.payload);
    case 'SCRATCH_ORG_COMMIT_CHANGES':
      return commitSucceeded(event.payload);
    case 'SCRATCH_ORG_COMMIT_CHANGES_FAILED':
      return commitFailed(event.payload);
  }
  return null;
};

export const createSocket = ({
  url,
  options = {},
  dispatch,
}: {
  url: string;
  options?: { [key: string]: any };
  dispatch: ThunkDispatch<any, any, any>;
}): Socket | null => {
  /* istanbul ignore if */
  if (!(url && dispatch)) {
    return null;
  }
  const defaults = {
    timeout: 1000,
    maxAttempts: Infinity,
    /* eslint-disable @typescript-eslint/no-unused-vars */
    onopen: (e?: Event) => {},
    onmessage: (e?: Event) => {},
    onreconnect: (e?: Event) => {},
    onmaximum: (e?: Event) => {},
    onclose: (e?: Event) => {},
    onerror: (e?: Event) => {},
    /* eslint-enable @typescript-eslint/no-unused-vars */
  };
  const opts = { ...defaults, ...options };

  let open = false;
  let lostConnection = false;
  const pending = new Set();

  const socket = new Sockette(url, {
    timeout: opts.timeout,
    maxAttempts: opts.maxAttempts,
    onopen: (e) => {
      dispatch(connectSocket());
      open = true;
      for (const payload of pending) {
        log('[WebSocket] subscribing to:', payload);
        socket.json(payload);
      }
      pending.clear();
      if (lostConnection) {
        lostConnection = false;
        log('[WebSocket] reconnected');
        opts.onreconnect(e);
      } else {
        log('[WebSocket] connected');
        opts.onopen(e);
      }
    },
    onmessage: (e) => {
      let data = e.data;
      try {
        data = JSON.parse(e.data);
      } catch (err) {
        // swallow error
      }
      log('[WebSocket] received:', data);
      const action = getAction(data);
      if (action) {
        dispatch(action);
      }
      opts.onmessage(e);
    },
    onreconnect: () => {
      log('[WebSocket] attempting to reconnect…');
      if (!lostConnection) {
        lostConnection = true;
      }
    },
    onmaximum: (e) => {
      log(`[WebSocket] ending reconnect after ${opts.maxAttempts} attempts`);
      opts.onmaximum(e);
    },
    onclose: (e) => {
      log('[WebSocket] closed');
      if (open) {
        open = false;
        setTimeout(() => {
          if (!open) {
            dispatch(disconnectSocket());
          }
        }, 5000);
      }
      opts.onclose(e);
    },
    onerror: (e) => {
      log('[WebSocket] error');
      opts.onerror(e);
    },
  });

  const subscribe = (payload: Subscription) => {
    payload = { ...payload, action: WEBSOCKET_ACTIONS.SUBSCRIBE };
    if (open) {
      log('[WebSocket] subscribing to:', payload);
      socket.json(payload);
    } else {
      pending.add(payload);
    }
  };

  const unsubscribe = (payload: Subscription) => {
    payload = { ...payload, action: WEBSOCKET_ACTIONS.UNSUBSCRIBE };
    if (open) {
      log('[WebSocket] unsubscribing from:', payload);
      socket.json(payload);
    } else {
      pending.add(payload);
    }
  };

  let reconnecting: NodeJS.Timeout | undefined;
  const clearReconnect = () => {
    /* istanbul ignore else */
    if (reconnecting) {
      clearInterval(reconnecting);
      reconnecting = undefined;
    }
  };

  const reconnect = () => {
    socket.close(1000, 'user logged out');
    // Without polling, the `onopen` callback after reconnect could fire before
    // the `onclose` callback...
    reconnecting = setInterval(() => {
      if (!open) {
        socket.open();
        clearReconnect();
      }
    }, 500);
  };

  return {
    subscribe,
    unsubscribe,
    reconnect,
  };
};
