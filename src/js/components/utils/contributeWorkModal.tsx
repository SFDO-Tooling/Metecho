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
import { Org } from '@/js/store/orgs/reducer';
import { Task } from '@/js/store/tasks/reducer';

export type OrgData = Pick<Org, 'id' | 'org_config_name'>;

export type ContributeCallback = (
  orgData: OrgData,
  {
    useExistingTask,
    createEpicLessTask,
  }: {
    useExistingTask?: boolean;
    createEpicLessTask?: boolean;
  },
) => void;

interface Props {
  epic?: Epic;
  task?: Task;
  isOpen: boolean;
  hasPermissions: boolean;
  orgData: OrgData;
  hasDevOrg?: boolean;
  closeModal: () => void;
  doContribute: ContributeCallback;
}

const ContributeWorkModal = ({
  epic,
  task,
  isOpen,
  hasPermissions,
  orgData,
  hasDevOrg,
  closeModal,
  doContribute,
}: Props) => {
  const [useExistingTask, setUseExistingTask] = useState(!hasDevOrg);
  const [createEpicLessTask, setCreateEpicLessTask] = useState(false);

  const doClose = useCallback(() => {
    setUseExistingTask(!hasDevOrg);
    setCreateEpicLessTask(false);
    closeModal();
  }, [closeModal, hasDevOrg]);

  const handleSubmit = useCallback(
    () => doContribute(orgData, { useExistingTask, createEpicLessTask }),
    [doContribute, orgData, useExistingTask, createEpicLessTask],
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
              you’ll start by creating a new Task.
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
              you’ll start by making this Org the Dev Org for <em>this</em> Task
              or a <em>new</em> Task.
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
  } else if (epic) {
    contents = (
      <Trans i18nKey="contributeWorkFromEpic">
        <p>
          <b>To contribute the work you’ve done in your Scratch Org,</b> you’ll
          start by creating a new Task.
        </p>
        <p>
          Your Scratch Org will become the Dev Org for the newly created Task.
        </p>
      </Trans>
    );
  } else {
    const handleEpicLessTaskChange = (
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      if (event.target.value === 'true') {
        setCreateEpicLessTask(true);
      } else {
        setCreateEpicLessTask(false);
      }
    };

    contents = (
      <>
        <Trans i18nKey="contributeWorkFromProject">
          <p>
            <b>To contribute the work you’ve done in your Scratch Org,</b> start
            by creating a new Task (with or without a new Epic).
          </p>
          <p>
            Your Scratch Org will become the Dev Org for the newly created Task.
          </p>
        </Trans>
        <RadioGroup
          assistiveText={{
            label: i18n.t('Select Task Type'),
            required: i18n.t('Required'),
          }}
          className="slds-p-left_none"
          name="project-contribute-work"
          required
          onChange={handleEpicLessTaskChange}
        >
          <Radio
            id="org-epic-and-task"
            labels={{
              label: i18n.t('Create a new Epic and Task'),
            }}
            checked={!createEpicLessTask}
            name="project-contribute-work"
            value="false"
          />
          <Radio
            id="org-epic-less-task"
            labels={{
              label: i18n.t('Create a new Task with no Epic'),
            }}
            checked={createEpicLessTask}
            name="project-contribute-work"
            value="true"
          />
        </RadioGroup>
      </>
    );
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
