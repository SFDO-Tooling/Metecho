import React from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';

import FourOhFour from '@/components/404';
import { Project } from '@/store/projects/reducer';
import { Repository } from '@/store/repositories/reducer';
import routes from '@/utils/routes';

interface Props {
  repository: Repository;
  project: Project;
}

const TaskNotFound = ({ repository, project }: Props) => (
  <FourOhFour
    message={
      <Trans i18nKey="taskNotFound">
        We can’t find the task you’re looking for. Try{' '}
        <Link to={routes.project_detail(repository.slug, project.slug)}>
          another task
        </Link>{' '}
        from that project?
      </Trans>
    }
  />
);

export default TaskNotFound;
