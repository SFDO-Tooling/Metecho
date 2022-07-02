import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Radio from '@salesforce/design-system-react/components/radio';
import RadioGroup from '@salesforce/design-system-react/components/radio-group';
import { lowerCase, map } from 'lodash';
import React, {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import uuid from 'uuid-random';

import { DatasetCommit } from '@/js/components/tasks/retrieveDataset';
import {
  LabelWithSpinner,
  SpinnerWrapper,
  UseFormProps,
} from '@/js/components/utils';
import { ThunkDispatch } from '@/js/store';
import { refreshDatasets } from '@/js/store/tasks/actions';

interface Props {
  projectId: string;
  taskId: string;
  datasets: string[];
  fetchingDatasets: boolean;
  inputs: DatasetCommit;
  setInputs: UseFormProps['setInputs'];
  errors: UseFormProps['errors'];
  handleInputChange: UseFormProps['handleInputChange'];
  setHasError: Dispatch<SetStateAction<boolean>>;
}

const SelectDatasetForm = ({
  projectId,
  taskId,
  datasets,
  fetchingDatasets,
  inputs,
  errors,
  setInputs,
  handleInputChange,
  setHasError,
}: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<ThunkDispatch>();
  const existingDatasetSelected = Boolean(
    inputs.dataset &&
      map(datasets, lowerCase).includes(inputs.dataset.toLowerCase()),
  );
  const [creatingDataset, setCreatingDataset] = useState(
    Boolean(inputs.dataset && !existingDatasetSelected),
  );
  const CREATE_DATASET = useRef(`create-dataset-${uuid()}`);
  const inputEl = useRef<HTMLInputElement | null>(null);

  const doRefreshDatasets = useCallback(() => {
    /* istanbul ignore else */
    if (taskId) {
      dispatch(refreshDatasets({ project: projectId, task: taskId }));
    }
  }, [dispatch, projectId, taskId]);

  // If there are no known datasets, check again once...
  useEffect(() => {
    if (!datasets.length) {
      doRefreshDatasets();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // If custom name matches existing dataset, disable "Save & Next" action
  useEffect(() => {
    setHasError(creatingDataset && existingDatasetSelected);
  }, [creatingDataset, existingDatasetSelected, setHasError]);

  // Auto-focus on name input when creating a new dataset
  useEffect(() => {
    if (creatingDataset && inputEl.current) {
      inputEl.current.focus();
    }
  }, [creatingDataset]);

  const handleDatasetChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.value === CREATE_DATASET.current) {
      setCreatingDataset(true);
      setInputs({ ...inputs, dataset: '' });
    } else {
      setCreatingDataset(false);
      handleInputChange(event);
    }
  };

  return (
    <form className="slds-form slds-p-around_large">
      <div
        className="slds-grid
          slds-grid_vertical-align-start
          slds-m-bottom_small"
      >
        <div className="slds-grid slds-wrap slds-shrink slds-p-right_medium">
          <p>
            <Trans i18nKey="retrieveDatasetHelp">
              Select an existing dataset to modify, or enter a custom name to
              create a new dataset.
            </Trans>
          </p>
        </div>
        <div
          className="slds-grid
            slds-grow
            slds-shrink-none
            slds-grid_align-end"
        >
          {fetchingDatasets ? (
            <Button
              label={<LabelWithSpinner label={t('Syncing Datasets…')} />}
              variant="outline-brand"
              disabled
            />
          ) : (
            <Button
              label={t('Re-Sync Datasets')}
              variant="outline-brand"
              iconCategory="utility"
              iconName="refresh"
              iconPosition="left"
              onClick={doRefreshDatasets}
            />
          )}
        </div>
      </div>
      <div className="slds-is-relative">
        <RadioGroup
          labels={{
            label: t('Datasets'),
            error: errors.dataset,
          }}
          assistiveText={{
            required: t('Required'),
          }}
          name="dataset"
          required
          onChange={handleDatasetChange}
        >
          {datasets.map((dataset, idx) => (
            <Radio
              key={`${idx}`}
              labels={{ label: dataset }}
              checked={inputs.dataset === dataset}
              value={dataset}
              name="dataset"
            />
          ))}
          <Radio
            labels={{ label: t('Create New Dataset') }}
            checked={creatingDataset}
            value={CREATE_DATASET.current}
            name="dataset"
          />
        </RadioGroup>
        {creatingDataset && (
          <Input
            inputRef={(ref: HTMLInputElement) => (inputEl.current = ref)}
            placeholder={t('Dataset name')}
            className="slds-m-left_large slds-m-top_xx-small"
            name="dataset"
            value={inputs.dataset}
            required
            aria-required
            errorText={
              existingDatasetSelected
                ? t('Dataset name cannot match existing dataset.')
                : errors.dataset
            }
            onChange={handleInputChange}
          />
        )}
        {fetchingDatasets && <SpinnerWrapper />}
      </div>
    </form>
  );
};

export default SelectDatasetForm;
