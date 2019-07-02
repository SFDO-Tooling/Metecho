import { ThunkResult } from '@/store';
import { Product } from '@/store/products/reducer';
import apiFetch, { addUrlParams } from '@/utils/api';

interface FetchProductsStarted {
  type: 'FETCH_PRODUCTS_STARTED';
}
interface FetchProductsSucceeded {
  type: 'FETCH_PRODUCTS_SUCCEEDED';
  payload: { next: string | null; results: Product[] };
}
interface FetchProductsFailed {
  type: 'FETCH_PRODUCTS_FAILED';
}
interface FetchMoreProductsStarted {
  type: 'FETCH_MORE_PRODUCTS_STARTED';
  payload: { url: string };
}
interface FetchMoreProductsSucceeded {
  type: 'FETCH_MORE_PRODUCTS_SUCCEEDED';
  payload: { next: string | null; results: Product[] };
}
interface FetchMoreProductsFailed {
  type: 'FETCH_MORE_PRODUCTS_FAILED';
  payload: { url: string };
}
interface ProductFilters {
  slug: string;
}
interface FetchProductStarted {
  type: 'FETCH_PRODUCT_STARTED';
  payload: ProductFilters;
}
interface FetchProductSucceeded {
  type: 'FETCH_PRODUCT_SUCCEEDED';
  payload: { product: Product | null } & ProductFilters;
}
interface FetchProductFailed {
  type: 'FETCH_PRODUCT_FAILED';
  payload: ProductFilters;
}
interface SyncReposStarted {
  type: 'SYNC_REPOS_STARTED';
}
interface SyncReposSucceeded {
  type: 'SYNC_REPOS_SUCCEEDED';
}
interface SyncReposFailed {
  type: 'SYNC_REPOS_FAILED';
}

export type ProductsAction =
  | FetchProductsStarted
  | FetchProductsSucceeded
  | FetchProductsFailed
  | FetchMoreProductsStarted
  | FetchMoreProductsSucceeded
  | FetchMoreProductsFailed
  | FetchProductStarted
  | FetchProductSucceeded
  | FetchProductFailed
  | SyncReposStarted
  | SyncReposSucceeded
  | SyncReposFailed;

export const fetchProducts = (): ThunkResult => async dispatch => {
  dispatch({ type: 'FETCH_PRODUCTS_STARTED' });
  const baseUrl = window.api_urls.product_list();
  try {
    const response = await apiFetch(baseUrl, dispatch);
    return dispatch({
      type: 'FETCH_PRODUCTS_SUCCEEDED',
      payload: response,
    });
  } catch (err) {
    dispatch({ type: 'FETCH_PRODUCTS_FAILED' });
    throw err;
  }
};

export const fetchMoreProducts = ({
  url,
}: {
  url: string;
}): ThunkResult => async dispatch => {
  dispatch({ type: 'FETCH_MORE_PRODUCTS_STARTED', payload: { url } });
  try {
    const response = await apiFetch(url, dispatch);
    return dispatch({
      type: 'FETCH_MORE_PRODUCTS_SUCCEEDED',
      payload: response,
    });
  } catch (err) {
    dispatch({ type: 'FETCH_MORE_PRODUCTS_FAILED', payload: { url } });
    throw err;
  }
};

export const fetchProduct = (
  filters: ProductFilters,
): ThunkResult => async dispatch => {
  dispatch({ type: 'FETCH_PRODUCT_STARTED', payload: filters });
  const baseUrl = window.api_urls.product_list();
  try {
    const response = await apiFetch(
      addUrlParams(baseUrl, { ...filters }),
      dispatch,
    );
    return dispatch({
      type: 'FETCH_PRODUCT_SUCCEEDED',
      payload: { ...filters, product: response || null },
    });
  } catch (err) {
    dispatch({ type: 'FETCH_PRODUCT_FAILED', payload: filters });
    throw err;
  }
};

export const syncRepos = (): ThunkResult => async dispatch => {
  dispatch({ type: 'SYNC_REPOS_STARTED' });
  try {
    await apiFetch(window.api_urls.user_refresh(), dispatch, {
      method: 'POST',
    });
    dispatch({ type: 'SYNC_REPOS_SUCCEEDED' });
    return dispatch(fetchProducts());
  } catch (err) {
    dispatch({ type: 'SYNC_REPOS_FAILED' });
    throw err;
  }
};
