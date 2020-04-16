import Button from '@salesforce/design-system-react/components/button';
import Card from '@salesforce/design-system-react/components/card';
import Modal from '@salesforce/design-system-react/components/modal';
import classNames from 'classnames';
import i18n from 'i18next';
import { omit } from 'lodash';
import React, { ReactNode, useState } from 'react';

import ChangesForm from '@/components/tasks/capture/changes';
import TargetDirectoriesForm from '@/components/tasks/capture/directories';
import CommitMessageForm from '@/components/tasks/capture/message';
import {
  LabelWithSpinner,
  useForm,
  useFormDefaults,
  useIsMounted,
} from '@/components/utils';
import { Changeset, TargetDirectories } from '@/store/orgs/reducer';
import { ApiError } from '@/utils/api';
import { OBJECT_TYPES } from '@/utils/constants';

interface Props {
  orgId: string;
  changeset: Changeset;
  ignoredChanges: Changeset;
  directories: TargetDirectories;
  isOpen: boolean;
  toggleModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface CommitData {
  changes: Changeset;
  commit_message: string;
  target_directory: string;
  ignored_changes: Changeset;
}

export interface BooleanObject {
  [key: string]: boolean;
}

export const ModalCard = ({
  heading,
  noBodyPadding,
  children,
}: {
  heading?: JSX.Element;
  noBodyPadding?: boolean;
  children: ReactNode;
}) => (
  <Card
    className="slds-card_boundary"
    bodyClassName={classNames({
      'slds-m-vertical_none': noBodyPadding,
    })}
    heading={heading}
    hasNoHeader={!heading}
  >
    {heading ? <hr className="slds-m-vertical_none" /> : null}
    <div
      className={classNames({
        'slds-p-horizontal_medium': !noBodyPadding,
        'slds-m-vertical_small': !noBodyPadding,
      })}
    >
      {children}
    </div>
  </Card>
);

const CaptureModal = ({
  orgId,
  changeset,
  directories,
  ignoredChanges,
  isOpen,
  toggleModal,
}: Props) => {
  const [capturingChanges, setCapturingChanges] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const isMounted = useIsMounted();

  const prevPage = () => {
    setPageIndex(pageIndex - 1 || 0);
  };

  const handleSuccess = () => {
    /* istanbul ignore else */
    if (isMounted.current) {
      setCapturingChanges(false);
      toggleModal(false);
      setPageIndex(0);
    }
  };
  const handleIgnoredSuccess = () => {
    console.log('gonna handle success here!');
  };

  // eslint-disable-next-line handle-callback-err
  const handleError = (
    err: ApiError,
    fieldErrors: { [key: string]: string },
  ) => {
    /* istanbul ignore else */
    if (isMounted.current) {
      setCapturingChanges(false);
      if (fieldErrors.target_directory) {
        setPageIndex(0);
      } else if (fieldErrors.changes) {
        setPageIndex(1);
      } else if (fieldErrors.commit_message) {
        setPageIndex(2);
      }
    }
  };

  const defaultDir = directories.source?.[0] || 'src';
  const defaultIgnoredChanges = ignoredChanges;

  const {
    inputs,
    errors,
    handleInputChange,
    setInputs,
    handleSubmit: submitCommit,
    resetForm,
  } = useForm({
    fields: {
      changes: {},
      commit_message: '',
      target_directory: defaultDir,
    } as CommitData,
    objectType: OBJECT_TYPES.COMMIT,
    url: window.api_urls.scratch_org_commit(orgId),
    onSuccess: handleSuccess,
    onError: handleError,
    shouldSubscribeToObject: false,
  });

  const { inputs: ignoredInputs, handleSubmit: submitIgnored } = useForm({
    fields: {
      ignored_changes: defaultIgnoredChanges,
    },
    objectType: OBJECT_TYPES.ORG,
    url: window.api_urls.scratch_org_detail(orgId),
    onSuccess: handleIgnoredSuccess,
    onError: handleError,
    shouldSubscribeToObject: false,
    update: true,
  });

  // When directories change, update default selection
  useFormDefaults({
    field: 'target_directory',
    value: defaultDir,
    inputs,
    setInputs,
  });

  useFormDefaults({
    field: 'ignored_changes',
    value: defaultIgnoredChanges,
    inputs,
    setInputs,
  });

  const dirSelected = Boolean(inputs.target_directory);
  const hasCommitMessage = Boolean(inputs.commit_message);
  const changesChecked = Object.values(inputs.changes).flat().length;
  const ignoredChecked = Object.values(ignoredInputs.ignored_changes).flat()
    .length;
  const bothChecked = changesChecked && ignoredChecked;

  const nextPage = () => {
    setPageIndex(pageIndex + 1);
  };

  const saveIgnored = (e: React.FormEvent<HTMLFormElement>) => {
    submitIgnored(e);
  };

  const handleClose = () => {
    toggleModal(false);
    setPageIndex(0);
    resetForm();
  };

  const submitChanges = (e: React.FormEvent<HTMLFormElement>) => {
    setCapturingChanges(true);
    submitCommit(e);
  };

  const pages = [
    {
      heading: i18n.t('Select the location to retrieve changes'),
      contents: (
        <TargetDirectoriesForm
          key="page-1-contents"
          directories={directories}
          inputs={inputs as CommitData}
          errors={errors}
          handleInputChange={handleInputChange}
        />
      ),
      footer: (
        <Button
          key="page-1-button-1"
          label={i18n.t('Save & Next')}
          variant="brand"
          onClick={nextPage}
          disabled={!dirSelected}
        />
      ),
    },
    {
      heading: i18n.t('Select the changes to retrieve or ignore'),
      contents: (
        <ChangesForm
          key="page-2-contents"
          changeset={changeset}
          ignoredChanges={ignoredChanges}
          inputs={inputs as CommitData}
          ignoredInputs={ignoredInputs}
          errors={errors}
          setInputs={setInputs}
        />
      ),
      footer: [
        <Button
          key="page-2-button-1"
          label={i18n.t('Go Back')}
          variant="outline-brand"
          onClick={prevPage}
        />,
        <Button
          key="page-2-button-2"
          label={
            // eslint-disable-next-line no-nested-ternary
            ignoredChecked
              ? changesChecked
                ? i18n.t('Ignore')
                : i18n.t('Un-ignore')
              : i18n.t('Ignore Selected Changes')
          }
          variant={ignoredChecked ? 'brand' : 'outline-brand'}
          onClick={saveIgnored}
          disabled={!changesChecked && !ignoredChecked}
        />,
        <Button
          key="page-2-button-3"
          label={i18n.t('Save & Next')}
          variant={bothChecked ? 'outline-brand' : 'brand'}
          onClick={saveIgnored}
          disabled={!changesChecked}
        />,
      ],
    },
    {
      heading: i18n.t('Describe the changes you are retrieving'),
      contents: (
        <CommitMessageForm
          key="page-3-contents"
          inputs={inputs as CommitData}
          errors={errors}
          handleInputChange={handleInputChange}
        />
      ),
      footer: [
        <Button
          key="page-3-button-1"
          label={i18n.t('Go Back')}
          variant="outline-brand"
          onClick={prevPage}
          disabled={capturingChanges}
        />,
        <Button
          key="page-3-button-2"
          type="submit"
          label={
            capturingChanges ? (
              <LabelWithSpinner
                label={i18n.t('Retrieving Selected Changes…')}
                variant="inverse"
              />
            ) : (
              i18n.t('Retrieve Selected Changes')
            )
          }
          variant="brand"
          onClick={submitChanges}
          disabled={capturingChanges || !hasCommitMessage}
        />,
      ],
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      size="small"
      disableClose={capturingChanges}
      heading={pages[pageIndex].heading}
      footer={pages[pageIndex].footer}
      directional={pageIndex > 0}
      onRequestClose={handleClose}
    >
      {pages[pageIndex].contents}
    </Modal>
  );
};

export default CaptureModal;
