import routes, { routePatterns } from '@/utils/routes';

describe('routes', () => {
  test.each([
    ['home', [], '/'],
    ['login', [], '/login'],
    ['product_list', [], '/products'],
    ['product_detail', ['slug'], '/products/slug'],
  ])('%s returns path with args: %o', (name, args, expected) => {
    expect(routes[name](...args)).toBe(expected);
  });
});

describe('routePatterns', () => {
  test.each([
    ['home', '/'],
    ['login', '/login'],
    ['auth_error', '/accounts/*'],
    ['product_list', '/products'],
    ['product_detail', '/products/:productSlug'],
  ])('%s returns path', (name, expected) => {
    expect(routePatterns[name]()).toBe(expected);
  });
});
