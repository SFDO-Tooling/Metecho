import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import ProgressIndicator from '@salesforce/design-system-react/components/progress-indicator';
import {
  compact,
  debounce,
  filter,
  find,
  intersection,
  intersectionBy,
} from 'lodash';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { AnyAction } from 'redux';

import SelectProjectCollaboratorsForm from '@/js/components/projects/createProjectModal/collaborators';
import SelectProjectDependenciesForm from '@/js/components/projects/createProjectModal/dependencies';
import CreateProjectForm from '@/js/components/projects/createProjectModal/form';
import CreateProjectSummary from '@/js/components/projects/createProjectModal/summary';
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
import { GitHubOrg, GitHubUser } from '@/js/store/user/reducer';
import { selectUserState } from '@/js/store/user/selectors';
import apiFetch, { ApiError } from '@/js/utils/api';
import { OBJECT_TYPES } from '@/js/utils/constants';
import routes from '@/js/utils/routes';

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
  const history = useHistory();
  const dispatch = useDispatch<ThunkDispatch>();
  const isMounted = useIsMounted();
  const user = useSelector(selectUserState);
  const dependencies = useSelector(selectProjectDependencies);
  const fetchingDependencies = useSelector(selectFetchingProjectDependencies);
  const [pageIndex, setPageIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const hasDeps = Boolean(dependencies.length);
  const [fetchedDependencies, setFetchedDependencies] = useState(hasDeps);
  const [isCheckingRepoName, setIsCheckingRepoName] = useState(false);
  const [nameIsAvailable, setNameIsAvailable] = useState<boolean>();
  const [collaborators, setCollaborators] = useState<GitHubUser[]>([]);
  const [isRefreshingCollaborators, setIsRefreshingCollaborators] =
    useState(false);
  const [orgIsValid, setOrgIsValid] = useState(false);
  const [orgErrors, setOrgErrors] = useState<string[]>([]);

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

  const showDeps = hasDeps || fetchingDependencies;

  const nextPage = () => {
    setPageIndex(pageIndex + 1);
  };

  const prevPage = () => {
    setPageIndex(pageIndex - 1 || 0);
  };

  const handleSuccess = (action: AnyAction) => {
    /* istanbul ignore else */
    if (isMounted.current) {
      setIsSaving(false);
      closeModal();
      setPageIndex(0);
      setFetchedDependencies(hasDeps);
      const {
        type,
        payload: { object, objectType },
      } = action;
      if (
        type === 'CREATE_OBJECT_SUCCEEDED' &&
        objectType === OBJECT_TYPES.PROJECT &&
        object?.slug
      ) {
        // Redirect to newly created project
        const url = routes.project_detail(object.slug);
        history.push(url);
      }
    }
  };

  // eslint-disable-next-line handle-callback-err
  const handleError = (
    err: ApiError,
    fieldErrors: { [key: string]: string },
  ) => {
    /* istanbul ignore else */
    if (isMounted.current) {
      setIsSaving(false);
      /* istanbul ignore else */
      if (
        intersection(Object.keys(fieldErrors), [
          'organization',
          'name',
          'repo_name',
          'description',
        ])
      ) {
        setPageIndex(0);
      } else if (fieldErrors.collaborators) {
        setPageIndex(1);
      } else if (fieldErrors.dependencies && showDeps) {
        setPageIndex(2);
      }
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

  const checkRepoName = useCallback(
    async (org: string, name: string) => {
      if (org && name) {
        setIsCheckingRepoName(true);
        const { available } = await apiFetch({
          url: window.api_urls.organization_check_repo_name(org),
          dispatch,
          opts: {
            method: 'POST',
            body: JSON.stringify({ name }),
            headers: {
              'Content-Type': 'application/json',
            },
          },
        });
        setNameIsAvailable(available);
        setIsCheckingRepoName(false);
      } else {
        setNameIsAvailable(undefined);
      }
    },
    [dispatch],
  );

  const debouncedCheckRepoName = useMemo(
    () => debounce(checkRepoName, 500),
    [checkRepoName],
  );

  // Check repo name availability when org or name changes
  useEffect(() => {
    setNameIsAvailable(undefined);
    debouncedCheckRepoName(inputs.organization, inputs.repo_name);
  }, [inputs.organization, inputs.repo_name, debouncedCheckRepoName]);

  const fetchCollaborators = useCallback(
    async (org: string) => {
      /* istanbul ignore else */
      if (org) {
        setIsRefreshingCollaborators(true);
        const response = await apiFetch({
          url: window.api_urls.organization_members(org),
          dispatch,
        });
        setCollaborators(
          filter(
            response || /* istanbul ignore next */ [],
            (member) => member.id !== user?.github_id,
          ),
        );
        setIsRefreshingCollaborators(false);
      } else {
        setCollaborators([]);
      }
    },
    [dispatch, user?.github_id],
  );

  const checkOrgPermissions = useCallback(
    async (org: string) => {
      setOrgIsValid(false);
      setOrgErrors([]);
      /* istanbul ignore else */
      if (org) {
        const { success, messages }: { success: boolean; messages: string[] } =
          await apiFetch({
            url: window.api_urls.organization_check_app_installation(org),
            dispatch,
            opts: { method: 'POST' },
          });
        setOrgIsValid(success);
        setOrgErrors(messages);
      }
    },
    [dispatch],
  );

  // Fetch GitHub Org members and check permissions when organization changes
  useEffect(() => {
    if (inputs.organization) {
      fetchCollaborators(inputs.organization);
      checkOrgPermissions(inputs.organization);
    }
  }, [checkOrgPermissions, fetchCollaborators, inputs.organization]);

  // When available GitHub Org members change, reset selected collaborators
  const collaboratorsRef = useRef(collaborators);
  useEffect(() => {
    const prevValue = collaboratorsRef.current;
    if (collaborators !== prevValue) {
      setInputs({
        ...inputs,
        github_users: intersectionBy(inputs.github_users, collaborators, 'id'),
      });
      collaboratorsRef.current = collaborators;
    }
  }, [collaborators, inputs, setInputs]);

  const canSubmit = Boolean(
    nameIsAvailable &&
      orgIsValid &&
      inputs.name &&
      inputs.organization &&
      inputs.repo_name,
  );

  const selectedOrg = inputs.organization
    ? find(orgs, { id: inputs.organization })
    : undefined;

  const selectedDeps = filter(dependencies, (d) =>
    (inputs as CreateProjectData).dependencies.includes(d.id),
  );

  const doSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsSaving(true);
    handleSubmit(e as any);
  };

  const CancelBtn = (args: any) => (
    <Button
      className="slds-shrink-none"
      label={t('Cancel')}
      onClick={handleClose}
      disabled={isSaving}
      {...args}
    />
  );

  const BackBtn = (args: any) => (
    <Button
      className="slds-shrink-none"
      label={t('Go Back')}
      variant="outline-brand"
      onClick={prevPage}
      {...args}
    />
  );

  const NextBtn = (args: any) => (
    <Button
      className="slds-shrink-none"
      label={t('Save & Next')}
      variant="brand"
      onClick={nextPage}
      {...args}
    />
  );

  const steps = compact([
    { id: 'details', label: t('Enter Project Details') },
    { id: 'collaborators', label: t('Add Project Collaborators') },
    showDeps && { id: 'dependencies', label: t('Add Dependencies') },
    { id: 'summary', label: t('Create Project') },
  ]);

  const handleStepEvent = (
    event: React.MouseEvent<HTMLButtonElement>,
    {
      step,
    }: {
      step: {
        id: string;
        label: string;
      };
    },
  ) => {
    const idx = steps.indexOf(step);
    /* istanbul ignore if */
    if (idx < 0) {
      return;
    }
    setPageIndex(idx);
  };

  const Progress = (
    <ProgressIndicator
      className="slds-m-horizontal_x-small metecho-create-project-progress"
      steps={steps}
      completedSteps={steps.slice(0, pageIndex)}
      disabledSteps={canSubmit ? [] : steps.slice(1)}
      selectedStep={steps[pageIndex]}
      variant="modal"
      onStepClick={handleStepEvent}
    />
  );

  const pages = compact([
    {
      heading: t('Create Project'),
      contents: (
        <CreateProjectForm
          orgs={orgs}
          isRefreshingOrgs={isRefreshingOrgs}
          isCheckingRepoName={isCheckingRepoName}
          nameIsAvailable={nameIsAvailable}
          orgErrors={orgErrors}
          inputs={inputs as CreateProjectData}
          errors={errors}
          handleInputChange={handleInputChange}
          setInputs={setInputs}
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
        <SelectProjectCollaboratorsForm
          collaborators={collaborators}
          isRefreshingCollaborators={isRefreshingCollaborators}
          inputs={inputs as CreateProjectData}
          setInputs={setInputs}
          fetchCollaborators={fetchCollaborators}
        />
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
        <CreateProjectSummary
          name={inputs.name}
          selectedOrg={selectedOrg}
          selectedCollaborators={inputs.github_users}
          selectedDeps={selectedDeps}
        />
      ),
      footer: (
        <div className="slds-grid slds-grid_align-spread">
          <BackBtn />
          {Progress}
          <Button
            key="submit"
            className="slds-shrink-none"
            label={
              isSaving ? (
                <LabelWithSpinner label={t('Creating…')} variant="inverse" />
              ) : (
                t('Create')
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

export default CreateProjectModal;
