import React from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';

import FourOhFour from '@/js/components/404';
import { Epic } from '@/js/store/epics/reducer';
import { Project } from '@/js/store/projects/reducer';
import routes from '@/js/utils/routes';

interface Props {
  project: Project;
  epic?: Epic | null;
}

const TaskNotFound = ({ project, epic }: Props) => (
  <FourOhFour
    message={
      epic ? (
        <Trans i18nKey="epicTaskNotFound">
          We can’t find the Task you’re looking for. Try{' '}
          <Link to={routes.epic_detail(project.slug, epic.slug)}>
            another Task
          </Link>{' '}
          from that Epic?
        </Trans>
      ) : (
        <Trans i18nKey="projectTaskNotFound">
          We can’t find the Task you’re looking for. Try{' '}
          <Link to={routes.project_detail(project.slug)}>another Task</Link>{' '}
          from that Project?
        </Trans>
      )
    }
  />
);

export default TaskNotFound;
