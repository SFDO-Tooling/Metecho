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
    <li className="slds-p-top_x-large project-list">
      {/* @todo capture slug from actual project */}
      <h2 className="slds-text-heading_medium">
        <Link to={routes.project_detail(product.slug, slug)}>{name}</Link>
      </h2>
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
