import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import { t } from 'i18next';
import React, { useState } from 'react';

import {
  LabelWithSpinner,
  useForm,
  useFormDefaults,
  useIsMounted,
} from '@/js/components/utils';
import { Project } from '@/js/store/projects/reducer';
import { OBJECT_TYPES } from '@/js/utils/constants';

interface Props {
  isOpen: boolean;
  closeModal: () => void;
}

interface CreateProjectData
  extends Pick<Project, 'name' | 'description' | 'repo_name' | 'github_users'> {
  organization: string;
  dependencies: string[];
}

const CreateProjectModal = ({ isOpen, closeModal }: Props) => {
  const [pageIndex, setPageIndex] = useState(0);
  const isMounted = useIsMounted();
  const [isSaving, setIsSaving] = useState(false);

  const orgs: string[] = [];

  const nextPage = () => {
    setPageIndex(pageIndex + 1);
  };

  const prevPage = () => {
    setPageIndex(pageIndex - 1 || 0);
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

  const defaultOrganization = orgs[0] || '';

  const {
    inputs,
    errors,
    handleInputChange,
    setInputs,
    handleSubmit,
    resetForm,
  } = useForm({
    fields: {
      name: '',
      description: '',
      repo_name: '',
      github_users: [],
      organization: defaultOrganization,
      dependencies: [],
    } as CreateProjectData,
    objectType: OBJECT_TYPES.PROJECT,
    onSuccess: handleSuccess,
    onError: handleError,
  });

  const canSubmit = Boolean(
    inputs.name && inputs.organization && inputs.repo_name,
  );

  const handleClose = () => {
    closeModal();
    setPageIndex(0);
    resetForm();
  };

  // When default organization changes, update selection
  useFormDefaults({
    field: 'organization',
    value: defaultOrganization,
    inputs,
    setInputs,
  });

  const doSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsSaving(true);
    handleSubmit(e as any);
  };

  const CancelBtn = (args: any) => (
    <Button
      label={t('Cancel')}
      onClick={handleClose}
      disabled={isSaving}
      {...args}
    />
  );

  const BackBtn = (args: any) => (
    <Button
      key="back"
      label={t('Go Back')}
      variant="outline-brand"
      onClick={prevPage}
      {...args}
    />
  );

  const NextBtn = (args: any) => (
    <Button
      key="submit"
      label={t('Save & Next')}
      variant="brand"
      onClick={nextPage}
      {...args}
    />
  );

  const pages = [
    {
      heading: t('Create Project'),
      contents: null,
      footer: [
        <CancelBtn key="cancel" />,
        <NextBtn key="next" disabled={!canSubmit} />,
      ],
    },
    {
      heading: t('Add Project Collaborators'),
      contents: null,
      footer: [
        <BackBtn key="back" />,
        <CancelBtn key="cancel" />,
        <NextBtn key="next" />,
      ],
    },
    {
      heading: t('Add Dependencies'),
      contents: null,
      footer: [
        <BackBtn key="back" />,
        <CancelBtn key="cancel" />,
        <NextBtn key="next" />,
      ],
    },
    {
      heading: t('Create Project'),
      contents: null,
      footer: [
        <BackBtn key="back" />,
        <CancelBtn key="cancel" />,
        <Button
          key="submit"
          label={
            isSaving ? (
              <LabelWithSpinner label={t('Creating…')} variant="inverse" />
            ) : (
              t('Create Project')
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
      heading={pages[pageIndex].heading}
      assistiveText={{ closeButton: t('Cancel') }}
      footer={pages[pageIndex].footer}
      directional={pageIndex > 0}
      onRequestClose={handleClose}
    >
      {pages[pageIndex].contents}
    </Modal>
  );
};

export default CreateProjectModal;
