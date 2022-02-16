import Input from '@salesforce/design-system-react/components/input';
import Textarea from '@salesforce/design-system-react/components/textarea';
import { t } from 'i18next';
import React from 'react';

import { CreateProjectData } from '@/js/components/projects/createProjectModal';
import { UseFormProps } from '@/js/components/utils';

interface Props {
  inputs: CreateProjectData;
  errors: UseFormProps['errors'];
  handleInputChange: UseFormProps['handleInputChange'];
}

const CreateProjectForm = ({ inputs, errors, handleInputChange }: Props) => (
  <form className="slds-form slds-p-around_large">
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

export default CreateProjectForm;
