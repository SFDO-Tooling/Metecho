import BreadCrumb from '@salesforce/design-system-react/components/breadcrumb';
import Icon from '@salesforce/design-system-react/components/icon';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import Spinner from '@salesforce/design-system-react/components/spinner';
import i18n from 'i18next';
import React, {
  ComponentType,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Redirect, Route, RouteComponentProps } from 'react-router-dom';

import ProjectNotFound from '@/components/projects/project404';
import RepositoryNotFound from '@/components/repositories/repository404';
import TaskNotFound from '@/components/tasks/task404';
import { AppState, ThunkDispatch } from '@/store';
import { createObject, fetchObject, fetchObjects } from '@/store/actions';
import { addError } from '@/store/errors/actions';
import { Project } from '@/store/projects/reducer';
import {
  selectProject,
  selectProjectsByRepository,
  selectProjectSlug,
} from '@/store/projects/selectors';
import { Repository } from '@/store/repositories/reducer';
import {
  selectRepository,
  selectRepositorySlug,
} from '@/store/repositories/selectors';
import { Task } from '@/store/tasks/reducer';
import { selectTasksByProject } from '@/store/tasks/selectors';
import { selectUserState } from '@/store/user/selectors';
import { ApiError } from '@/utils/api';
import {
  GITHUB_REPO_PREFIX,
  OBJECT_TYPES,
  ObjectTypes,
} from '@/utils/constants';
import routes from '@/utils/routes';
import githubIcon from '#/github.svg';

interface Crumb {
  name: string;
  url?: string;
}

export const DetailPageLayout = ({
  title,
  description,
  repoUrl,
  breadcrumb,
  onRenderHeaderActions,
  sidebar,
  children,
}: {
  title: string;
  description?: string;
  repoUrl: string;
  breadcrumb: Crumb[];
  onRenderHeaderActions?: () => JSX.Element;
  sidebar?: ReactNode;
  children?: ReactNode;
}) => {
  const descriptionHasTitle =
    description &&
    (description.startsWith('<h1>') || description.startsWith('<h2>'));

  return (
    <>
      <PageHeader
        className="page-header slds-p-around_x-large"
        title={title}
        info={<RepoLink url={repoUrl} shortenGithub />}
        onRenderControls={onRenderHeaderActions}
      />
      <div
        className="slds-p-horizontal_x-large
          slds-p-top_x-small
          ms-breadcrumb"
      >
        <BreadCrumb
          trail={[
            <Link to={routes.home()} key="home">
              {i18n.t('Home')}
            </Link>,
          ].concat(
            breadcrumb.map((crumb, idx) => {
              if (crumb.url) {
                return (
                  <Link to={crumb.url} key={idx}>
                    {crumb.name}
                  </Link>
                );
              }
              return (
                <div className="slds-p-horizontal_x-small" key={idx}>
                  {crumb.name}
                </div>
              );
            }),
          )}
        />
      </div>
      <div
        className="slds-p-around_x-large
          slds-grid
          slds-gutters
          slds-wrap"
      >
        <div
          className="slds-col
            slds-size_1-of-1
            slds-medium-size_2-of-3
            slds-p-bottom_x-large"
        >
          {children}
        </div>
        <div
          className="slds-col
            slds-size_1-of-1
            slds-medium-size_1-of-3
            slds-text-longform"
        >
          {!descriptionHasTitle && (
            <h2 className="slds-text-heading_medium">{title}</h2>
          )}
          {/* This description is pre-cleaned by the API */}
          {description && (
            <p
              className="markdown"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}
          {sidebar}
        </div>
      </div>
    </>
  );
};

// For use as a "loading" button label
export const LabelWithSpinner = ({
  label,
  variant = 'inverse',
  size = 'small',
}: {
  label: string;
  variant?: string;
  size?: string;
}) => (
  <>
    <span className="slds-is-relative slds-m-right_large">
      <Spinner variant={variant} size={size} />
    </span>
    {label}
  </>
);

export const RepoLink = ({
  url,
  shortenGithub = false,
  children,
}: {
  url: string;
  shortenGithub?: boolean;
  children?: ReactNode;
}) => (
  <a href={url} target="_blank" rel="noreferrer noopener">
    {shortenGithub && url.startsWith(GITHUB_REPO_PREFIX) ? (
      <>
        <Icon
          path={`${githubIcon}#github`}
          size="xx-small"
          className="slds-m-bottom_xx-small"
        />
        {url.slice(GITHUB_REPO_PREFIX.length)}
      </>
    ) : (
      children
    )}
  </a>
);

export const PrivateRoute = ({
  component: Component,
  ...rest
}: {
  component: ComponentType<any>;
  [key: string]: any;
}) => {
  const user = useSelector(selectUserState);

  return (
    <Route
      {...rest}
      render={props =>
        user ? (
          <Component {...props} />
        ) : (
          <Redirect
            to={{
              pathname: routes.login(),
              state: { from: props.location },
            }}
          />
        )
      }
    />
  );
};

export const getRepositoryLoadingOrNotFound = ({
  repository,
  repositorySlug,
}: {
  repository?: Repository | null;
  repositorySlug?: string;
}): ReactElement | false => {
  if (!repository) {
    if (!repositorySlug || repository === null) {
      return <RepositoryNotFound />;
    }
    // Fetching repository from API
    return <Spinner />;
  }
  return false;
};

export const getProjectLoadingOrNotFound = ({
  repository,
  project,
  projectSlug,
}: {
  repository?: Repository | null;
  project?: Project | null;
  projectSlug?: string;
}): ReactElement | false => {
  if (!project) {
    /* istanbul ignore if */
    if (!repository) {
      return <RepositoryNotFound />;
    }
    if (!projectSlug || project === null) {
      return <ProjectNotFound repository={repository} />;
    }
    // Fetching project from API
    return <Spinner />;
  }
  return false;
};

export const getTaskLoadingOrNotFound = ({
  repository,
  project,
  task,
  taskSlug,
}: {
  repository?: Repository | null;
  project?: Project | null;
  task?: Task | null;
  taskSlug?: string;
}): ReactElement | false => {
  if (!task) {
    /* istanbul ignore if */
    if (!repository) {
      return <RepositoryNotFound />;
    }
    /* istanbul ignore if */
    if (!project) {
      return <ProjectNotFound repository={repository} />;
    }
    if (!taskSlug || task === null) {
      return <TaskNotFound repository={repository} project={project} />;
    }
    // Fetching task from API
    return <Spinner />;
  }
  return false;
};

// This is often considered an anti-pattern in React, but we consider it
// acceptable in cases where we don't want to cancel or cleanup an asynchronous
// action on unmount -- we just want to prevent a post-unmount state update
// after the action finishes.
// https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html
export const useIsMounted = () => {
  const isMounted = useRef(true);
  useEffect(
    () => () => {
      isMounted.current = false;
    },
    [],
  );
  return isMounted;
};

export const useFetchRepositoryIfMissing = (
  routeProps: RouteComponentProps,
) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const selectRepositoryWithProps = useCallback(selectRepository, []);
  const selectRepositorySlugWithProps = useCallback(selectRepositorySlug, []);
  const repository = useSelector((state: AppState) =>
    selectRepositoryWithProps(state, routeProps),
  );
  const repositorySlug = useSelector((state: AppState) =>
    selectRepositorySlugWithProps(state, routeProps),
  );

  useEffect(() => {
    if (repositorySlug && repository === undefined) {
      // Fetch repository from API
      dispatch(
        fetchObject({
          objectType: OBJECT_TYPES.REPOSITORY,
          filters: { slug: repositorySlug },
        }),
      );
    }
  }, [dispatch, repository, repositorySlug]);

  return { repository, repositorySlug };
};

