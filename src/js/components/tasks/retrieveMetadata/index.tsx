import Button from '@salesforce/design-system-react/components/button';
import Card from '@salesforce/design-system-react/components/card';
import Modal from '@salesforce/design-system-react/components/modal';
import classNames from 'classnames';
import React, { FormEvent, ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import ChangesForm from '@/js/components/tasks/retrieveMetadata/changes';
import TargetDirectoriesForm from '@/js/components/tasks/retrieveMetadata/directories';
import CommitMessageForm from '@/js/components/tasks/retrieveMetadata/message';
import {
  LabelWithSpinner,
  useForm,
  useFormDefaults,
  useIsMounted,
  useTransientMessage,
} from '@/js/components/utils';
import { ThunkDispatch } from '@/js/store';
import { updateObject } from '@/js/store/actions';
import { Changeset, Org } from '@/js/store/orgs/reducer';
import { ApiError } from '@/js/utils/api';
import { OBJECT_TYPES } from '@/js/utils/constants';
import { mergeChangesets, splitChangeset } from '@/js/utils/helpers';

interface Props {
  org: Org;
  isOpen: boolean;
  closeModal: () => void;
}

export interface MetadataCommit {
  changes: Changeset;
  commit_message: string;
  target_directory: string;
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

const RetrieveMetadataModal = ({ org, isOpen, closeModal }: Props) => {
  const { t } = useTranslation();
  const [retrievingChanges, setRetrievingChanges] = useState(false);
  const [ignoringChanges, setIgnoringChanges] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const { showTransientMessage, isShowingTransientMessage } =
    useTransientMessage();
  const isMounted = useIsMounted();
  const dispatch = useDispatch<ThunkDispatch>();

  const nextPage = () => {
    setPageIndex(pageIndex + 1);
  };

  const prevPage = () => {
    setPageIndex(Math.max(pageIndex - 1, 0));
  };

  const handleSuccess = () => {
    /* istanbul ignore else */
    if (isMounted.current) {
      setRetrievingChanges(false);
      closeModal();
      setPageIndex(0);
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
      setRetrievingChanges(false);
      if (fieldErrors.target_directory) {
        setPageIndex(0);
      } else if (fieldErrors.changes) {
        setPageIndex(1);
      } else if (fieldErrors.commit_message) {
        setPageIndex(2);
      }
    }
  };

  const defaultDir = org.valid_target_directories.source?.[0] || 'src';

  const {
    inputs,
    errors,
    handleInputChange,
    setInputs,
    handleSubmit,
    resetForm,
  } = useForm({
    fields: {
      changes: {},
      commit_message: '',
      target_directory: defaultDir,
    } as MetadataCommit,
    objectType: OBJECT_TYPES.COMMIT_METADATA,
    url: window.api_urls.scratch_org_commit(org.id),
    onSuccess: handleSuccess,
    onError: handleError,
    shouldSubscribeToObject: false,
  });

  // When directories change, update default selection
  useFormDefaults({
    field: 'target_directory',
    value: defaultDir,
    inputs,
    setInputs,
  });

  // Separate checked changes into changes/ignored
  const { remaining: changesChecked, removed: ignoredChecked } = splitChangeset(
    inputs.changes,
    org.ignored_changes,
  );
  const numberChangesChecked = Object.values(changesChecked).flat().length;
  const numberIgnoredChecked = Object.values(ignoredChecked).flat().length;
  const onlyIgnoredChecked = Boolean(
    numberIgnoredChecked && !numberChangesChecked,
  );
  const hasCommitMessage = Boolean(inputs.commit_message);
  const dirSelected = Boolean(inputs.target_directory);

  // Secondary action for updating list of ignored changes
  const submitIgnored = () => {
    let data;
    if (onlyIgnoredChecked) {
      const { remaining } = splitChangeset(org.ignored_changes, inputs.changes);
      data = { ignored_changes_write: remaining };
    } else {
      data = {
        ignored_changes_write: mergeChangesets(
          org.ignored_changes,
          inputs.changes,
        ),
      };
    }
    return dispatch(
      updateObject({
        objectType: OBJECT_TYPES.ORG,
        url: window.api_urls.scratch_org_detail(org.id),
        data,
        hasForm: true,
        patch: true,
      }),
    );
  };

  const handleIgnoredSuccess = () => {
    /* istanbul ignore else */
    if (isMounted.current) {
      setInputs({ ...inputs, changes: {} });
      setIgnoringChanges(false);
      showTransientMessage();
    }
  };

  let ignoreLabel: ReactNode = t('Ignore Selected Changes');
  if (ignoringChanges) {
    ignoreLabel = (
      <LabelWithSpinner
        label={t('Saving Ignored Changes…')}
        variant={onlyIgnoredChecked ? 'inverse' : 'base'}
      />
    );
  } else if (onlyIgnoredChecked) {
    ignoreLabel = t('Un-ignore Selected Changes');
  }

  const handleClose = () => {
    closeModal();
    setPageIndex(0);
    resetForm();
  };

  const submitChanges = (e: FormEvent<HTMLFormElement>) => {
    setRetrievingChanges(true);
    handleSubmit(e);
  };

  const saveIgnored = (e: FormEvent<HTMLFormElement>) => {
    setIgnoringChanges(true);
    handleSubmit(e, { action: submitIgnored, success: handleIgnoredSuccess });
  };

  const pages = [
    {
      heading: t('Select the location to retrieve changes'),
      contents: (
        <TargetDirectoriesForm
          key="page-1-contents"
          directories={org.valid_target_directories}
          inputs={inputs as MetadataCommit}
          errors={errors}
          handleInputChange={handleInputChange}
        />
      ),
      footer: (
        <Button
          key="page-1-button-1"
          label={t('Save & Next')}
          variant="brand"
          onClick={nextPage}
          disabled={!dirSelected}
        />
      ),
    },
    {
      heading: t('Select the changes to retrieve or ignore'),
      contents: (
        <ChangesForm
          key="page-2-contents"
          changeset={org.unsaved_changes}
          ignoredChanges={org.ignored_changes}
          inputs={inputs as MetadataCommit}
          changesChecked={changesChecked}
          ignoredChecked={ignoredChecked}
          errors={errors}
          setInputs={setInputs}
          ignoredSuccess={isShowingTransientMessage}
        />
      ),
      footer: [
        <Button
          key="page-2-button-1"
          label={t('Go Back')}
          variant="outline-brand"
          onClick={prevPage}
          disabled={ignoringChanges}
        />,
        <Button
          key="page-2-button-2"
          label={ignoreLabel}
          variant={onlyIgnoredChecked ? 'brand' : 'outline-brand'}
          onClick={saveIgnored}
          disabled={
            !(numberChangesChecked || numberIgnoredChecked) || ignoringChanges
          }
        />,
        <Button
          key="page-2-button-3"
          label={t('Save & Next')}
          variant={onlyIgnoredChecked ? 'outline-brand' : 'brand'}
          onClick={nextPage}
          disabled={
            !(numberChangesChecked || numberIgnoredChecked) || ignoringChanges
          }
        />,
      ],
    },
    {
      heading: t('Describe the changes you are retrieving'),
      contents: (
        <CommitMessageForm
          key="page-3-contents"
          inputs={inputs as MetadataCommit}
          errors={errors}
          handleInputChange={handleInputChange}
        />
      ),
      footer: [
        <Button
          key="page-3-button-1"
          label={t('Go Back')}
          variant="outline-brand"
          onClick={prevPage}
          disabled={retrievingChanges}
        />,
        <Button
          key="page-3-button-2"
          type="submit"
          label={
            retrievingChanges ? (
              <LabelWithSpinner
                label={t('Retrieving Selected Changes…')}
                variant="inverse"
              />
            ) : (
              t('Retrieve Selected Changes')
            )
          }
          variant="brand"
          onClick={submitChanges}
          disabled={retrievingChanges || !hasCommitMessage}
        />,
      ],
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      size="small"
      disableClose={retrievingChanges}
      dismissOnClickOutside={false}
      heading={pages[pageIndex].heading}
      footer={pages[pageIndex].footer}
      assistiveText={{ closeButton: t('Close') }}
      directional={pageIndex > 0}
      onRequestClose={handleClose}
    >
      {pages[pageIndex].contents}
    </Modal>
  );
};

export default RetrieveMetadataModal;
