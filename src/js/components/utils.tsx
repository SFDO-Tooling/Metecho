import Icon from '@salesforce/design-system-react/components/icon';
import Spinner from '@salesforce/design-system-react/components/spinner';
import React, {
  ComponentType,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, Route, RouteComponentProps } from 'react-router-dom';

import ProductNotFound from '@/components/products/product404';
import ProjectNotFound from '@/components/projects/project404';
import { AppState, ThunkDispatch } from '@/store';
import { fetchObject, fetchObjects } from '@/store/actions';
import { Product } from '@/store/products/reducer';
import { selectProduct, selectProductSlug } from '@/store/products/selectors';
import { Project } from '@/store/projects/reducer';
import {
  selectProject,
  selectProjectsByProduct,
  selectProjectSlug,
} from '@/store/projects/selectors';
import { selectTasksByProject } from '@/store/tasks/selectors';
import { selectUserState } from '@/store/user/selectors';
import { GITHUB_REPO_PREFIX, OBJECT_TYPES } from '@/utils/constants';
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
}): ReactNode | false => {
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
}): ReactNode | false => {
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
