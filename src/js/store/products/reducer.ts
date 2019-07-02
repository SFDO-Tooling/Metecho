import { ProductsAction } from '@/store/products/actions';
import { LogoutAction } from '@/store/user/actions';

export interface Product {
  id: string;
  name: string;
  slug: string;
  old_slugs: string[];
  repo_url: string;
  description: string | null;
  is_managed: boolean;
}
export interface ProductsState {
  products: Product[];
  next: string | null;
  notFound: string[];
}

const defaultState = {
  products: [],
  next: null,
  notFound: [],
};

const reducer = (
  products: ProductsState = defaultState,
  action: ProductsAction | LogoutAction,
): ProductsState => {
  switch (action.type) {
    case 'USER_LOGGED_OUT':
      return { ...defaultState };
    case 'FETCH_PRODUCTS_SUCCEEDED': {
      const { results, next } = action.payload;
      return {
        ...products,
        products: results,
        next,
      };
    }
    case 'FETCH_MORE_PRODUCTS_SUCCEEDED': {
      const { results, next } = action.payload;
      // Store list of known product IDs to filter out duplicates
      const ids = products.products.map(p => p.id);
      return {
        ...products,
        products: [
          ...products.products,
          ...results.filter(p => !ids.includes(p.id)),
        ],
        next,
      };
    }
    case 'FETCH_PRODUCT_SUCCEEDED': {
      const { product, slug } = action.payload;
      if (!product) {
        return { ...products, notFound: [...products.notFound, slug] };
      }
      if (!products.products.find(p => p.id === product.id)) {
        return { ...products, products: [...products.products, product] };
      }
      return products;
    }
  }
  return products;
};

export default reducer;
