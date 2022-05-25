import { t } from 'i18next';
import { ThunkDispatch } from 'redux-thunk';
import Sockette from 'sockette';

import { removeObject } from '@/js/store/actions';
import {
  createEpic,
  createEpicPR,
  createEpicPRFailed,
  updateEpic,
} from '@/js/store/epics/actions';
import { Epic } from '@/js/store/epics/reducer';
import {
  commitFailed,
  commitSucceeded,
  deleteFailed,
  deleteOrg,
  orgConvertFailed,
  orgProvisioning,
  orgReassigned,
  orgReassignFailed,
  orgRefreshed,
  provisionFailed,
  provisionOrg,
  recreateOrg,
  refreshError,
  updateFailed,
  updateOrg,
} from '@/js/store/orgs/actions';
import { MinimalOrg, Org } from '@/js/store/orgs/reducer';
import {
  projectCreated,
  projectCreateError,
  projectError,
  projectsRefreshed,
  projectsRefreshError,
  updateProject,
} from '@/js/store/projects/actions';
import { Project } from '@/js/store/projects/reducer';
import { connectSocket, disconnectSocket } from '@/js/store/socket/actions';
import {
  createTask,
  createTaskPR,
  createTaskPRFailed,
  submitReview,
  submitReviewFailed,
  updateTask,
} from '@/js/store/tasks/actions';
import { Task } from '@/js/store/tasks/reducer';
import { orgsRefreshError, refreshUser } from '@/js/store/user/actions';
import {
  ObjectTypes,
  WEBSOCKET_ACTIONS,
  WebsocketActions,
} from '@/js/utils/constants';
import { log } from '@/js/utils/logging';

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
interface ReposRefreshErrorEvent {
  type: 'USER_REPOS_ERROR';
  payload: {
    message?: string;
  };
}
interface OrgsRefreshedEvent {
  type: 'USER_ORGS_REFRESH';
}
interface OrgsRefreshErrorEvent {
  type: 'USER_ORGS_REFRESH_ERROR';
  payload: {
    message?: string;
  };
}
interface ProjectUpdatedEvent {
  type: 'PROJECT_UPDATE' | 'PROJECT_CREATE';
  payload: {
    model: Project;
    originating_user_id: string | null;
  };
}
interface ProjectUpdateErrorEvent {
  type:
    | 'PROJECT_UPDATE_ERROR'
    | 'PROJECT_CREATE_ERROR'
    | 'REFRESH_GH_USERS_ERROR'
    | 'REFRESH_GH_ISSUES_ERROR';
  payload: {
    message?: string;
    model: Project;
    originating_user_id: string | null;
  };
}
interface EpicCreatedEvent {
  type: 'EPIC_CREATE';
  payload: {
    model: Epic;
    originating_user_id: string | null;
  };
}
interface EpicUpdatedEvent {
  type: 'EPIC_UPDATE';
  payload: {
    model: Epic;
    originating_user_id: string | null;
  };
}
interface EpicCreatePREvent {
  type: 'EPIC_CREATE_PR';
  payload: {
    model: Epic;
    originating_user_id: string | null;
  };
}
interface EpicCreatePRFailedEvent {
  type: 'EPIC_CREATE_PR_FAILED';
  payload: {
    message?: string;
    model: Epic;
    originating_user_id: string | null;
  };
}
interface TaskCreatedEvent {
  type: 'TASK_CREATE';
  payload: {
    model: Task;
    originating_user_id: string | null;
  };
}
interface TaskUpdatedEvent {
  type: 'TASK_UPDATE';
  payload: {
    model: Task;
    originating_user_id: string | null;
  };
}
interface TaskCreatePREvent {
  type: 'TASK_CREATE_PR';
  payload: {
    model: Task;
    originating_user_id: string | null;
  };
}
interface TaskCreatePRFailedEvent {
  type: 'TASK_CREATE_PR_FAILED';
  payload: {
    message?: string;
    model: Task;
    originating_user_id: string | null;
  };
}
interface TaskSubmitReviewEvent {
  type: 'TASK_SUBMIT_REVIEW';
  payload: {
    model: Task;
    originating_user_id: string | null;
  };
}
interface TaskSubmitReviewFailedEvent {
  type: 'TASK_SUBMIT_REVIEW_FAILED';
  payload: {
    message?: string;
    model: Task;
    originating_user_id: string | null;
  };
}
interface OrgProvisioningEvent {
  type: 'SCRATCH_ORG_PROVISIONING';
  payload: {
    model: Org;
    originating_user_id: string | null;
  };
}
interface OrgProvisionedEvent {
  type: 'SCRATCH_ORG_PROVISION';
  payload: {
    model: Org;
    originating_user_id: string | null;
  };
}
interface OrgProvisionFailedEvent {
  type: 'SCRATCH_ORG_PROVISION_FAILED';
  payload: {
    message?: string;
    model: Org | MinimalOrg;
    originating_user_id: string | null;
  };
}
interface OrgUpdatedEvent {
  type: 'SCRATCH_ORG_UPDATE';
  payload: {
    model: Org;
    originating_user_id: string | null;
  };
}
interface OrgUpdateFailedEvent {
  type: 'SCRATCH_ORG_FETCH_CHANGES_FAILED';
  payload: {
    message?: string;
    model: Org;
    originating_user_id: string | null;
  };
}
interface OrgDeletedEvent {
  type: 'SCRATCH_ORG_DELETE';
  payload: {
    model: Org | MinimalOrg;
    originating_user_id: string | null;
  };
}
interface OrgDeleteFailedEvent {
  type: 'SCRATCH_ORG_DELETE_FAILED';
  payload: {
    message?: string;
    model: Org;
    originating_user_id: string | null;
  };
}
interface OrgRemovedEvent {
  type: 'SCRATCH_ORG_REMOVE';
  payload: {
    message?: string;
    model: Org | MinimalOrg;
    originating_user_id: string | null;
  };
}
interface OrgRefreshedEvent {
  type: 'SCRATCH_ORG_REFRESH';
  payload: {
    model: Org;
    originating_user_id: string | null;
  };
}
interface OrgRefreshFailedEvent {
  type: 'SCRATCH_ORG_REFRESH_FAILED';
  payload: {
    message?: string;
    model: Org | MinimalOrg;
    originating_user_id: string | null;
  };
}
interface OrgRecreatedEvent {
  type: 'SCRATCH_ORG_RECREATE';
  payload: {
    model: Org;
    originating_user_id: string | null;
  };
}
interface OrgReassignedEvent {
  type: 'SCRATCH_ORG_REASSIGN';
  payload: {
    model: Org;
    originating_user_id: string | null;
  };
}
interface OrgReassignFailedEvent {
  type: 'SCRATCH_ORG_REASSIGN_FAILED';
  payload: {
    message?: string;
    model: Org;
    originating_user_id: string | null;
  };
}
interface CommitSucceededEvent {
  type: 'SCRATCH_ORG_COMMIT_CHANGES';
  payload: {
    model: Org;
    originating_user_id: string | null;
  };
}
interface CommitFailedEvent {
  type: 'SCRATCH_ORG_COMMIT_CHANGES_FAILED';
  payload: {
    message?: string;
    model: Org;
    originating_user_id: string | null;
  };
}
interface OrgConvertFailedEvent {
  type: 'SCRATCH_ORG_CONVERT_FAILED';
  payload: {
    message?: string;
    model: Org;
    originating_user_id: string | null;
  };
}
interface SoftDeletedEvent {
  type: 'SOFT_DELETE';
  payload: {
    model: Epic | Task;
    originating_user_id: null;
  };
}
type ModelEvent =
  | ProjectUpdatedEvent
  | ProjectUpdateErrorEvent
  | EpicCreatedEvent
  | EpicUpdatedEvent
  | EpicCreatePREvent
  | EpicCreatePRFailedEvent
  | TaskCreatedEvent
  | TaskUpdatedEvent
  | TaskCreatePREvent
  | TaskCreatePRFailedEvent
  | TaskSubmitReviewEvent
  | TaskSubmitReviewFailedEvent
  | OrgProvisioningEvent
  | OrgProvisionedEvent
  | OrgProvisionFailedEvent
  | OrgUpdatedEvent
  | OrgUpdateFailedEvent
  | OrgDeletedEvent
  | OrgDeleteFailedEvent
  | OrgRemovedEvent
  | OrgRefreshedEvent
  | OrgRefreshFailedEvent
  | OrgRecreatedEvent
  | OrgReassignedEvent
  | OrgReassignFailedEvent
  | CommitSucceededEvent
  | CommitFailedEvent
  | OrgConvertFailedEvent
  | SoftDeletedEvent;
