import React from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';

import FourOhFour from '@/components/404';
import { Product } from '@/store/products/reducer';
import { Project } from '@/store/projects/reducer';
import routes from '@/utils/routes';

interface Props {
  product: Product;
  project: Project;
}
const TaskNotFound = ({ product, project }: Props) => (
  <FourOhFour
    message={
      <Trans i18nKey="taskNotFound">
        We can’t find the task you’re looking for. Try{' '}
        <Link to={routes.project_detail(product.slug, project.slug)}>
          another task
        </Link>{' '}
        from that project?
      </Trans>
    }
  />
);

export default TaskNotFound;
