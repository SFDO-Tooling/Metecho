import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import { isEmpty, isEqual, sortBy, toLower } from 'lodash';
import React, {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import CommitMessageForm from '@/js/components/tasks/retrieveOmnistudio/message';
import { LabelWithSpinner, useForm, useIsMounted } from '@/js/components/utils';
import { ThunkDispatch } from '@/js/store';
import { ApiError } from '@/js/utils/api';
import { OBJECT_TYPES } from '@/js/utils/constants';

interface Props {
  orgId: string;
  isOpen: boolean;
  closeModal: () => void;
}

export interface OmnistudioCommit {
  yaml_path: string;
  commit_message: string;
}

export interface BooleanObject {
  [key: string]: boolean;
}

const RetrieveOmnistudioModal = ({ orgId, isOpen, closeModal }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<ThunkDispatch>();
  const [retrievingOmnistudio, setRetrievingOmnistudio] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [hasError] = useState(false);
  const isMounted = useIsMounted();

  const nextPage = () => {
    setPageIndex(pageIndex + 1);
  };

  const prevPage = () => {
    setPageIndex(Math.max(pageIndex - 1, 0));
  };

  const handleSuccess = () => {
    /* istanbul ignore else */
    if (isMounted.current) {
      setRetrievingOmnistudio(false);
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
      setRetrievingOmnistudio(false);
      if (fieldErrors.yaml_path) {
        setPageIndex(0);
      } else if (fieldErrors.commit_message) {
        setPageIndex(0);
      }
    }
  };

  const { inputs, errors, handleInputChange, handleSubmit, resetForm } =
    useForm({
      fields: {
        yaml_path: '',
        commit_message: '',
      } as OmnistudioCommit,
      objectType: OBJECT_TYPES.COMMIT_OMNISTUDIO,
      url: window.api_urls.scratch_org_commit_dataset(orgId),
      onSuccess: handleSuccess,
      onError: handleError,
      shouldSubscribeToObject: false,
    });

  const hasCommitMessage = Boolean(inputs.commit_message);
  const hasYamlPath = Boolean(inputs.yaml_path);

  const handleClose = () => {
    closeModal();
    setPageIndex(0);
    resetForm();
  };

  const submitChanges = (e: FormEvent<HTMLFormElement>) => {
    setRetrievingOmnistudio(true);
    handleSubmit(e);
  };

  const pages = [
    {
      size: 'small',
      heading: t('Describe the Omnistudio configuration you are retrieving.'),
      contents: (
        <CommitMessageForm
          inputs={inputs as OmnistudioCommit}
          errors={errors}
          handleInputChange={handleInputChange}
        />
      ),
      footer: [
        <Button
          key="page-1-button-2"
          type="submit"
          label={
            retrievingOmnistudio ? (
              <LabelWithSpinner
                label={t('Retrieving Omnistudio Configuration…')}
                variant="inverse"
              />
            ) : (
              t('Retrieve Omnistudio Configuration')
            )
          }
          variant="brand"
          onClick={submitChanges}
          disabled={
            retrievingOmnistudio ||
            !hasCommitMessage ||
            !hasYamlPath ||
            hasError
          }
        />,
      ],
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      size={pages[pageIndex].size || 'small'}
      disableClose={retrievingOmnistudio}
      dismissOnClickOutside={false}
      heading={pages[pageIndex].heading}
      footer={pages[pageIndex].footer}
      assistiveText={{ closeButton: t('Close') }}
      directional
      onRequestClose={handleClose}
    >
      {pages[pageIndex].contents}
    </Modal>
  );
};

export default RetrieveOmnistudioModal;
