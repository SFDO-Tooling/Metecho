import Checkbox from '@salesforce/design-system-react/components/checkbox';
import { uniq, without } from 'lodash';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { CreateProjectData } from '@/js/components/projects/createProjectModal';
import { SpinnerWrapper, UseFormProps } from '@/js/components/utils';
import {
  selectFetchingProjectDependencies,
  selectProjectDependencies,
} from '@/js/store/projects/selectors';

interface Props {
  inputs: CreateProjectData;
  errors: UseFormProps['errors'];
  setInputs: UseFormProps['setInputs'];
}

const SelectProjectDependenciesForm = ({
  inputs,
  errors,
  setInputs,
}: Props) => {
  const { t } = useTranslation();
  const dependencies = useSelector(selectProjectDependencies);
  const fetchingDependencies = useSelector(selectFetchingProjectDependencies);

  const handleChange = ({ id, checked }: { id: string; checked: boolean }) => {
    if (checked) {
      setInputs({
        ...inputs,
        dependencies: uniq([...inputs.dependencies, id]),
      });
    } else {
      setInputs({ ...inputs, dependencies: without(inputs.dependencies, id) });
    }
  };

  return (
    <form className="slds-form slds-p-around_large slds-is-relative">
      <p className="slds-m-bottom_medium">
        <Trans i18nKey="projectDependenciesHelp">
          Select any dependencies for your new Project.
        </Trans>
      </p>
      <h2 className="slds-text-heading_small slds-m-bottom_x-small">
        {t('Project Dependencies')}
      </h2>
      {dependencies.length ? (
        dependencies.map((dep, idx) => (
          <Checkbox
            key={idx}
            className="slds-form-element_stacked slds-p-left_none"
            labels={{
              label: dep.recommended
                ? `${dep.name} (${t('recommended')})`
                : dep.name,
            }}
            name="dependencies"
            checked={inputs.dependencies.includes(dep.id)}
            errorText={errors.dependencies}
            onChange={(
              event: React.ChangeEvent<HTMLInputElement>,
              { checked }: { checked: boolean },
            ) => handleChange({ id: dep.id, checked })}
          />
        ))
      ) : (
        /* istanbul ignore next */
        <p className="slds-p-top_x-small">{t('No Available Dependencies')}</p>
      )}
      {/* istanbul ignore next */ fetchingDependencies && <SpinnerWrapper />}
    </form>
  );
};

export default SelectProjectDependenciesForm;
