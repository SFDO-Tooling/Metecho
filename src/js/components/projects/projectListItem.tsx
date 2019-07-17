import React from 'react';
import { Product } from '@/store/products/reducer';
import { Project } from '@/store/projects/reducer';

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
          <h2 className="slds-text-heading_medium">{name}</h2>
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
