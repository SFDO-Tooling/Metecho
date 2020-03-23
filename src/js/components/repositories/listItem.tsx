import Card from '@salesforce/design-system-react/components/card';
import React from 'react';
import { Link } from 'react-router-dom';

import { Repository } from '@/store/repositories/reducer';
import routes from '@/utils/routes';

const RepositoryListItem = ({ repository }: { repository: Repository }) => (
  <Link
    to={routes.repository_detail(repository.slug)}
    className="slds-text-link_reset
      slds-p-around_small
      slds-size_1-of-1
      slds-medium-size_1-of-2
      slds-large-size_1-of-3"
  >
    <Card heading={repository.name} bodyClassName="slds-card__body_inner">
      {repository.description_rendered ? (
        <div
          className="truncate-children slds-p-top_x-small"
          // This description is pre-cleaned by the API
          dangerouslySetInnerHTML={{ __html: repository.description_rendered }}
        />
      ) : null}
    </Card>
  </Link>
);

export default RepositoryListItem;
