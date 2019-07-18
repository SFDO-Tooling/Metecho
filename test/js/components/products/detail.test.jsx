import { fireEvent } from '@testing-library/react';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import ProductDetail from '@/components/products/detail';
import { fetchObject, postObject } from '@/store/actions';
import routes from '@/utils/routes';

import { renderWithRedux, storeWithApi } from './../../utils';

jest.mock('@/store/actions');

fetchObject.mockReturnValue({ type: 'TEST' });
postObject.mockReturnValue({ test: 'TEST' });

afterEach(() => {
  fetchObject.mockClear();
});

const defaultState = {
  products: {
    products: [
      {
        id: 'p1',
        name: 'Product 1',
        slug: 'product-1',
        old_slugs: ['old-slug'],
        description: 'This is a test product.',
        repo_url: 'https://www.github.com/test/test-repo',
      },
    ],
    notFound: ['yet-another-product'],
    next: null,
  },
};

describe('<ProductDetail />', () => {
  const setup = options => {
    const defaults = {
      initialState: defaultState,
      productSlug: 'product-1',
    };
    const opts = Object.assign({}, defaults, options);
    const { initialState, productSlug } = opts;
    const context = {};
    const {
      debug,
      container,
      getByText,
      getByTitle,
      queryByText,
    } = renderWithRedux(
      <StaticRouter context={context}>
        <ProductDetail match={{ params: { productSlug } }} />
      </StaticRouter>,
      initialState,
      storeWithApi,
    );
    return { debug, container, getByText, getByTitle, queryByText, context };
  };

  test('renders product detail', () => {
    const { getByText, getByTitle } = setup();

    expect(getByTitle('Product 1')).toBeVisible();
    expect(getByText('This is a test product.')).toBeVisible();
  });

  describe('product not found', () => {
    test('fetches product from API', () => {
      const { queryByText } = setup({ productSlug: 'other-product' });

      expect(queryByText('Product 1')).toBeNull();
      expect(fetchObject).toHaveBeenCalledWith({
        filters: { slug: 'other-product' },
        objectType: 'product',
      });
    });
  });

  describe('product does not exist', () => {
    test('renders <ProductNotFound />', () => {
      const { getByText, queryByText } = setup({
        productSlug: 'yet-another-product',
      });

      expect(queryByText('Product 1')).toBeNull();
      expect(getByText('list of all products')).toBeVisible();
    });
  });

  describe('old product slug', () => {
    test('redirects to product_detail with new slug', () => {
      const { context } = setup({ productSlug: 'old-slug' });

      expect(context.action).toEqual('REPLACE');
      expect(context.url).toEqual(routes.product_detail('product-1'));
    });
  });

  describe('no product slug', () => {
    test('renders <ProductNotFound />', () => {
      const { getByText, queryByText } = setup({ productSlug: '' });

      expect(queryByText('Product 1')).toBeNull();
      expect(getByText('list of all products')).toBeVisible();
    });
  });

  describe('<ProjectForm/>', () => {
    describe('create a project', () => {
      test('creates a new project', () => {
        const { container, getByText } = setup();
        let nameInput, descriptionInput;
        const button = getByText('Create a Project');
        nameInput = container.querySelector('#project-name');
        descriptionInput = container.querySelector('#project-description');

        expect(nameInput).toBeNull();
        expect(button).toBeVisible();

        fireEvent.click(button);

        expect(getByText('Create a Project for Product 1')).toBeVisible();

        nameInput = container.querySelector('#project-name');
        descriptionInput = container.querySelector('#project-description');

        expect(nameInput).toBeVisible();

        fireEvent.change(nameInput, { target: { value: 'Name of Project' } });
        fireEvent.change(descriptionInput, {
          target: { value: '<p>This is the description</p>' },
        });
        fireEvent.click(button);

        const name = nameInput.value;
        const description = descriptionInput.value;
        const product = 'prod-1';

        expect(postObject).toHaveBeenCalledWith({ name, description, product });
      });

      test('validates name field', () => {
        const { getByText } = setup();
        const button = getByText('Create a Project');

        fireEvent.click(button);
        fireEvent.click(button);

        expect(getByText('Project name is required.')).toBeVisible();
        expect(postObject).not.toHaveBeenCalled();
      });
    });
  });
});
