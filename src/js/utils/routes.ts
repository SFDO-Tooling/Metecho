/* eslint-disable @typescript-eslint/camelcase */

const routes = {
  home: () => '/',
  login: () => '/login',
  product_list: () => '/products',
  product_detail: (productSlug: string) => `/products/${productSlug}`,
  project_detail: (productSlug: string, projectSlug: string) =>
    `/products/${productSlug}/${projectSlug}`,
  task_detail: (productSlug: string, projectSlug: string, taskSlug: string) =>
    `/products/${productSlug}/${projectSlug}/${taskSlug}`,
};

export const routePatterns = {
  home: () => '/',
  login: () => '/login',
  auth_error: () => '/accounts/*',
  product_list: () => '/products',
  product_detail: () => '/products/:productSlug',
  project_detail: () => '/products/:productSlug/:projectSlug',
  task_detail: () => '/products/:productSlug/:projectSlug/:taskSlug',
};

export default routes;
