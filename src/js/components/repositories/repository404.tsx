import React from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';

import FourOhFour from '@/components/404';
import routes from '@/utils/routes';

const RepositoryNotFound = () => (
  <FourOhFour
    message={
      <Trans i18nKey="repositoryNotFound">
        We can’t find the repository you’re looking for. Try the{' '}
        <Link to={routes.repository_list()}>list of all repositories</Link>?
      </Trans>
    }
  />
);

export default RepositoryNotFound;
