import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import RadioGroup from '@salesforce/design-system-react/components/radio-group';
import Radio from '@salesforce/design-system-react/components/radio-group/radio';
import Textarea from '@salesforce/design-system-react/components/textarea';
import classNames from 'classnames';
import i18n from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { AnyAction } from 'redux';

import { useForm, useIsMounted } from '@/components/utils';
import { Project } from '@/store/projects/reducer';
import { OBJECT_TYPES, ORG_TYPES } from '@/utils/constants';

interface Props {
  project: Project;
  startOpen?: boolean;
}

const TaskForm = ({ project, startOpen = false }: Props) => {
  const isMounted = useIsMounted();
  const [isOpen, setIsOpen] = useState(startOpen);
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
      setIsOpen(true);
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
    setInputs,
    errors,
    handleInputChange,
    handleSubmit,
    resetForm,
  } = useForm({
    fields: { name: '', description: '', flow_type: ORG_TYPES.DEV },
    objectType: OBJECT_TYPES.TASK,
    additionalData: {
      project: project.id,
    },
    onSuccess,
  });

  const handleFlowChange = (event) => {
    setInputs({ ...inputs, flow_type: event.target.value });
  };
  const closeForm = () => {
    setIsOpen(false);
    resetForm();
  };

  const flowTypes = [
    {
      type: ORG_TYPES.DEV,
      description: i18n.t('set up for package development'),
    },
    {
      type: ORG_TYPES.QA,
      description: i18n.t('use as a testing environment'),
    },
    {
      type: ORG_TYPES.BETA,
      description: i18n.t('what the cool kids want'),
    },
    {
      type: ORG_TYPES.RELEASE,
      description: i18n.t('ready for production'),
    },
  ];
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
          <RadioGroup
            labels={{ label: i18n.t('Org Type') }}
            onChange={handleFlowChange}
            disabled={false}
            required
            name="flow-type"
          >
            {flowTypes.map(({ type, description }) => (
              <Radio
                key={type}
                id={type}
                labels={{ label: `${type} - ${description}` }}
                value={type}
                checked={Boolean(type === inputs.flow_type)}
                variant="base"
                name="flo"
              />
            ))}
          </RadioGroup>
        </>
      )}
      <div className={classNames({ 'slds-m-top--medium': isOpen })}>
        <Button
          label={isOpen ? i18n.t('Create Task') : i18n.t('Add a Task')}
          className={classNames({
            'hide-separator': !isOpen,
            'show-separator': isOpen,
          })}
          variant="brand"
          type="submit"
          onClick={submitClicked}
        />
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
