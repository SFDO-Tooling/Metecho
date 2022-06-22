import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  LabelWithSpinner,
  useForm,
  useFormDefaults,
  useIsMounted,
} from '@/js/components/utils';
import CreateOrgForm from '@/js/components/utils/createOrgModal/form';
import Overview from '@/js/components/utils/createOrgModal/overview';
import { Epic } from '@/js/store/epics/reducer';
import { Project } from '@/js/store/projects/reducer';
import { Task } from '@/js/store/tasks/reducer';
import {
  DEFAULT_ORG_CONFIG_NAME,
  OBJECT_TYPES,
  ORG_TYPES,
} from '@/js/utils/constants';

interface Props {
  project: Project;
  epic?: Epic;
  task?: Task;
  isOpen: boolean;
  closeModal: () => void;
}

export interface OrgData {
  description: string;
  org_config_name: string;
}

const CreateOrgModal = ({ project, epic, task, isOpen, closeModal }: Props) => {
  const { t } = useTranslation();
  const [pageIndex, setPageIndex] = useState(0);
  const isMounted = useIsMounted();
  const [isSaving, setIsSaving] = useState(false);

  const nextPage = () => {
    setPageIndex(pageIndex + 1);
  };

  const handleSuccess = () => {
    /* istanbul ignore else */
    if (isMounted.current) {
      setIsSaving(false);
      closeModal();
      setPageIndex(0);
    }
  };

  /* istanbul ignore next */
  const handleError = () => {
    if (isMounted.current) {
      setIsSaving(false);
    }
  };

  const defaultConfigName = task?.org_config_name || DEFAULT_ORG_CONFIG_NAME;
  const additionalData: { [key: string]: any } = {
    org_type: ORG_TYPES.PLAYGROUND,
  };

  if (task) {
    additionalData.task = task.id;
  } else if (epic) {
    additionalData.epic = epic.id;
  } else {
    additionalData.project = project.id;
  }

  const {
    inputs,
    errors,
    handleInputChange,
    setInputs,
    handleSubmit,
    resetForm,
  } = useForm({
    fields: {
      description: '',
      org_config_name: defaultConfigName,
    } as OrgData,
    additionalData,
    objectType: OBJECT_TYPES.ORG,
    onSuccess: handleSuccess,
    onError: handleError,
    shouldSubscribeToObject: false,
  });

  const handleClose = () => {
    closeModal();
    setPageIndex(0);
    resetForm();
  };

  // When parent org_config_name changes, update default selections
  useFormDefaults({
    field: 'org_config_name',
    value: defaultConfigName,
    inputs,
    setInputs,
  });

  const doSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsSaving(true);
    handleSubmit(e as any);
  };

  const CancelBtn = (
    <Button
      key="cancel"
      label={t('Cancel')}
      onClick={handleClose}
      disabled={isSaving}
    />
  );

  const pages = [
    {
      heading: t('Create Scratch Org'),
      contents: <Overview project={project} epic={epic} task={task} />,
      footer: [
        CancelBtn,
        <Button
          key="page-1-submit"
          label={t('Next')}
          variant="brand"
          onClick={nextPage}
        />,
      ],
    },
    {
      heading: t('Create Scratch Org'),
      contents: (
        <CreateOrgForm
          project={project}
          inputs={inputs as OrgData}
          errors={errors}
          handleInputChange={handleInputChange}
        />
      ),
      footer: [
        CancelBtn,
        <Button
          key="page-2-submit"
          label={
            isSaving ? (
              <LabelWithSpinner label={t('Creating…')} variant="inverse" />
            ) : (
              t('Create Org')
            )
          }
          variant="brand"
          onClick={doSubmit}
          disabled={isSaving}
        />,
      ],
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      size="small"
      disableClose={isSaving}
      dismissOnClickOutside={false}
      heading={pages[pageIndex].heading}
      assistiveText={{ closeButton: t('Cancel') }}
      footer={pages[pageIndex].footer}
      onRequestClose={handleClose}
    >
      {pages[pageIndex].contents}
    </Modal>
  );
};

export default CreateOrgModal;
