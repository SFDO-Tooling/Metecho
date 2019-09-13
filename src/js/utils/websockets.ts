import { ThunkDispatch } from 'redux-thunk';
import Sockette from 'sockette';

import {
  addChangeset,
  changesetFailed,
  commitFailed,
  commitSucceeded,
  deleteFailed,
  deleteOrg,
  provisionFailed,
  provisionOrg,
  updateOrg,
} from '@/store/orgs/actions';
import { Changeset, Commit, Org } from '@/store/orgs/reducer';
import { updateProject } from '@/store/projects/actions';
import { Project } from '@/store/projects/reducer';
import { connectSocket, disconnectSocket } from '@/store/socket/actions';
import { updateTask } from '@/store/tasks/actions';
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
interface OrgProvisionedEvent {
  type: 'SCRATCH_ORG_PROVISIONED';
  payload: Org;
}
interface OrgProvisionFailedEvent {
  type: 'SCRATCH_ORG_PROVISION_FAILED';
  payload: {
    message?: string;
    model: Org;
  };
}
interface ChangesetSucceededEvent {
  type: 'CHANGESET_SUCCEEDED';
  payload: Changeset;
}
interface ChangesetFailedEvent {
  type: 'CHANGESET_FAILED';
  payload: {
    message?: string;
    model: Changeset;
  };
}
interface CommitSucceededEvent {
  type: 'COMMIT_SUCCEEDED';
  payload: Commit;
}
interface CommitFailedEvent {
  type: 'COMMIT_FAILED';
  payload: {
    message?: string;
    model: Commit;
  };
}
interface OrgDeletedEvent {
  type: 'SCRATCH_ORG_DELETED';
  payload: Org;
}
interface OrgDeleteFailedEvent {
  type: 'SCRATCH_ORG_DELETE_FAILED';
  payload: {
    message?: string;
    model: Org;
  };
}
interface ProjectUpdatedEvent {
  type: 'PROJECT_UPDATE';
  payload: Project;
}
interface TaskUpdatedEvent {
  type: 'TASK_UPDATE';
  payload: Task;
}
interface OrgUpdatedEvent {
  type: 'SCRATCH_ORG_UPDATED';
  payload: Org;
}
type ModelEvent =
  | ErrorEvent
  | OrgProvisionedEvent
  | OrgProvisionFailedEvent
  | ChangesetSucceededEvent
  | ChangesetFailedEvent
  | CommitSucceededEvent
  | CommitFailedEvent
  | OrgDeletedEvent
  | OrgDeleteFailedEvent
  | ProjectUpdatedEvent
  | TaskUpdatedEvent
  | OrgUpdatedEvent;
type EventType = SubscriptionEvent | ModelEvent;

const isSubscriptionEvent = (event: EventType): event is SubscriptionEvent =>
  (event as ModelEvent).type === undefined;

export const getAction = (event: EventType) => {
  if (!event || isSubscriptionEvent(event)) {
    return null;
  }
  switch (event.type) {
    case 'SCRATCH_ORG_PROVISIONED':
      return provisionOrg(event.payload);
    case 'SCRATCH_ORG_PROVISION_FAILED':
      return provisionFailed(event.payload);
    case 'CHANGESET_SUCCEEDED':
      return addChangeset(event.payload);
    case 'CHANGESET_FAILED':
      return changesetFailed(event.payload);
    case 'COMMIT_SUCCEEDED':
      return commitSucceeded(event.payload);
    case 'COMMIT_FAILED':
      return commitFailed(event.payload);
    case 'SCRATCH_ORG_DELETED':
      return deleteOrg(event.payload);
    case 'SCRATCH_ORG_DELETE_FAILED':
      return deleteFailed(event.payload);
    case 'PROJECT_UPDATE':
      return updateProject(event.payload);
    case 'TASK_UPDATE':
      return updateTask(event.payload);
    case 'SCRATCH_ORG_UPDATED':
      return updateOrg(event.payload);
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
    onopen: e => {
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
    onmessage: e => {
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
    onmaximum: e => {
      log(`[WebSocket] ending reconnect after ${opts.maxAttempts} attempts`);
      opts.onmaximum(e);
    },
    onclose: e => {
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
    onerror: e => {
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
