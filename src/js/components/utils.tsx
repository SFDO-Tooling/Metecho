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
import { AppState, ThunkDispatch } from '@/store';
import { fetchObject, fetchObjects } from '@/store/actions';
import { Product } from '@/store/products/reducer';
import { selectProduct, selectProductSlug } from '@/store/products/selectors';
import { selectProjectsByProduct } from '@/store/projects/selectors';
import { selectUserState } from '@/store/user/selectors';
import { OBJECT_TYPES } from '@/utils/constants';
import routes from '@/utils/routes';

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
  children,
}: {
  url: string;
  children: ReactNode;
}) => (
  <a href={url} target="_blank" rel="noreferrer noopener">
    {children}
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

export const getLoadingOrNotFound = ({
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
