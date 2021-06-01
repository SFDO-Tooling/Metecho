import Button from '@salesforce/design-system-react/components/button';
import Card from '@salesforce/design-system-react/components/card';
import Modal from '@salesforce/design-system-react/components/modal';
import i18n from 'i18next';
import React from 'react';
import { Trans } from 'react-i18next';

import mapSvg from '!raw-loader!~img/map-lg.svg';
import { Illustration } from '~js/components/utils';
import { Epic } from '~js/store/epics/reducer';
import { Project } from '~js/store/projects/reducer';
import { Task } from '~js/store/tasks/reducer';

interface Props {
  project?: Project;
  epic?: Epic;
  task?: Task;
  isOpen: boolean;
  hasPermissions: boolean;
  closeModal: () => void;
  doContribute: () => void;
}

const ContributeWorkModal = ({
  project,
  epic,
  task,
  isOpen,
  hasPermissions,
  closeModal,
  doContribute,
}: Props) => {
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
  } /* istanbul ignore next */ else if (task) {
    // @@@
  } /* istanbul ignore else */ else if (epic) {
    contents = (
      <Trans i18nKey="contributeWorkFromEpic">
        <p>
          <b>To contribute the work you’ve done in your scratch org,</b> you’ll
          start by creating a new task.
        </p>
        <p>
          Your scratch org will become the Dev Org for the newly created task.
        </p>
      </Trans>
    );
  } /* istanbul ignore next */ else if (project) {
    // @@@
  }

  return (
    <Modal
      isOpen={isOpen}
      size="small"
      heading={i18n.t('Contribute Work from Scratch Org')}
      footer={[
        <Button key="cancel" label={i18n.t('Cancel')} onClick={closeModal} />,
        hasPermissions ? (
          <Button
            key="submit"
            label={i18n.t('Contribute')}
            variant="brand"
            onClick={doContribute}
          />
        ) : null,
      ]}
      prompt={hasPermissions ? null : 'warning'}
      onRequestClose={closeModal}
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
