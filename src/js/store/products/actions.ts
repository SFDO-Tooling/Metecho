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
  id: string;
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

export type ProductsAction =
  | FetchProductsStarted
  | FetchProductsSucceeded
  | FetchProductsFailed
  | FetchMoreProductsStarted
  | FetchMoreProductsSucceeded
  | FetchMoreProductsFailed
  | FetchProductStarted
  | FetchProductSucceeded
  | FetchProductFailed;

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
