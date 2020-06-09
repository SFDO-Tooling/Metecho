import Avatar from '@salesforce/design-system-react/components/avatar';
import i18n from 'i18next';
import React from 'react';
import { Link } from 'react-router-dom';

import { Repository } from '@/store/repositories/reducer';
import routes from '@/utils/routes';

const RepositoryListItem = ({ repository }: { repository: Repository }) => (
  <div
    className="ms-repo-item
      slds-p-around_small
      slds-size_1-of-1
      slds-medium-size_1-of-2
      slds-large-size_1-of-3"
  >
    <Link
      to={routes.repository_detail(repository.slug)}
      className="slds-box
        slds-box_link
        slds-box_x-small
        slds-theme_default
        slds-media
        container-fill-space"
    >
      <div className="slds-media__figure slds-m-left_xx-small">
        {repository.repo_image_url ? (
          <div>
            <img
              src={repository.repo_image_url}
              alt={`${i18n.t('social image for')} ${repository.name}`}
            />
          </div>
        ) : (
          <Avatar
            variant="entity"
            size="large"
            label={repository.name}
            title={repository.name}
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
        <h2
          className="slds-truncate slds-text-heading_small"
          title={repository.name}
        >
          {repository.name}
        </h2>
        <div className="slds-m-top_small">
          {repository.description_rendered ? (
            <div
              className="truncate-children"
              // This description is pre-cleaned by the API
              dangerouslySetInnerHTML={{
                __html: repository.description_rendered,
              }}
            />
          ) : null}
        </div>
      </div>
    </Link>
  </div>
);

export default RepositoryListItem;
