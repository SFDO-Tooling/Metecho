import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import Textarea from '@salesforce/design-system-react/components/textarea';
import { omit } from 'lodash';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import SelectFlowType from '@/js/components/tasks/selectFlowType';
import {
  LabelWithSpinner,
  useForm,
  useFormDefaults,
  useIsMounted,
} from '@/js/components/utils';
import { Epic } from '@/js/store/epics/reducer';
import { OrgConfig } from '@/js/store/projects/reducer';
import { Task } from '@/js/store/tasks/reducer';
import {
  DEFAULT_ORG_CONFIG_NAME,
  OBJECT_TYPES,
  ObjectTypes,
} from '@/js/utils/constants';

interface EditModalProps {
  model: Epic | Task;
  modelType: ObjectTypes;
  hasOrgs?: boolean;
  projectId?: string;
  orgConfigsLoading?: boolean;
  orgConfigs?: OrgConfig[];
  isOpen: boolean;
  handleClose: () => void;
}

const isTask = (model: Epic | Task, modelType: ObjectTypes): model is Task =>
  modelType === OBJECT_TYPES.TASK;

const EditModal = ({
  model,
  modelType,
  hasOrgs,
  projectId,
  orgConfigsLoading,
  orgConfigs,
  isOpen,
  handleClose,
}: EditModalProps) => {
  const { t } = useTranslation();
  const isMounted = useIsMounted();
  const submitButton = useRef<HTMLButtonElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSuccess = () => {
    /* istanbul ignore else */
    if (isMounted.current) {
      setIsSaving(false);
      handleClose();
    }
  };

  /* istanbul ignore next */
  const handleError = () => {
    if (isMounted.current) {
      setIsSaving(false);
    }
  };

  const defaultName = model.name;
  const defaultDescription = model.description;
  let defaultConfigName;
  const fields: { [key: string]: any } = {
    name: defaultName,
    description: defaultDescription,
  };

  if (isTask(model, modelType)) {
    defaultConfigName = model.org_config_name || DEFAULT_ORG_CONFIG_NAME;
    fields.org_config_name = defaultConfigName;
  }

  const {
    inputs,
    errors,
    handleInputChange,
    setInputs,
    handleSubmit,
    resetForm,
  } = useForm({
    fields,
    additionalData: omit(model, [
      'name',
      'description',
      'org_config_name',
      'epic',
    ]),
    onSuccess: handleSuccess,
    onError: handleError,
    objectType: modelType,
    update: true,
  });

  // When name, description or org_config_name changes, update default selection
  useFormDefaults({
    field: 'name',
    value: defaultName,
    inputs,
    setInputs,
  });
  useFormDefaults({
    field: 'description',
    value: defaultDescription,
    inputs,
    setInputs,
  });
  useFormDefaults({
    field: 'org_config_name',
    value: defaultConfigName,
    inputs,
    setInputs,
  });

  const doClose = () => {
    handleClose();
    resetForm();
  };

  const submitInstance = (e: React.FormEvent<HTMLFormElement>) => {
    setIsSaving(true);
    handleSubmit(e);
  };

  const onSubmitClicked = () => {
    // Click hidden button inside form to activate native browser validation
    /* istanbul ignore else */
    if (submitButton.current) {
      submitButton.current.click();
    }
  };

  let heading, nameLabel; // eslint-disable-line one-var
  switch (modelType) {
    case OBJECT_TYPES.TASK:
      nameLabel = t('Task Name');
      heading = t('Edit Task');
      break;
    case OBJECT_TYPES.EPIC:
      nameLabel = t('Epic Name');
      heading = t('Edit Epic');
      break;
  }

  return (
    <Modal
      isOpen={isOpen}
      size="small"
      assistiveText={{ closeButton: t('Cancel') }}
      disableClose={isSaving}
      dismissOnClickOutside={false}
      heading={heading}
      onRequestClose={doClose}
      footer={[
        <Button
          key="cancel"
          label={t('Cancel')}
          onClick={doClose}
          disabled={isSaving}
        />,
        <Button
          key="submit"
          type="submit"
          label={
            isSaving ? (
              <LabelWithSpinner label={t('Saving…')} variant="inverse" />
            ) : (
              t('Save')
            )
          }
          variant="brand"
          onClick={onSubmitClicked}
          disabled={isSaving}
        />,
      ]}
    >
      <form className="slds-form slds-p-around_large" onSubmit={submitInstance}>
        <Input
          id="edit-name"
          label={nameLabel}
          className="slds-p-bottom_small"
          name="name"
          value={inputs.name}
          required
          aria-required
          errorText={errors.name}
          onChange={handleInputChange}
        />
        <Textarea
          id="edit-description"
          label={t('Description')}
          className="metecho-textarea"
          name="description"
          value={inputs.description}
          errorText={errors.description}
          onChange={handleInputChange}
        />
        {/* display for tasks, disable if task has a Dev or Test Org */}
        {isTask(model, modelType) ? (
          <SelectFlowType
            orgConfigs={orgConfigs || []}
            projectId={projectId}
            value={inputs.org_config_name}
            errors={errors.org_config_name}
            isDisabled={hasOrgs}
            isLoading={orgConfigsLoading}
            handleSelect={handleInputChange}
          />
        ) : null}
        {/* Clicking hidden button allows for native browser form validation */}
        <button
          ref={submitButton}
          type="submit"
          style={{ display: 'none' }}
          disabled={isSaving}
        />
      </form>
    </Modal>
  );
};
export default EditModal;
