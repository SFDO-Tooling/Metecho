import React from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';

import FourOhFour from '@/components/404';
import { Repository } from '@/store/repositories/reducer';
import routes from '@/utils/routes';

const EpicNotFound = ({ repository }: { repository: Repository }) => (
  <FourOhFour
    message={
      <Trans i18nKey="epicNotFound">
        We can’t find the epic you’re looking for. Try{' '}
        <Link to={routes.repository_detail(repository.slug)}>another epic</Link>{' '}
        from that repository?
      </Trans>
    }
  />
);

export default EpicNotFound;
