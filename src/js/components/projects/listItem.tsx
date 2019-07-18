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
  const { name, description, status } = project;
  return (
    <div>
      <div className="slds-p-top_x-large project-list">
        <div className="slds-grid">
          {/* @todo capture slug from actual project */}
          <Link to={routes.project_detail(product.slug, 'product-slug')}>
            <h2 className="slds-text-heading_medium">{name}</h2>
          </Link>

          {status && (
            <span className="slds-align-middle slds-badge">
              {<strong>{status}</strong>}
            </span>
          )}
        </div>
        {description && (
          <p
            className="markdown"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectListItem;
