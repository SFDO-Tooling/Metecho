import React from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';

import FourOhFour from '@/components/404';
import { Epic } from '@/store/epics/reducer';
import { Repository } from '@/store/repositories/reducer';
import routes from '@/utils/routes';

interface Props {
  repository: Repository;
  epic: Epic;
}

const TaskNotFound = ({ repository, epic }: Props) => (
  <FourOhFour
    message={
      <Trans i18nKey="taskNotFound">
        We can’t find the task you’re looking for. Try{' '}
        <Link to={routes.epic_detail(repository.slug, epic.slug)}>
          another task
        </Link>{' '}
        from that epic?
      </Trans>
    }
  />
);

export default TaskNotFound;
