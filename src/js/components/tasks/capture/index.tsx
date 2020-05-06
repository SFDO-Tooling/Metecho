import Button from '@salesforce/design-system-react/components/button';
import Card from '@salesforce/design-system-react/components/card';
import Modal from '@salesforce/design-system-react/components/modal';
import classNames from 'classnames';
import i18n from 'i18next';
import { omit } from 'lodash';
import React, { ReactNode, useEffect, useRef, useState } from 'react';

import ChangesForm from '@/components/tasks/capture/changes';
import TargetDirectoriesForm from '@/components/tasks/capture/directories';
import CommitMessageForm from '@/components/tasks/capture/message';
import {
  LabelWithSpinner,
  useForm,
  useFormDefaults,
  useIsMounted,
} from '@/components/utils';
import { Changeset, Org } from '@/store/orgs/reducer';
import { ApiError } from '@/utils/api';
import { OBJECT_TYPES } from '@/utils/constants';

interface Props {
  org: Org;
  isOpen: boolean;
  toggleModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface CommitData {
  changes: Changeset;
  commit_message: string;
  target_directory: string;
}

export interface IgnoredChangesData {
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

const CaptureModal = ({ org, isOpen, toggleModal }: Props) => {
  const [capturingChanges, setCapturingChanges] = useState(false);
  const [ignoringChanges, setIgnoringChanges] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [ignoredSuccess, setIgnoredSuccess] = useState(false);
  const isMounted = useIsMounted();

  const nextPage = () => {
    setPageIndex(pageIndex + 1);
  };

  const prevPage = () => {
    setPageIndex(pageIndex - 1 || 0);
  };

  // success timeout after ignoring changes
  const successTimeout = useRef<NodeJS.Timeout | null>(null);
  const clearSuccessTimeout = () => {
    if (typeof successTimeout.current === 'number') {
      clearTimeout(successTimeout.current);
      successTimeout.current = null;
    }
  };
  useEffect(
    () => () => {
      clearSuccessTimeout();
    },
    [],
  );

  const handleSuccess = () => {
    /* istanbul ignore else */
    if (isMounted.current) {
      setCapturingChanges(false);
      toggleModal(false);
      setPageIndex(0);
    }
  };

  const handleIgnoredSuccess = () => {
    /* istanbul ignore else */
    if (isMounted.current) {
      setIgnoringChanges(false);
      setIgnoredSuccess(true);
      successTimeout.current = setTimeout(() => {
        setIgnoredSuccess(false);
      }, 3000);
    }
  };

  // eslint-disable-next-line handle-callback-err
  const handleError = (
    err: ApiError,
    fieldErrors: { [key: string]: string },
  ) => {
    /* istanbul ignore else */
    if (isMounted.current) {
      setIgnoringChanges(false);
      setCapturingChanges(false);
      if (fieldErrors.target_directory) {
        setPageIndex(0);
      } else if (fieldErrors.changes || fieldErrors.ignored_changes) {
        setPageIndex(1);
      } else if (fieldErrors.commit_message) {
        setPageIndex(2);
      }
    }
  };

  const defaultDir = org.valid_target_directories.source?.[0] || 'src';
  const defaultIgnoredChanges = org.ignored_changes;

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
    url: window.api_urls.scratch_org_commit(org.id),
    onSuccess: handleSuccess,
    onError: handleError,
    shouldSubscribeToObject: false,
  });

  const {
    inputs: ignoredInputs,
    errors: ignoredErrors,
    setInputs: setIgnoredInputs,
    handleSubmit: submitIgnored,
    resetForm: resetIgnoredForm,
  } = useForm({
    fields: {
      ignored_changes: defaultIgnoredChanges,
    } as IgnoredChangesData,
    additionalData: omit(org, ['ignored_changes']),
    objectType: OBJECT_TYPES.ORG,
    onSuccess: handleIgnoredSuccess,
    onError: handleError,
    update: true,
  });

  // When default values change, update selections
  useFormDefaults({
    field: 'target_directory',
    value: defaultDir,
    inputs,
    setInputs,
  });
  useFormDefaults({
    field: 'ignored_changes',
    value: defaultIgnoredChanges,
    inputs: ignoredInputs,
    setInputs: setIgnoredInputs,
  });

  const dirSelected = Boolean(inputs.target_directory);
  const changesChecked = Object.values(inputs.changes).flat().length;
  const ignoredChecked = Object.values(ignoredInputs.ignored_changes).flat()
    .length;
  const onlyIgnoredChecked = ignoredChecked && !changesChecked;
  const hasCommitMessage = Boolean(inputs.commit_message);

  let ignoreLabel: React.ReactNode = i18n.t('Ignore Selected Changes');
  if (ignoringChanges) {
    ignoreLabel = (
      <LabelWithSpinner
        label={i18n.t('Saving Ignored Changes…')}
        variant={onlyIgnoredChecked ? 'inverse' : 'base'}
      />
    );
  } else if (onlyIgnoredChecked) {
    ignoreLabel = i18n.t('Un-ignore Selected Changes');
  }

  const handleClose = () => {
    toggleModal(false);
    setPageIndex(0);
    resetForm();
    resetIgnoredForm();
  };

  const submitChanges = (e: React.FormEvent<HTMLFormElement>) => {
    setCapturingChanges(true);
    submitCommit(e);
  };

  const saveIgnored = (e: React.FormEvent<HTMLFormElement>) => {
    setIgnoringChanges(true);
    submitIgnored(e);
  };

  const pages = [
    {
      heading: i18n.t('Select the location to retrieve changes'),
      contents: (
        <TargetDirectoriesForm
          key="page-1-contents"
          directories={org.valid_target_directories}
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
          changeset={org.unsaved_changes}
          ignoredChanges={org.ignored_changes}
          inputs={inputs as CommitData}
          ignoredInputs={ignoredInputs as IgnoredChangesData}
          errors={errors}
          ignoredErrors={ignoredErrors}
          setInputs={setInputs}
          setIgnoredInputs={setIgnoredInputs}
          ignoredSuccess={ignoredSuccess}
        />
      ),
      footer: [
        <Button
          key="page-2-button-1"
          label={i18n.t('Go Back')}
          variant="outline-brand"
          onClick={prevPage}
          disabled={ignoringChanges}
        />,
        <Button
          key="page-2-button-2"
          label={ignoreLabel}
          variant={onlyIgnoredChecked ? 'brand' : 'outline-brand'}
          onClick={saveIgnored}
          disabled={!(changesChecked || ignoredChecked) || ignoringChanges}
        />,
        <Button
          key="page-2-button-3"
          label={i18n.t('Save & Next')}
          variant={onlyIgnoredChecked ? 'outline-brand' : 'brand'}
          onClick={nextPage}
          disabled={!changesChecked || ignoringChanges}
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
      size="medium"
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
