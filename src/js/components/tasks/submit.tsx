import React, { useState } from 'react';
import { Trans } from 'react-i18next';
import i18n from 'i18next';
import Modal from '@salesforce/design-system-react/components/modal';
import Button from '@salesforce/design-system-react/components/button';
import Textarea from '@salesforce/design-system-react/components/textarea';

const SubmitModal = ({ isOpen, toggleModal }) => {
  const handleTaskSubmit = () => {
    console.log('submit');
  };
  const handleClose = () => {
    toggleModal(false);
  };
  const handleCancel = () => {
    toggleModal(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      heading={i18n.t('Submit this task for review')}
      footer={[
        <Button
          key="back"
          label={i18n.t('Cancel Submit')}
          onClick={handleCancel}
        />,
        <Button
          key="submit"
          label={i18n.t('Submit Task for Review')}
          variant="brand"
          onClick={() => console.log('Submit Task for Review')}
        />,
      ]}
      onRequestClose={handleClose}
      headerClassName="test"
    >
      <form className="slds-p-around_large" onSubmit={handleTaskSubmit}>
        <h2>
          <Trans i18nKey="releaseNotesInfo">
            Details entered will be used when publishing release notes. Please
            use markdown to format your notes.
          </Trans>
        </h2>
        <Textarea
          id="unique-id-1"
          label={i18n.t(
            'Describe any critical changes which might impact existing functionality',
          )}
        />
        <Textarea
          id="unique-id-1"
          label={i18n.t(
            'Describe any changes including instructions to users for any post-upgrade tasks.',
          )}
        />
        <Textarea
          id="unique-id-1"
          label={i18n.t(
            'Which, if any, issue swere closed (include issue #number)',
          )}
        />
        <Textarea id="unique-id-1" label={i18n.t('Developer notes')} />
      </form>
    </Modal>
  );
};

export default SubmitModal;
