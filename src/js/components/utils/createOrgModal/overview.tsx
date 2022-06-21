import Card from '@salesforce/design-system-react/components/card';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import seesawSvg from '@/img/seesaw-lg.svg?raw';
import { Illustration } from '@/js/components/utils';
import { Epic } from '@/js/store/epics/reducer';
import { Project } from '@/js/store/projects/reducer';
import { Task } from '@/js/store/tasks/reducer';

const Overview = ({
  project,
  epic,
  task,
}: {
  project: Project;
  epic?: Epic;
  task?: Task;
}) => {
  const { t } = useTranslation();

  let type, name;
  let isProject = false;

  if (task) {
    type = t('Task');
    name = task.name;
  } else if (epic) {
    type = t('Epic');
    name = epic.name;
  } else {
    type = t('Project');
    name = project.name;
    isProject = true;
  }

  // Translation assignment objects are cast to strings because of:
  // https://github.com/i18next/react-i18next/issues/1483
  const help = (
    <Trans i18nKey="createScratchOrgHelp">
      <h2 className="slds-text-title_bold">
        You are creating a Scratch Org for {{ type } as unknown as string} “
        {{ name } as unknown as string}.”
      </h2>
      <p>
        Your new Org will expire in 30 days.
        <br />
        You will be able to access your Org from this{' '}
        {{ type } as unknown as string} page.
      </p>
    </Trans>
  );

  const cannotContributeWarning = (
    <Trans i18nKey="createScratchOrgContributeWarning">
      <p>
        <strong>
          You will not be able to retrieve any changes made in this Scratch Org.
        </strong>
      </p>
    </Trans>
  );

  return (
    <div className="slds-grid slds-wrap slds-p-around_medium">
      <div
        className="slds-p-around_small
          slds-size_1-of-1
          slds-small-size_2-of-5"
      >
        <Card
          className="slds-card_boundary"
          bodyClassName="slds-card__body_inner"
          hasNoHeader
        >
          <Illustration svg={seesawSvg} />
        </Card>
      </div>
      <div
        className="slds-p-around_small
          slds-size_1-of-1
          slds-small-size_3-of-5
          slds-text-longform"
      >
        {help}
        {isProject && (
          <Trans i18nKey="createProjectScratchOrgHelp">
            <p>
              Visit an Epic or Task to create a Scratch Org from a work in
              progress.
            </p>
          </Trans>
        )}
        {!project.has_push_permission && cannotContributeWarning}
      </div>
    </div>
  );
};

export default Overview;
