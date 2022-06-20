import Avatar from '@salesforce/design-system-react/components/avatar';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Project } from '@/js/store/projects/reducer';
import routes from '@/js/utils/routes';

const ProjectListItem = ({ project }: { project: Project }) => {
  const { t } = useTranslation();

  return (
    <div
      className="metecho-project-item
        slds-p-around_small
        slds-size_1-of-1
        slds-medium-size_1-of-2
        slds-large-size_1-of-3"
    >
      <Link
        to={routes.project_detail(project.slug)}
        className="slds-box
          slds-box_link
          slds-box_x-small
          slds-theme_default
          slds-media
          container-fill-space"
      >
        <div className="slds-media__figure slds-m-left_xx-small">
          {project.repo_image_url ? (
            <div>
              <img
                src={project.repo_image_url}
                alt={t('social image for {{title}}', {
                  title: project.name,
                })}
              />
            </div>
          ) : (
            <Avatar
              variant="entity"
              size="large"
              label={project.name}
              title={project.name}
            />
          )}
        </div>
        <div
          className="slds-media__body
            slds-border_left
            slds-p-around_small
            slds-grid
            slds-grid_vertical
            content-fill-height"
        >
          <h3
            className="slds-truncate slds-text-heading_small"
            title={project.name}
          >
            {project.name}
          </h3>
          <div className="slds-m-top_small">
            {project.description_rendered ? (
              <div
                className="truncate-children"
                // This description is pre-cleaned by the API
                dangerouslySetInnerHTML={{
                  __html: project.description_rendered,
                }}
              />
            ) : null}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProjectListItem;
