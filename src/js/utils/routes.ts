/* eslint-disable @typescript-eslint/camelcase */

const routes = {
  home: () => '/',
  login: () => '/login',
  product_list: () => '/products',
  product_detail: (productSlug: string) => `/products/${productSlug}`,
};

export const routePatterns = {
  home: () => '/',
  login: () => '/login',
  auth_error: () => '/accounts/*',
  product_list: () => '/products',
  product_detail: () => '/products/:productSlug',
};

export default routes;
