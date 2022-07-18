import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

// import ChangesForm from '@/js/components/tasks/retrieveDataset/changes';
import SelectDatasetForm from '@/js/components/tasks/retrieveDataset/datasets';
// import CommitMessageForm from '@/js/components/tasks/retrieveDataset/message';
import { LabelWithSpinner, useForm, useIsMounted } from '@/js/components/utils';
import { ThunkDispatch } from '@/js/store';
import { refreshDatasetSchema } from '@/js/store/orgs/actions';
import { refreshDatasets } from '@/js/store/tasks/actions';
import { DatasetObject, Datasets } from '@/js/store/tasks/reducer';
import { ApiError } from '@/js/utils/api';
import { OBJECT_TYPES } from '@/js/utils/constants';

interface Props {
  projectId: string;
  taskId: string;
  orgId: string;
  datasets: Datasets;
  datasetErrors: string[];
  schema: DatasetObject[];
  fetchingDatasets: boolean;
  fetchingSchema: boolean;
  isOpen: boolean;
  closeModal: () => void;
}

export interface DatasetCommit {
  dataset_name: string;
  dataset_definition: DatasetObject[];
  commit_message: string;
}

export interface BooleanObject {
  [key: string]: boolean;
}

const RetrieveDatasetModal = ({
  projectId,
  taskId,
  orgId,
  datasets,
  datasetErrors,
  schema,
  fetchingDatasets,
  fetchingSchema,
  isOpen,
  closeModal,
}: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<ThunkDispatch>();
  const [retrievingDataset, setRetrievingDataset] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
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
      setRetrievingDataset(false);
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
      setRetrievingDataset(false);
      if (fieldErrors.dataset) {
        setPageIndex(0);
      } else if (fieldErrors.changes) {
        setPageIndex(1);
      } else if (fieldErrors.commit_message) {
        setPageIndex(2);
      }
    }
  };

  const {
    inputs,
    errors,
    handleInputChange,
    setInputs,
    handleSubmit,
    resetForm,
  } = useForm({
    fields: {
      dataset_name: '',
      dataset_definition: {},
      commit_message: '',
    } as DatasetCommit,
    objectType: OBJECT_TYPES.COMMIT_DATASET,
    url: window.api_urls.scratch_org_commit_dataset(orgId),
    onSuccess: handleSuccess,
    onError: handleError,
    shouldSubscribeToObject: false,
  });

  // const hasCommitMessage = Boolean(inputs.commit_message);
  const datasetSelected = Boolean(inputs.dataset_name);

  const handleClose = () => {
    closeModal();
    setPageIndex(0);
    resetForm();
  };

  const submitChanges = (e: FormEvent<HTMLFormElement>) => {
    setRetrievingDataset(true);
    handleSubmit(e);
  };

  const doRefreshDatasets = useCallback(() => {
    /* istanbul ignore else */
    if (projectId && taskId) {
      dispatch(refreshDatasets({ project: projectId, task: taskId }));
    }
  }, [dispatch, projectId, taskId]);

  const doRefreshDatasetSchema = useCallback(() => {
    /* istanbul ignore else */
    if (orgId) {
      dispatch(refreshDatasetSchema({ org: orgId }));
    }
  }, [dispatch, orgId]);

  useEffect(() => {
    // Always refresh dataset schema when modal opens:
    if (isOpen && !fetchingSchema) {
      doRefreshDatasetSchema();
    }
    // If there are no known datasets, check again once:
    if (isOpen && !fetchingDatasets && !Object.keys(datasets).length) {
      doRefreshDatasets();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const pages = [
    {
      heading: t('Select the dataset to create or modify'),
      contents: (
        <SelectDatasetForm
          datasets={Object.keys(datasets)}
          datasetErrors={datasetErrors}
          fetchingDatasets={fetchingDatasets}
          inputs={inputs as DatasetCommit}
          errors={errors}
          setInputs={setInputs}
          handleInputChange={handleInputChange}
          setHasError={setHasError}
          doRefreshDatasets={doRefreshDatasets}
        />
      ),
      footer: [
        <Button
          key="page-1-button-1"
          label={t('Cancel')}
          onClick={handleClose}
        />,
        <Button
          key="page-1-button-2"
          label={t('Save & Next')}
          variant="brand"
          onClick={nextPage}
          disabled={!datasetSelected || hasError}
        />,
      ],
    },
    {
      heading: t('Select data to retrieve'),
      contents: (
        // <ChangesForm
        //   changeset={org.unsaved_changes}
        //   ignoredChanges={org.ignored_changes}
        //   inputs={inputs as DatasetCommit}
        //   changesChecked={changesChecked}
        //   ignoredChecked={ignoredChecked}
        //   errors={errors}
        //   setInputs={setInputs}
        //   ignoredSuccess={isShowingTransientMessage}
        // />
        <div>This is placeholder content.</div>
      ),
      footer: [
        <Button
          key="page-2-button-1"
          label={t('Go Back')}
          variant="outline-brand"
          onClick={prevPage}
        />,
        <Button
          key="page-2-button-2"
          label={t('Save & Next')}
          variant="brand"
          onClick={nextPage}
          // disabled={
          //   !(numberChangesChecked || numberIgnoredChecked) || ignoringChanges || hasError
          // }
        />,
      ],
    },
    {
      heading: t('Describe the dataset you are retrieving'),
      contents: (
        // <CommitMessageForm
        //   inputs={inputs as DatasetCommit}
        //   errors={errors}
        //   handleInputChange={handleInputChange}
        // />
        <div>This is placeholder content.</div>
      ),
      footer: [
        <Button
          key="page-3-button-1"
          label={t('Go Back')}
          variant="outline-brand"
          onClick={prevPage}
          disabled={retrievingDataset}
        />,
        <Button
          key="page-3-button-2"
          type="submit"
          label={
            retrievingDataset ? (
              <LabelWithSpinner
                label={t('Retrieving Selected Data…')}
                variant="inverse"
              />
            ) : (
              t('Retrieve Selected Data')
            )
          }
          variant="brand"
          onClick={submitChanges}
          // disabled={retrievingDataset || !hasCommitMessage || hasError}
        />,
      ],
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      size="small"
      disableClose={retrievingDataset}
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

export default RetrieveDatasetModal;
