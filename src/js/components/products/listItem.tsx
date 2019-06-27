import Card from '@salesforce/design-system-react/components/card';
import i18n from 'i18next';
import React from 'react';
import { Link } from 'react-router-dom';

import ProductIcon from '@/components/products/icon';
import { Product } from '@/store/products/reducer';
import routes from '@/utils/routes';

const ProductListItem = ({ product }: { product: Product }) => (
  <Link
    to={routes.product_detail(product.id)}
    className="slds-text-link_reset
      slds-p-around_small
      slds-size_1-of-1
      slds-medium-size_1-of-2
      slds-large-size_1-of-3"
  >
    <Card
      heading={product.name}
      icon={<ProductIcon product={product} />}
      bodyClassName="slds-card__body_inner"
    >
      <div className="slds-text-title">
        {i18n.t('Version')} {product.version_number}
      </div>
      {product.description ? (
        <div
          className="md-truncate-children slds-p-top_x-small"
          // This description is pre-cleaned by the API
          dangerouslySetInnerHTML={{ __html: product.description }}
        />
      ) : null}
    </Card>
  </Link>
);

export default ProductListItem;
