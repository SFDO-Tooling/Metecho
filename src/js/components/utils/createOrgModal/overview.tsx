import i18n from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Epic } from '~js/store/epics/reducer';
import { Project } from '~js/store/projects/reducer';
import { Task } from '~js/store/tasks/reducer';
import routes from '~js/utils/routes';

const Overview = ({
  project,
  epic,
  task,
}: {
  project: Project;
  epic?: Epic;
  task?: Task;
}) => {
  let type, name;
  let isProject = false;
  if (task) {
    type = i18n.t('Task');
    name = task.name;
  } else if (epic) {
    type = i18n.t('Epic');
    name = epic.name;
  } else {
    type = i18n.t('Project');
    name = project.name;
    isProject = true;
  }
  const projectUrl = routes.project_detail(project.slug);

  if (isProject) {
    return (
      <div className="slds-p-around_large">
        <Trans i18nKey="createProjectScratchOrgHelp">
          <p>
            <strong>
              You are creating a Scratch Org for {{ type }} “{{ name }}”.
            </strong>
          </p>
          <p>Your new org will expire in 30 days.</p>
          <p>You will be able to access your org from this {{ type }} page.</p>
        </Trans>
      </div>
    );
  }

  return (
    <div className="slds-p-around_large">
      <Trans i18nKey="createScratchOrgHelp">
        <p>
          <strong>
            You are creating a Scratch Org for {{ type }} “{{ name }}”.
          </strong>
        </p>
        <p>Your new org will expire in 30 days.</p>
        <p>
          You will be able to access your org from this {{ type }} page and from
          the <Link to={projectUrl}>project page</Link>.
        </p>
        <br />
        <p>
          If you would like to create a scratch org for the entire project, go
          to the <Link to={projectUrl}>project page</Link> and click “Create
          Scratch Org” in the sidebar.
        </p>
      </Trans>
    </div>
  );
};

export default Overview;
