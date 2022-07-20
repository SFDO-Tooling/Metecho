import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import { sortBy, toLower } from 'lodash';
import React, {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import DataForm from '@/js/components/tasks/retrieveDataset/data';
import SelectDatasetForm from '@/js/components/tasks/retrieveDataset/datasets';
// import CommitMessageForm from '@/js/components/tasks/retrieveDataset/message';
import { LabelWithSpinner, useForm, useIsMounted } from '@/js/components/utils';
import { ThunkDispatch } from '@/js/store';
import { refreshDatasets } from '@/js/store/orgs/actions';
import { Changeset, Datasets, DatasetSchema } from '@/js/store/orgs/reducer';
import { ApiError } from '@/js/utils/api';
import { OBJECT_TYPES } from '@/js/utils/constants';

interface Props {
  orgId: string;
  datasets: Datasets;
  datasetErrors: string[];
  schema?: DatasetSchema;
  fetchingDatasets: boolean;
  isOpen: boolean;
  closeModal: () => void;
}

export interface DatasetCommit {
  dataset_name: string;
  dataset_definition: Changeset;
  commit_message: string;
}

export interface BooleanObject {
  [key: string]: boolean;
}

const RetrieveDatasetModal = ({
  orgId,
  datasets,
  datasetErrors,
  schema,
  fetchingDatasets,
  isOpen,
  closeModal,
}: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<ThunkDispatch>();
  const [retrievingDataset, setRetrievingDataset] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const isMounted = useIsMounted();

  const datasetNames = Object.keys(datasets);
  const orderedDatasetNames = [
    ...datasetNames.filter((name) => name.toLowerCase() === 'default'),
    ...sortBy(
      datasetNames.filter((name) => name.toLowerCase() !== 'default'),
      toLower,
    ),
  ];

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

  // When datasets change, update default selection
  const selectedDatasetRef = useRef(inputs.dataset_name);
  useEffect(() => {
    const selectedDataset = inputs.dataset_name;
    const prevValue = selectedDatasetRef.current;
    if (selectedDataset !== prevValue) {
      // @@@ Adding fake outdated fields
      const def = datasets[inputs.dataset_name] ?? {};
      def.foo = ['bar', 'buz'];
      def.ActiveScratchOrg.push('this-is-new');
      setInputs({
        ...inputs,
        dataset_definition: def,
      });
      selectedDatasetRef.current = selectedDataset;
    }
  }, [inputs, setInputs, datasets]);

  const hasCommitMessage = Boolean(inputs.commit_message);
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
    if (orgId) {
      dispatch(refreshDatasets(orgId));
    }
  }, [dispatch, orgId]);

  useEffect(() => {
    // Always refresh datasets and schema when modal opens:
    if (isOpen && !fetchingDatasets) {
      doRefreshDatasets();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const pages = [
    {
      heading: t('Select the dataset to create or modify'),
      contents: (
        <SelectDatasetForm
          datasets={orderedDatasetNames}
          datasetErrors={datasetErrors}
          fetchingDatasets={fetchingDatasets}
          missingSchema={!schema}
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
      size: 'large',
      heading: t('Select data to retrieve'),
      contents: (
        <DataForm
          schema={schema ?? {}}
          inputs={inputs as DatasetCommit}
          errors={errors}
          setInputs={setInputs}
        />
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
          disabled={retrievingDataset || !hasCommitMessage || hasError}
        />,
      ],
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      size={pages[pageIndex].size || 'small'}
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
