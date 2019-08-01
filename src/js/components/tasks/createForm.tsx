import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Textarea from '@salesforce/design-system-react/components/textarea';
import classNames from 'classnames';
import i18n from 'i18next';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import { createObject, ObjectsActionType } from '@/store/actions';
import { addError } from '@/store/errors/actions';
import { Project } from '@/store/projects/reducer';
import { ApiError } from '@/utils/api';
import { OBJECT_TYPES } from '@/utils/constants';

interface Props extends RouteComponentProps {
  project: Project;
  product: string;
  startOpen?: boolean;
  doCreateObject: ObjectsActionType;
  doAddError: typeof addError;
}

const TaskForm = ({
  project,
  product,
  startOpen = false,
  doCreateObject,
  doAddError,
}: Props) => {
  const [isOpen, setIsOpen] = useState(startOpen);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string[] }>({});
  const fields = ['name', 'description'];
  const [success, addSuccess] = useState(false);

  const submitClicked = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isOpen) {
      setIsOpen(true);
      e.preventDefault();
    }
  };
  const closeForm = () => {
    setIsOpen(false);
  };
  const handleNameChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    { value }: { value: string },
  ) => {
    setName(value);
  };
  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setDescription(e.target.value);
  };
  const handleAssigneeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAssignee(e.target.value);
  };

  const handleSuceess = () => {
    setName('');
    setDescription('');
    addSuccess(true);
    setTimeout(() => {
      addSuccess(false);
    }, 3000);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    doCreateObject({
      objectType: OBJECT_TYPES.TASK,
      data: {
        name,
        description,
        product,
        assignee,
        project: project.id,
      },
    })
      .then(action => {
        handleSuceess();
        const {
          type,
          payload: { object, objectType },
        } = action;
        if (
          type === 'CREATE_OBJECT_SUCCEEDED' &&
          objectType === OBJECT_TYPES.TASK &&
          object &&
          object.slug
        ) {
          // add new task to task list (below)
        }
      })
      .catch((err: ApiError) => {
        const newErrors =
          err.body && typeof err.body === 'object' ? err.body : {};
        if (
          fields.filter(field => newErrors[field] && newErrors[field].length)
            .length
        ) {
          setErrors(newErrors);
        } else if (err.response && err.response.status === 400) {
          // If no inline errors to show, fallback to default global error toast
          doAddError(err.message);
        }
      });
  };

  return (
    <form onSubmit={handleSubmit} className="slds-form slds-m-bottom--large">
      {isOpen && (
        <>
          <Input
            id="task-name"
            label={i18n.t('Task Name')}
            className="slds-form-element_stacked"
            name="name"
            value={name}
            required
            aria-required
            maxLength="50"
            errorText={
              errors.name && errors.name.length && errors.name.join(', ')
            }
            onChange={handleNameChange}
          />
          <Textarea
            id="task-description"
            label={i18n.t('Description')}
            classNameContainer="slds-form-element_stacked"
            name="description"
            value={description}
            errorText={
              errors.description &&
              errors.description.length &&
              errors.description[0]
            }
            onChange={handleDescriptionChange}
          />
          <Input
            id="assignee-name"
            label={i18n.t('Assign Team Member')}
            className="slds-form-element_stacked"
            name="assignee"
            value={assignee}
            aria-required
            maxLength="50"
            errorText={
              errors.name && errors.name.length && errors.name.join(', ')
            }
            onChange={handleAssigneeChange}
          />
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
          <span className="slds-p-left--medium slds-p-right--medium form-text__success">
            {i18n.t('A task was successfully created')}
          </span>
        )}
      </div>
    </form>
  );
};
const actions = {
  doCreateObject: createObject,
  doAddError: addError,
};
const WrappedTaskForm = connect(
  null,
  actions,
)(TaskForm);

export default withRouter(WrappedTaskForm);
