/* eslint-disable @typescript-eslint/camelcase */
import Icon from '@salesforce/design-system-react/components/icon';
import i18n from 'i18next';
import React from 'react';
import { Link } from 'react-router-dom';

import { ExternalLink } from '@/components/utils/';
import { Project } from '@/store/projects/reducer';
import routes from '@/utils/routes';

interface Props {
  repositorySlug: string;
  project: Project;
}

const ProjectListItem = ({ repositorySlug, project }: Props) => {
  const { name, description_rendered, slug, branch_url, branch_name } = project;

  return (
    <div className="cell-stacked slds-truncate">
      <Link
        to={routes.project_detail(repositorySlug, slug)}
        className="slds-text-heading_small slds-p-bottom_xx-small project-name-link"
      >
        {name}
      </Link>
      {description_rendered && (
        <div
          className="markdown slds-truncate truncate-inner-items"
          dangerouslySetInnerHTML={{ __html: description_rendered }}
        />
      )}
      {branch_url && (
        <p
          className="slds-text-body_small
              slds-p-top_x-small
              slds-text-color_weak
              slds-truncate"
        >
          {i18n.t('Branch:')}{' '}
          <ExternalLink url={branch_url}>
            {branch_name}
            <Icon
              category="utility"
              name="new_window"
              size="xx-small"
              className="slds-m-bottom_xx-small"
              containerClassName="slds-m-left_xx-small"
            />
          </ExternalLink>
        </p>
      )}
    </div>
  );
};

export default ProjectListItem;
