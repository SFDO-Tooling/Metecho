import React from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';

import FourOhFour from '@/js/components/404';
import routes from '@/js/utils/routes';

const ProjectNotFound = () => (
  <FourOhFour
    message={
      <Trans i18nKey="projectNotFound">
        We can’t find the project you’re looking for. Try the{' '}
        <Link to={routes.project_list()}>list of all projects</Link>?
      </Trans>
    }
  />
);

export default ProjectNotFound;
