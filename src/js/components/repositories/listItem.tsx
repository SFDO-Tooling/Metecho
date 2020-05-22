import Avatar from '@salesforce/design-system-react/components/avatar';
import VisualPicker from '@salesforce/design-system-react/components/visual-picker';
import VisualPickerLink from '@salesforce/design-system-react/components/visual-picker/link';
import i18n from 'i18next';
import React from 'react';

import { Repository } from '@/store/repositories/reducer';
import routes from '@/utils/routes';

const RepositoryListItem = ({ repository }: { repository: Repository }) => (
  <div data-form="repo-select">
    <VisualPicker
      size="large"
      id={repository.slug}
      className="slds-text-link_reset
      slds-p-around_small
      slds-size_1-of-1
      slds-medium-size_1-of-2
      slds-large-size_1-of-3"
    >
      <VisualPickerLink
        href={routes.repository_detail(repository.slug)}
        icon={
          <Avatar
            variant="entity"
            label={repository.name}
            size="large"
            imgSrc={repository.repo_image_url}
            imgAlt={`${i18n.t('Image for')} ${repository.name}`}
          />
        }
        title={repository.name}
        links
        description={
          repository.description_rendered ? (
            <span
              className="truncate-children slds-p-top_x-small"
              // This description is pre-cleaned by the API
              dangerouslySetInnerHTML={{
                __html: repository.description_rendered,
              }}
            />
          ) : null
        }
      ></VisualPickerLink>
    </VisualPicker>
  </div>
);

export default RepositoryListItem;
