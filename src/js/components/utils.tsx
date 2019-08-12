import Icon from '@salesforce/design-system-react/components/icon';
import Spinner from '@salesforce/design-system-react/components/spinner';
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
import { Redirect, Route, RouteComponentProps } from 'react-router-dom';

import ProductNotFound from '@/components/products/product404';
import ProjectNotFound from '@/components/projects/project404';
import TaskNotFound from '@/components/tasks/task404';
import { AppState, ThunkDispatch } from '@/store';
import { createObject, fetchObject, fetchObjects } from '@/store/actions';
import { addError } from '@/store/errors/actions';
import { Product } from '@/store/products/reducer';
import { selectProduct, selectProductSlug } from '@/store/products/selectors';
import { Project } from '@/store/projects/reducer';
import {
  selectProject,
  selectProjectsByProduct,
  selectProjectSlug,
} from '@/store/projects/selectors';
import { Task } from '@/store/tasks/reducer';
import {
  selectTask,
  selectTasksByProject,
  selectTaskSlug,
} from '@/store/tasks/selectors';
import { selectUserState } from '@/store/user/selectors';
import { ApiError } from '@/utils/api';
import {
  GITHUB_REPO_PREFIX,
  OBJECT_TYPES,
  ObjectTypes,
} from '@/utils/constants';
import routes from '@/utils/routes';
import githubIcon from '#/github.svg';

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

export const getProductLoadingOrNotFound = ({
  product,
  productSlug,
}: {
  product?: Product | null;
  productSlug?: string;
}): ReactElement | false => {
  if (!product) {
    if (!productSlug || product === null) {
      return <ProductNotFound />;
    }
    // Fetching product from API
    return <Spinner />;
  }
  return false;
};

export const getProjectLoadingOrNotFound = ({
  product,
  project,
  projectSlug,
}: {
  product?: Product | null;
  project?: Project | null;
  projectSlug?: string;
}): ReactElement | false => {
  if (!project) {
    if (!product) {
      return <ProductNotFound />;
    }
    if (!projectSlug || project === null) {
      return <ProjectNotFound product={product} />;
    }
    // Fetching project from API
    return <Spinner />;
  }
  return false;
};

export const getTaskLoadingOrNotFound = ({
  product,
  project,
  projectSlug,
  task,
  taskSlug,
}: {
  product?: Product | null;
  project?: Project | null;
  projectSlug?: string;
  task?: Task | null;
  taskSlug?: string;
}): ReactNode | false => {
  if (!task) {
    if (!product) {
      return <ProductNotFound />;
    }
    if (!projectSlug || project === null) {
      return <ProjectNotFound product={product} />;
    }
    if (project) {
      if (!taskSlug || task === null) {
        return <TaskNotFound product={product} project={project} />;
      }
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

export const useFetchProductIfMissing = (routeProps: RouteComponentProps) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const selectProductWithProps = useCallback(selectProduct, []);
  const selectProductSlugWithProps = useCallback(selectProductSlug, []);
  const product = useSelector((state: AppState) =>
    selectProductWithProps(state, routeProps),
  );
  const productSlug = useSelector((state: AppState) =>
    selectProductSlugWithProps(state, routeProps),
  );

  useEffect(() => {
    if (productSlug && product === undefined) {
      // Fetch product from API
      dispatch(
        fetchObject({
          objectType: OBJECT_TYPES.PRODUCT,
          filters: { slug: productSlug },
        }),
      );
    }
  }, [dispatch, product, productSlug]);

  return { product, productSlug };
};

export const useFetchProjectsIfMissing = (
  product: Product | null | undefined,
  routeProps: RouteComponentProps,
) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const selectProjectsWithProps = useCallback(selectProjectsByProduct, []);
  const projects = useSelector((state: AppState) =>
    selectProjectsWithProps(state, routeProps),
  );

  useEffect(() => {
    if (product && (!projects || !projects.fetched)) {
      // Fetch projects from API
      dispatch(
        fetchObjects({
          objectType: OBJECT_TYPES.PROJECT,
          filters: { product: product.id },
          reset: true,
        }),
      );
    }
  }, [dispatch, product, projects]);

  return { projects };
};

export const useFetchProjectIfMissing = (
  product: Product | null | undefined,
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
    if (product && projectSlug && project === undefined) {
      // Fetch project from API
      dispatch(
        fetchObject({
          objectType: OBJECT_TYPES.PROJECT,
          filters: { product: product.id, slug: projectSlug },
        }),
      );
    }
  }, [dispatch, product, project, projectSlug]);

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

export const useFetchTaskIfMissing = (
  project: Project | null | undefined,
  routeProps: RouteComponentProps,
) => {
  const dispatch = useDispatch<ThunkDispatch>();
  const selectTaskWithProps = useCallback(selectTask, []);
  const task = useSelector((state: AppState) =>
    selectTaskWithProps(state, routeProps),
  );
  const taskSlug = useSelector((state: AppState) =>
    selectTaskSlug(state, routeProps),
  );

  useEffect(() => {
    if (project && !task) {
      // Fetch tasks from API
      dispatch(
        fetchObjects({
          objectType: OBJECT_TYPES.TASK,
          filters: { project: project.id },
        }),
      );
    }
  }, [dispatch, project, task]);

  return { task, taskSlug };
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
