import { RouteComponentProps } from 'react-router-dom';
import { createSelector } from 'reselect';

import { AppState } from '@/store';
import { Product, ProductsState } from '@/store/products/reducer';

export const selectProductsState = (appState: AppState): ProductsState =>
  appState.products;

export const selectProducts = createSelector(
  selectProductsState,
  (products: ProductsState): Product[] => products.products,
);

export const selectNextUrl = createSelector(
  selectProductsState,
  (products: ProductsState): string | null => products.next,
);
// new stuff here:
export const selectProductSlug = (
  appState: AppState,
  { match: { params } }: RouteComponentProps<{ productSlug?: string }>,
) => params.productSlug;

export const selectProductNotFound = createSelector(
  [selectProductsState, selectProductSlug],
  (products, productSlug): boolean =>
    Boolean(productSlug && products.notFound.includes(productSlug)),
);

export const selectProduct = createSelector(
  [selectProducts, selectProductSlug, selectProductNotFound],
  (products, productSlug, notFound): Product | null | undefined => {
    if (!productSlug) {
      return undefined;
    }
    const product = products.find(
      p => p.slug === productSlug || p.old_slugs.includes(productSlug),
    );
    if (product) {
      return product;
    }
    return notFound ? null : undefined;
  },
);