type EventType =
  | SubscriptionEvent
  | ModelEvent
  | ErrorEvent
  | ReposRefreshedEvent
  | ReposRefreshErrorEvent
  | OrgsRefreshedEvent
  | OrgsRefreshErrorEvent;

const isSubscriptionEvent = (event: EventType): event is SubscriptionEvent =>
  (event as ModelEvent).type === undefined;

const hasModel = (event: ModelEvent) => Boolean(event?.payload?.model);

export const getAction = (event: EventType) => {
  if (!event || isSubscriptionEvent(event)) {
    return null;
  }
  switch (event.type) {
    case 'USER_REPOS_REFRESH':
      return projectsRefreshed();
    case 'USER_REPOS_ERROR':
      return projectsRefreshError(event.payload.message);
    case 'USER_ORGS_REFRESH':
      return refreshUser();
    case 'USER_ORGS_REFRESH_ERROR':
      return orgsRefreshError(event.payload.message);
    case 'PROJECT_UPDATE':
      return hasModel(event) && updateProject(event.payload.model);
    case 'PROJECT_CREATE':
      return hasModel(event) && projectCreated(event.payload);
    case 'PROJECT_CREATE_ERROR':
      return hasModel(event) && projectCreateError(event.payload);
    case 'REFRESH_GH_USERS_ERROR': {
      /* istanbul ignore else */
      if (hasModel(event)) {
        const { model } = event.payload;
        const heading = t(
          'Uh oh. There was an error re-syncing GitHub Collaborators for this Project: “{{project_name}}.”',
          { project_name: model.name },
        );
        return projectError({ ...event.payload, heading });
      }
      /* istanbul ignore next */
      return false;
    }
    case 'REFRESH_GH_ISSUES_ERROR': {
      /* istanbul ignore else */
      if (hasModel(event)) {
        const { model } = event.payload;
        const heading = t(
          'Uh oh. There was an error re-syncing GitHub Issues for this Project: “{{project_name}}.”',
          { project_name: model.name },
        );
        return projectError({ ...event.payload, heading });
      }
      /* istanbul ignore next */
      return false;
    }
    case 'EPIC_CREATE':
      return hasModel(event) && createEpic(event.payload.model);
    case 'EPIC_UPDATE':
      return hasModel(event) && updateEpic(event.payload.model);
    case 'EPIC_CREATE_PR':
      return hasModel(event) && createEpicPR(event.payload);
    case 'EPIC_CREATE_PR_FAILED':
      return hasModel(event) && createEpicPRFailed(event.payload);
    case 'TASK_CREATE':
      return hasModel(event) && createTask(event.payload.model);
    case 'TASK_UPDATE':
      return hasModel(event) && updateTask(event.payload.model);
    case 'TASK_CREATE_PR':
      return hasModel(event) && createTaskPR(event.payload);
    case 'TASK_CREATE_PR_FAILED':
      return hasModel(event) && createTaskPRFailed(event.payload);
    case 'TASK_SUBMIT_REVIEW':
      return hasModel(event) && submitReview(event.payload);
    case 'TASK_SUBMIT_REVIEW_FAILED':
      return hasModel(event) && submitReviewFailed(event.payload);
    case 'SCRATCH_ORG_PROVISIONING':
      return hasModel(event) && orgProvisioning(event.payload.model);
    case 'SCRATCH_ORG_PROVISION':
      return hasModel(event) && provisionOrg(event.payload);
    case 'SCRATCH_ORG_PROVISION_FAILED':
      return hasModel(event) && provisionFailed(event.payload);
    case 'SCRATCH_ORG_UPDATE':
      return hasModel(event) && updateOrg(event.payload.model);
    case 'SCRATCH_ORG_FETCH_CHANGES_FAILED':
      return hasModel(event) && updateFailed(event.payload);
    case 'SCRATCH_ORG_DELETE':
      return hasModel(event) && deleteOrg(event.payload);
    case 'SCRATCH_ORG_REMOVE':
      return hasModel(event) && deleteOrg(event.payload);
    case 'SCRATCH_ORG_DELETE_FAILED':
      return hasModel(event) && deleteFailed(event.payload);
    case 'SCRATCH_ORG_REFRESH':
      return hasModel(event) && orgRefreshed(event.payload);
    case 'SCRATCH_ORG_REFRESH_FAILED':
      return hasModel(event) && refreshError(event.payload);
    case 'SCRATCH_ORG_COMMIT_CHANGES':
      return hasModel(event) && commitSucceeded(event.payload);
    case 'SCRATCH_ORG_COMMIT_CHANGES_FAILED':
      return hasModel(event) && commitFailed(event.payload);
    case 'SCRATCH_ORG_RECREATE':
      return hasModel(event) && recreateOrg(event.payload.model);
    case 'SCRATCH_ORG_REASSIGN':
      return hasModel(event) && orgReassigned(event.payload.model);
    case 'SCRATCH_ORG_REASSIGN_FAILED':
      return hasModel(event) && orgReassignFailed(event.payload);
    case 'SCRATCH_ORG_CONVERT_FAILED':
      return hasModel(event) && orgConvertFailed(event.payload);
    case 'SOFT_DELETE':
      return hasModel(event) && removeObject(event.payload.model);
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
        window.setTimeout(() => {
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

  const subscribe = (data: Subscription) => {
    const payload = { ...data, action: WEBSOCKET_ACTIONS.SUBSCRIBE };
    if (open) {
      log('[WebSocket] subscribing to:', payload);
      socket.json(payload);
    } else {
      pending.add(payload);
    }
  };

  const unsubscribe = (data: Subscription) => {
    const payload = { ...data, action: WEBSOCKET_ACTIONS.UNSUBSCRIBE };
    if (open) {
      log('[WebSocket] unsubscribing from:', payload);
      socket.json(payload);
    } else {
      pending.add(payload);
    }
  };

  let reconnecting: number | undefined;
  const clearReconnect = () => {
    /* istanbul ignore else */
    if (reconnecting) {
      window.clearInterval(reconnecting);
      reconnecting = undefined;
    }
  };

  const reconnect = () => {
    socket.close(1000, 'user logged out');
    // Without polling, the `onopen` callback after reconnect could fire before
    // the `onclose` callback...
    reconnecting = window.setInterval(() => {
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
