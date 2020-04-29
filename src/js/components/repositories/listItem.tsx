import VisualPicker from '@salesforce/design-system-react/components/visual-picker';
import VisualPickerLink from '@salesforce/design-system-react/components/visual-picker/link';
import React from 'react';

import { Repository } from '@/store/repositories/reducer';
import routes from '@/utils/routes';

const RepositoryListItem = ({ repository }: { repository: Repository }) => (
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
        <img
          src="https://via.placeholder.com/75"
          alt="Placeholder image till we get it from the API"
        />
      }
      title={repository.name}
      className="bar"
      links
      description={
        repository.description_rendered ? (
          <div
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
);

export default RepositoryListItem;