export const useFetchProjectsIfMissing = (
  repository: Repository | null | undefined,
  routeProps: RouteComponentProps,
) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const selectProjectsWithProps = useCallback(selectProjectsByRepository, []);
  const projects = useSelector((state: AppState) =>
    selectProjectsWithProps(state, routeProps),
  );

  useEffect(() => {
    if (repository && (!projects || !projects.fetched)) {
      // Fetch projects from API
      dispatch(
        fetchObjects({
          objectType: OBJECT_TYPES.PROJECT,
          filters: { repository: repository.id },
          reset: true,
        }),
      );
    }
  }, [dispatch, repository, projects]);

  return { projects };
};

export const useFetchProjectIfMissing = (
  repository: Repository | null | undefined,
  routeProps: RouteComponentProps,
) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const selectProjectWithProps = useCallback(selectProject, []);
  const selectProjectSlugWithProps = useCallback(selectProjectSlug, []);
  const project = useSelector((state: AppState) =>
    selectProjectWithProps(state, routeProps),
  );
  const projectSlug = useSelector((state: AppState) =>
    selectProjectSlugWithProps(state, routeProps),
  );

  useEffect(() => {
    if (repository && projectSlug && project === undefined) {
      // Fetch project from API
      dispatch(
        fetchObject({
          objectType: OBJECT_TYPES.PROJECT,
          filters: { repository: repository.id, slug: projectSlug },
        }),
      );
    }
  }, [dispatch, repository, project, projectSlug]);

  return { project, projectSlug };
};

export const useFetchTasksIfMissing = (
  project: Project | null | undefined,
  routeProps: RouteComponentProps,
) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const selectTasksWithProps = useCallback(selectTasksByProject, []);
  const tasks = useSelector((state: AppState) =>
    selectTasksWithProps(state, routeProps),
  );

  useEffect(() => {
    if (project && !tasks) {
      // Fetch tasks from API
      dispatch(
        fetchObjects({
          objectType: OBJECT_TYPES.TASK,
          filters: { project: project.id },
        }),
      );
    }
  }, [dispatch, project, tasks]);

  return { tasks };
};

export const useForm = ({
  fields,
  objectType,
  additionalData = {},
  onSuccess = () => {},
}: {
  fields: { [key: string]: any };
  objectType: ObjectTypes;
  additionalData?: { [key: string]: any };
  onSuccess?: (...args: any[]) => any;
}) => {
  const isMounted = useIsMounted();
  const dispatch = useDispatch<ThunkDispatch>();
  const [inputs, setInputs] = useState<{ [key: string]: any }>(fields);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const resetForm = () => {
    setInputs(fields);
    setErrors({});
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    dispatch(
      createObject({
        objectType,
        data: {
          ...inputs,
          ...additionalData,
        },
      }),
    )
      .then((...args) => {
        /* istanbul ignore else */
        if (isMounted.current) {
          resetForm();
        }
        onSuccess(...args);
      })
      .catch((err: ApiError) => {
        const allErrors =
          err.body && typeof err.body === 'object' ? err.body : {};
        const fieldErrors: typeof errors = {};
        for (const field of Object.keys(allErrors)) {
          if (
            Object.keys(fields).includes(field) &&
            allErrors[field] &&
            allErrors[field].length
          ) {
            fieldErrors[field] = allErrors[field].join(', ');
          }
        }
        if (isMounted.current && Object.keys(fieldErrors).length) {
          setErrors(fieldErrors);
        } else if (err.response && err.response.status === 400) {
          // If no inline errors to show, fallback to default global error toast
          dispatch(addError(err.message));
        }
      });
  };

  return {
    inputs,
    errors,
    handleInputChange,
    handleSubmit,
    resetForm,
  };
};
