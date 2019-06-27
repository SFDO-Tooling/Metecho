/* eslint-disable @typescript-eslint/camelcase */

const routes = {
  home: () => '/',
  login: () => '/login',
  product_list: () => '/products',
  product_detail: (productId: string) => `/products/${productId}`,
};

export const routePatterns = {
  home: () => '/',
  login: () => '/login',
  auth_error: () => '/accounts/*',
  product_list: () => '/products',
};

export default routes;
