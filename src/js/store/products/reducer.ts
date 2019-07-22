import { ObjectsAction } from '@/store/actions';
import { ProductsAction } from '@/store/products/actions';
import { LogoutAction } from '@/store/user/actions';
import { OBJECT_TYPES } from '@/utils/constants';

export interface Product {
  id: string;
  name: string;
  slug: string;
  old_slugs: string[];
  repo_url: string;
  description: string;
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
  action: ProductsAction | ObjectsAction | LogoutAction,
): ProductsState => {
  switch (action.type) {
    case 'USER_LOGGED_OUT':
      return { ...defaultState };
    case 'FETCH_OBJECTS_SUCCEEDED': {
      const {
        response: { results, next },
        objectType,
        reset,
      } = action.payload;
      if (objectType === OBJECT_TYPES.PRODUCT) {
        if (reset) {
          return {
            ...products,
            products: results,
            next,
          };
        }
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
      return products;
    }
    case 'FETCH_OBJECT_SUCCEEDED': {
      const {
        object,
        filters: { slug },
        objectType,
      } = action.payload;
      if (objectType === OBJECT_TYPES.PRODUCT) {
        if (!object) {
          return { ...products, notFound: [...products.notFound, slug] };
        }
        if (!products.products.find(p => p.id === object.id)) {
          return { ...products, products: [...products.products, object] };
        }
      }
      return products;
    }
  }
  return products;
};

export default reducer;
