import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import ProgressIndicator from '@salesforce/design-system-react/components/progress-indicator';
import { compact } from 'lodash';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import SelectProjectDependenciesForm from '@/js/components/projects/createProjectModal/dependencies';
import CreateProjectForm from '@/js/components/projects/createProjectModal/form';
import {
  LabelWithSpinner,
  useForm,
  useFormDefaults,
  useIsMounted,
} from '@/js/components/utils';
import { ThunkDispatch } from '@/js/store';
import { fetchObjects } from '@/js/store/actions';
import { Project } from '@/js/store/projects/reducer';
import {
  selectFetchingProjectDependencies,
  selectProjectDependencies,
} from '@/js/store/projects/selectors';
import { GitHubOrg } from '@/js/store/user/reducer';
import { OBJECT_TYPES } from '@/js/utils/constants';

interface Props {
  orgs: GitHubOrg[];
  isRefreshingOrgs: boolean;
  isOpen: boolean;
  closeModal: () => void;
}

export interface CreateProjectData
  extends Pick<Project, 'name' | 'description' | 'repo_name' | 'github_users'> {
  organization: string;
  dependencies: string[];
}

const CreateProjectModal = ({
  orgs,
  isRefreshingOrgs,
  isOpen,
  closeModal,
}: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<ThunkDispatch>();
  const dependencies = useSelector(selectProjectDependencies);
  const fetchingDependencies = useSelector(selectFetchingProjectDependencies);
  const [pageIndex, setPageIndex] = useState(0);
  const isMounted = useIsMounted();
  const [isSaving, setIsSaving] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);
  const hasDeps = Boolean(dependencies.length);
  const [fetchedDependencies, setFetchedDependencies] = useState(hasDeps);

  // When modal opens, fetch dependencies if list is empty
  useEffect(() => {
    if (isOpen && !fetchedDependencies) {
      setFetchedDependencies(true);
      dispatch(
        fetchObjects({
          objectType: OBJECT_TYPES.PROJECT_DEPENDENCY,
          shouldSubscribeToObject: false,
        }),
      );
    }
  }, [dispatch, fetchedDependencies, isOpen]);

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

  const defaultOrganization = orgs.length === 1 ? orgs[0].id : '';

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

  const handleClose = () => {
    closeModal();
    setPageIndex(0);
    setFetchedDependencies(hasDeps);
    resetForm();
  };

  // When default organization changes, update selection
  useFormDefaults({
    field: 'organization',
    value: defaultOrganization,
    inputs,
    setInputs,
  });

  const canSubmit = Boolean(
    !hasErrors && inputs.name && inputs.organization && inputs.repo_name,
  );

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
      label={t('Go Back')}
      variant="outline-brand"
      onClick={prevPage}
      {...args}
    />
  );

  const NextBtn = (args: any) => (
    <Button
      label={t('Save & Next')}
      variant="brand"
      onClick={nextPage}
      {...args}
    />
  );

  const showDeps = hasDeps || fetchingDependencies;
  const steps = compact([
    { id: 0, label: t('Enter Project Details') },
    { id: 1, label: t('Add Project Collaborators') },
    showDeps && { id: 2, label: t('Add Dependencies') },
    { id: showDeps ? 3 : 2, label: t('Create Project') },
  ]);

  const Progress = (
    <ProgressIndicator
      steps={steps}
      completedSteps={steps.slice(0, pageIndex)}
      disabledSteps={canSubmit ? [] : steps.slice(1)}
      selectedStep={steps[pageIndex]}
      variant="modal"
    />
  );

  const pages = compact([
    {
      heading: t('Create Project'),
      contents: (
        <CreateProjectForm
          orgs={orgs}
          isRefreshingOrgs={isRefreshingOrgs}
          inputs={inputs as CreateProjectData}
          errors={errors}
          handleInputChange={handleInputChange}
          setInputs={setInputs}
          setHasErrors={setHasErrors}
        />
      ),
      footer: (
        <div className="slds-grid slds-grid_align-spread">
          <CancelBtn />
          {Progress}
          <NextBtn disabled={!canSubmit} />
        </div>
      ),
    },
    {
      heading: t('Add Project Collaborators'),
      contents: (
        <div className="slds-p-around_large">This is a placeholder.</div>
      ),
      footer: (
        <div className="slds-grid slds-grid_align-spread">
          <BackBtn />
          {Progress}
          <NextBtn />
        </div>
      ),
    },
    showDeps && {
      heading: t('Add Dependencies'),
      contents: (
        <SelectProjectDependenciesForm
          inputs={inputs as CreateProjectData}
          errors={errors}
          setInputs={setInputs}
        />
      ),
      footer: (
        <div className="slds-grid slds-grid_align-spread">
          <BackBtn />
          {Progress}
          <NextBtn disabled={fetchingDependencies} />
        </div>
      ),
    },
    {
      heading: t('Create Project'),
      contents: (
        <div className="slds-p-around_large">This is a placeholder.</div>
      ),
      footer: (
        <div className="slds-grid slds-grid_align-spread">
          <BackBtn />
          {Progress}
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
          />
        </div>
      ),
    },
  ]);

  return (
    <Modal
      isOpen={isOpen}
      size="small"
      disableClose={isSaving}
      heading={pages[pageIndex].heading}
      assistiveText={{ closeButton: t('Cancel') }}
      footer={pages[pageIndex].footer}
      onRequestClose={handleClose}
    >
      {pages[pageIndex].contents}
    </Modal>
  );
};

export default CreateProjectModal;
