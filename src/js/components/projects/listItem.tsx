import React from 'react';
import { Link } from 'react-router-dom';

import { Project } from '@/store/projects/reducer';
import routes from '@/utils/routes';

interface Props {
  repositorySlug: string;
  project: Project;
}

const ProjectListItem = ({ repositorySlug, project }: Props) => {
  const { name, description_rendered, slug } = project;
  return (
    <li className="slds-item slds-p-horizontal_none slds-p-vertical_medium">
      <h3 className="slds-text-heading_small">
        <Link to={routes.project_detail(repositorySlug, slug)}>{name}</Link>
      </h3>
      {description_rendered && (
        <p
          className="markdown"
          dangerouslySetInnerHTML={{ __html: description_rendered }}
        />
      )}
    </li>
  );
};

export default ProjectListItem;
