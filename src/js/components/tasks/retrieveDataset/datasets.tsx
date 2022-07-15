import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Radio from '@salesforce/design-system-react/components/radio';
import RadioGroup from '@salesforce/design-system-react/components/radio-group';
import { lowerCase, map } from 'lodash';
import React, {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Trans, useTranslation } from 'react-i18next';
import uuid from 'uuid-random';

import { DatasetCommit } from '@/js/components/tasks/retrieveDataset';
import {
  LabelWithSpinner,
  SpinnerWrapper,
  UseFormProps,
} from '@/js/components/utils';

interface Props {
  datasets: string[];
  datasetErrors: string[];
  fetchingDatasets: boolean;
  inputs: DatasetCommit;
  setInputs: UseFormProps['setInputs'];
  errors: UseFormProps['errors'];
  handleInputChange: UseFormProps['handleInputChange'];
  setHasError: Dispatch<SetStateAction<boolean>>;
  doRefreshDatasets: () => void;
}

const SelectDatasetForm = ({
  datasets,
  datasetErrors,
  fetchingDatasets,
  inputs,
  errors,
  setInputs,
  handleInputChange,
  setHasError,
  doRefreshDatasets,
}: Props) => {
  const { t } = useTranslation();
  const existingDatasetSelected = Boolean(
    inputs.dataset_name &&
      map(datasets, lowerCase).includes(inputs.dataset_name.toLowerCase()),
  );
  const [creatingDataset, setCreatingDataset] = useState(
    Boolean(inputs.dataset_name && !existingDatasetSelected),
  );
  const CREATE_DATASET = useRef(`create-dataset-${uuid()}`);
  const inputEl = useRef<HTMLInputElement | null>(null);

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
      setInputs({ ...inputs, dataset_name: '' });
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
          {fetchingDatasets
            ? null
            : datasetErrors.map((err, idx) => (
                <p key={idx} className="slds-text-color_error">
                  {err}
                </p>
              ))}
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
          name="dataset_name"
          required
          onChange={handleDatasetChange}
        >
          {datasets.map((dataset, idx) => (
            <Radio
              key={`${idx}`}
              labels={{ label: dataset }}
              checked={inputs.dataset_name === dataset}
              value={dataset}
              name="dataset_name"
            />
          ))}
          <Radio
            labels={{ label: t('Create New Dataset') }}
            checked={creatingDataset}
            value={CREATE_DATASET.current}
            name="dataset_name"
          />
        </RadioGroup>
        {creatingDataset && (
          <Input
            inputRef={(ref: HTMLInputElement) => (inputEl.current = ref)}
            placeholder={t('Dataset name')}
            className="slds-m-left_large slds-m-top_xx-small"
            name="dataset_name"
            value={inputs.dataset_name}
            required
            aria-required
            errorText={
              existingDatasetSelected
                ? t('Dataset name cannot match existing dataset.')
                : undefined
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
