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

// const selectProductSlug = (
//   appState: AppState,
//   { match: { params } }: InitialProps,
// ): ?string => params.productSlug;

// const selectProductNotFound: (
//   AppState,
//   InitialProps,
// ) => boolean = createSelector(
//   [selectProductsState, selectProductSlug],
//   (products: ProductsState, productSlug: ?string): boolean =>
//     Boolean(productSlug && products.notFound.includes(productSlug)),
// );

// const selectProduct: (
//   AppState,
//   InitialProps,
// ) => Product | null | void = createSelector(
//   [selectProducts, selectProductSlug, selectProductNotFound],
//   (
//     products: Array<Product>,
//     productSlug: ?string,
//     notFound: boolean,
//   ): Product | null | void => {
//     if (!productSlug) {
//       return undefined;
//     }
//     const product = products.find(
//       p => p.slug === productSlug || p.old_slugs.includes(productSlug),
//     );
//     if (product) {
//       return product;
//     }
//     return notFound ? null : undefined;
//   },
// );
