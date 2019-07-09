import { render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import ProductListItem from '@/components/products/listItem';

describe('<ProductListItem />', () => {
  const setup = initialState => {
    const { getByText } = render(
      <MemoryRouter>
        <>
          {initialState.products.products.map(product => (
            <ProductListItem product={product} key={product.id} />
          ))}
        </>
      </MemoryRouter>,
    );
    return { getByText };
  };

  test('renders product', () => {
    const initialState = {
      products: {
        products: [
          {
            id: 'p1',
            name: 'Product 1',
            slug: 'product-1',
            description: 'This is a test product.',
            repo_url: 'https://www.github.com/test/test-repo',
          },
          {
            id: 'p2',
            name: 'Product 2',
            slug: 'product-2',
            repo_url: 'https://www.github.com/test/another-test-repo',
          },
        ],
        notFound: [],
        next: null,
      },
    };
    const { getByText } = setup(initialState);

    expect(getByText('Product 1')).toBeVisible();
    expect(getByText('This is a test product.')).toBeVisible();
    expect(getByText('Product 2')).toBeVisible();
  });
});
