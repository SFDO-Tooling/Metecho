import React from 'react';
import { Link } from 'react-router-dom';

import { Product } from '@/store/products/reducer';
import { Project } from '@/store/projects/reducer';
import routes from '@/utils/routes';

interface Props {
  product: Product;
  project: Project;
}

const ProjectListItem = ({ product, project }: Props) => {
  const { name, description, slug } = project;
  return (
    <li className="slds-item slds-p-horizontal_none slds-p-vertical_medium">
      <h3 className="slds-text-heading_small">
        <Link to={routes.project_detail(product.slug, slug)}>{name}</Link>
      </h3>
      {description && (
        <p
          className="markdown"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      )}
    </li>
  );
};

export default ProjectListItem;
