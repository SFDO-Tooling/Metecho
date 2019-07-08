import React from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';

import FourOhFour from '@/components/404';
import routes from '@/utils/routes';

const ProductNotFound = () => (
  <FourOhFour
    message={
      <Trans i18nKey="productNotFound">
        We can’t find the product you’re looking for. Try the{' '}
        <Link to={routes.product_list()}>list of all products</Link>?
      </Trans>
    }
  />
);

export default ProductNotFound;
