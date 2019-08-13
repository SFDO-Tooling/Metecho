import React from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';

import FourOhFour from '@/components/404';
import { Product } from '@/store/products/reducer';
import routes from '@/utils/routes';

const ProjectNotFound = ({ product }: { product: Product }) => (
  <FourOhFour
    message={
      <Trans i18nKey="projectNotFound">
        We can’t find the project you’re looking for. Try{' '}
        <Link to={routes.product_detail(product.slug)}>another project</Link>{' '}
        from that product?
      </Trans>
    }
  />
);

export default ProjectNotFound;
