import Combobox from '@salesforce/design-system-react/components/combobox';
import Input from '@salesforce/design-system-react/components/input';
import Textarea from '@salesforce/design-system-react/components/textarea';
import { t } from 'i18next';
import React from 'react';

import { ComboboxOption } from '@/js/components/epics/createForm';
import RefreshGitHubOrgsButton from '@/js/components/githubOrgs/refreshOrgsButton';
import { CreateProjectData } from '@/js/components/projects/createProjectModal';
import { UseFormProps } from '@/js/components/utils';
import { GitHubOrg } from '@/js/store/user/reducer';

interface Props {
  orgs: GitHubOrg[];
  isRefreshingOrgs: boolean;
  inputs: CreateProjectData;
  errors: UseFormProps['errors'];
  handleInputChange: UseFormProps['handleInputChange'];
  setInputs: UseFormProps['setInputs'];
}

const CreateProjectForm = ({
  orgs,
  isRefreshingOrgs,
  inputs,
  errors,
  handleInputChange,
  setInputs,
}: Props) => {
  const handleOrgSelection = (
    event: any,
    { selection }: { selection: ComboboxOption[] },
  ) => {
    setInputs({ ...inputs, organization: selection[0]?.id || '' });
  };

  const options = orgs.map((org) => ({ id: org.id, label: org.name }));
  const noOrgs = !orgs.length;
  const orgErrorMsg = noOrgs
    ? t(
        'You are not a member of any GitHub Organization with permissions to create new Projects on Metecho. Confirm that you are logged into the correct account or contact an admin on GitHub.',
      )
    : '';

  return (
    <form className="slds-form slds-p-around_large">
      <div className="slds-grid slds-form-element_stacked slds-p-left_none">
        <div className="slds-grid slds-wrap slds-shrink slds-p-right_medium">
          <Combobox
            events={{
              onSelect: handleOrgSelection,
            }}
            labels={{
              label: t('GitHub Organization'),
            }}
            options={options}
            selection={
              inputs.organization
                ? [options.find((org) => org.id === inputs.organization)]
                : []
            }
            errorText={
              isRefreshingOrgs ? '' : errors.organization || orgErrorMsg
            }
            required
            aria-required
            variant="readonly"
            singleInputDisabled={noOrgs || isRefreshingOrgs}
          />
        </div>
        <div
          className="slds-grid
          slds-grow
          slds-shrink-none
          slds-grid_align-end
          slds-grid_vertical-align-center"
        >
          <RefreshGitHubOrgsButton isRefreshing={isRefreshingOrgs} />
        </div>
      </div>
      <Input
        id="create-project-name"
        label={t('Project Name')}
        className="slds-form-element_stacked slds-p-left_none"
        name="name"
        value={inputs.name}
        required
        aria-required
        errorText={errors.name}
        onChange={handleInputChange}
      />
      <Input
        id="create-project-repo_name"
        label={t('GitHub Repository Name')}
        className="slds-form-element_stacked slds-p-left_none"
        name="repo_name"
        value={inputs.repo_name}
        required
        aria-required
        maxLength="100"
        errorText={errors.repo_name}
        onChange={handleInputChange}
      />
      <Textarea
        id="create-project-description"
        label={t('Description')}
        classNameContainer="slds-form-element_stacked slds-p-left_none"
        placeholder={t('Optional description of this Project')}
        className="metecho-textarea"
        name="description"
        value={inputs.description}
        errorText={errors.description}
        onChange={handleInputChange}
      />
    </form>
  );
};

export default CreateProjectForm;
