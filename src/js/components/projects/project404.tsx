import FourOhFour from '_js/components/404';
import routes from '_js/utils/routes';
import React from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';

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
