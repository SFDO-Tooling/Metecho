import React from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';

import FourOhFour from '@/js/components/404';
import { Epic } from '@/js/store/epics/reducer';
import { Project } from '@/js/store/projects/reducer';
import routes from '@/js/utils/routes';

interface Props {
  project: Project;
  epic: Epic;
}

const TaskNotFound = ({ project, epic }: Props) => (
  <FourOhFour
    message={
      <Trans i18nKey="taskNotFound">
        We can’t find the task you’re looking for. Try{' '}
        <Link to={routes.epic_detail(project.slug, epic.slug)}>
          another task
        </Link>{' '}
        from that epic?
      </Trans>
    }
  />
);

export default TaskNotFound;
