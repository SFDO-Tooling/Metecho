import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Textarea from '@salesforce/design-system-react/components/textarea';
import classNames from 'classnames';
import i18n from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { AnyAction } from 'redux';

import SelectFlowType from '@/components/tasks/selectFlowType';
import { useForm, useIsMounted } from '@/components/utils';
import { Project } from '@/store/projects/reducer';
import { DEFAULT_ORG_CONFIG_NAME, OBJECT_TYPES } from '@/utils/constants';

interface Props {
  project: Project;
  isOpen: boolean;
  toggleForm: (bool: boolean) => void;
}

const TaskForm = ({ project, isOpen, toggleForm }: Props) => {
  const isMounted = useIsMounted();
  const [success, setSuccess] = useState(false);
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

  const submitClicked = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isOpen) {
      toggleForm(false);
      e.preventDefault();
    }
  };

  const onSuccess = (action: AnyAction) => {
    const {
      type,
      payload: { object, objectType },
    } = action;
    if (
      isMounted.current &&
      type === 'CREATE_OBJECT_SUCCEEDED' &&
      objectType === OBJECT_TYPES.TASK &&
      object
    ) {
      setSuccess(true);
      successTimeout.current = setTimeout(() => {
        setSuccess(false);
      }, 3000);
    }
  };

  const {
    inputs,
    errors,
    handleInputChange,
    handleSubmit,
    resetForm,
  } = useForm({
    fields: {
      name: '',
      description: '',
      org_config_name: DEFAULT_ORG_CONFIG_NAME,
    },
    objectType: OBJECT_TYPES.TASK,
    additionalData: {
      project: project.id,
    },
    onSuccess,
  });

  const closeForm = () => {
    toggleForm(false);
    resetForm();
  };
  const openForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toggleForm(true);
  };

  return (
    <form onSubmit={handleSubmit} className="slds-form slds-m-bottom--large">
      {isOpen && (
        <>
          <Input
            id="task-name"
            label={i18n.t('Task Name')}
            className="slds-form-element_stacked slds-p-left_none"
            name="name"
            value={inputs.name}
            required
            aria-required
            errorText={errors.name}
            onChange={handleInputChange}
          />
          <Textarea
            id="task-description"
            label={i18n.t('Description')}
            classNameContainer="slds-form-element_stacked slds-p-left_none"
            name="description"
            value={inputs.description}
            errorText={errors.description}
            onChange={handleInputChange}
          />
          <SelectFlowType
            orgConfigs={project.available_task_org_config_names}
            projectId={project.id}
            value={inputs.org_config_name}
            errors={errors.org_config_name}
            isLoading={project.currently_fetching_org_config_names}
            handleSelect={handleInputChange}
          />
        </>
      )}
      <div className={classNames({ 'slds-m-top--medium': isOpen })}>
        {isOpen ? (
          <Button
            label={i18n.t('Create Task')}
            className="show-separator"
            variant="brand"
            type="submit"
            onClick={submitClicked}
          />
        ) : (
          <Button
            label={i18n.t('Add a Task')}
            className="hide-separator"
            variant="brand"
            // type="button"
            onClick={openForm}
          />
        )}
        <span className="vertical-separator slds-m-left--large"></span>
        {isOpen && (
          <Button
            label={i18n.t('Close Form')}
            className="slds-p-left--medium slds-p-right--medium"
            variant="base"
            onClick={closeForm}
          />
        )}
        {success && (
          <span
            className="slds-p-left--medium
              slds-p-right--medium
              slds-text-color_success"
          >
            {i18n.t('A task was successfully created.')}
          </span>
        )}
      </div>
    </form>
  );
};

export default TaskForm;
