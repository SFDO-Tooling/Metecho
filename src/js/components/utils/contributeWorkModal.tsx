import Button from '@salesforce/design-system-react/components/button';
import Card from '@salesforce/design-system-react/components/card';
import Modal from '@salesforce/design-system-react/components/modal';
import RadioGroup from '@salesforce/design-system-react/components/radio-group';
import Radio from '@salesforce/design-system-react/components/radio-group/radio';
import i18n from 'i18next';
import React, { useCallback, useState } from 'react';
import { Trans } from 'react-i18next';

import mapSvg from '@/img/map-lg.svg?raw';
import { Illustration } from '@/js/components/utils';
import { Epic } from '@/js/store/epics/reducer';
import { Project } from '@/js/store/projects/reducer';
import { Task } from '@/js/store/tasks/reducer';

type ContributeCallback = ({
  id,
  useExistingTask,
}: {
  id: string;
  useExistingTask: boolean;
}) => void;

interface Props {
  project?: Project;
  epic?: Epic;
  task?: Task;
  isOpen: boolean;
  hasPermissions: boolean;
  orgId: string;
  hasDevOrg?: boolean;
  closeModal: () => void;
  doContribute: ContributeCallback;
}

const ContributeWorkModal = ({
  project,
  epic,
  task,
  isOpen,
  hasPermissions,
  orgId,
  hasDevOrg,
  closeModal,
  doContribute,
}: Props) => {
  const [useExistingTask, setUseExistingTask] = useState(!hasDevOrg);

  const doClose = useCallback(() => {
    setUseExistingTask(!hasDevOrg);
    closeModal();
  }, [closeModal, hasDevOrg]);

  const handleSubmit = useCallback(
    () => doContribute({ id: orgId, useExistingTask }),
    [doContribute, orgId, useExistingTask],
  );

  let contents = null;
  if (!hasPermissions) {
    contents = (
      <Trans i18nKey="cannotContributeWork">
        <p>
          <b>
            You do not have “push” access to the GitHub repository for this
            Project,
          </b>{' '}
          and cannot contribute changes in Metecho.
        </p>
        <p>
          Contact an admin for the repository on GitHub to grant additional
          permissions, then refresh this page to try again.
        </p>
      </Trans>
    );
  } else if (task) {
    const handleTaskSelectChange = (
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      if (event.target.value === 'true') {
        setUseExistingTask(true);
      } else {
        setUseExistingTask(false);
      }
    };

    contents = (
      <>
        {hasDevOrg ? (
          <Trans i18nKey="contributeWorkFromTaskWithDevOrg">
            <p>
              <b>To contribute the work you’ve done in your Scratch Org,</b>{' '}
              you’ll start by creating a new task.
            </p>
            <p>
              You cannot convert your Scratch Org into the Dev Org for this Task
              because there is already an existing Dev Org.
            </p>
          </Trans>
        ) : (
          <p>
            <Trans i18nKey="contributeWorkFromTask">
              <b>To contribute the work you’ve done in your Scratch Org,</b>{' '}
              you’ll start by making this org the Dev Org for <em>this</em> task
              or a <em>new</em> task.
            </Trans>
          </p>
        )}
        <RadioGroup
          assistiveText={{
            label: i18n.t('Select Task Type'),
            required: i18n.t('Required'),
          }}
          className="slds-p-left_none"
          name="task-contribute-work"
          required
          onChange={handleTaskSelectChange}
          disabled={hasDevOrg}
        >
          <Radio
            id="org-current-task"
            labels={{
              label: i18n.t('Convert Scratch Org into Dev Org for this Task'),
            }}
            checked={useExistingTask}
            name="task-contribute-work"
            value="true"
          />
          <Radio
            id="org-new-task"
            labels={{
              label: i18n.t('Convert Scratch Org into Dev Org on a new Task'),
            }}
            checked={!useExistingTask}
            name="task-contribute-work"
            value="false"
          />
        </RadioGroup>
      </>
    );
  } else {
    /* istanbul ignore else */
    // eslint-disable-next-line no-lonely-if
    if (epic) {
      contents = (
        <Trans i18nKey="contributeWorkFromEpic">
          <p>
            <b>To contribute the work you’ve done in your Scratch Org,</b>{' '}
            you’ll start by creating a new task.
          </p>
          <p>
            Your Scratch Org will become the Dev Org for the newly created task.
          </p>
        </Trans>
      );
    } else if (project) {
      // @@@ Add this when project Scratch Orgs can be converted...
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      size="small"
      heading={i18n.t('Contribute Work from Scratch Org')}
      footer={[
        <Button key="cancel" label={i18n.t('Cancel')} onClick={doClose} />,
        hasPermissions ? (
          <Button
            key="submit"
            label={i18n.t('Contribute')}
            variant="brand"
            onClick={handleSubmit}
          />
        ) : null,
      ]}
      prompt={hasPermissions ? undefined : 'warning'}
      onRequestClose={doClose}
    >
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
            <Illustration svg={mapSvg} />
          </Card>
        </div>
        <div
          className="slds-p-around_small
            slds-size_1-of-1
            slds-small-size_3-of-5
            slds-text-longform"
        >
          {contents}
        </div>
      </div>
    </Modal>
  );
};

export default ContributeWorkModal;
