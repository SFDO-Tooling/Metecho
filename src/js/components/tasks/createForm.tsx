import Button from '@salesforce/design-system-react/components/button';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import Textarea from '@salesforce/design-system-react/components/textarea';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { AnyAction } from 'redux';

import { GitHubIssueLink } from '@/js/components/githubIssues/selectIssueModal';
import SelectFlowType from '@/js/components/tasks/selectFlowType';
import {
  LabelWithSpinner,
  OrgData,
  useForm,
  useFormDefaults,
  useIsMounted,
  useTransientMessage,
} from '@/js/components/utils';
import { Epic } from '@/js/store/epics/reducer';
import { GitHubIssue } from '@/js/store/githubIssues/reducer';
import { Project } from '@/js/store/projects/reducer';
import {
  DEFAULT_ORG_CONFIG_NAME,
  OBJECT_TYPES,
  RETRIEVE_CHANGES,
} from '@/js/utils/constants';
import routes from '@/js/utils/routes';

interface Props {
  project: Project;
  epic?: Epic | null;
  isOpen: boolean;
  playgroundOrgData?: OrgData | null;
  closeCreateModal: () => void;
  issue?: GitHubIssue | null;
}

const CreateTaskModal = ({
  project,
  epic,
  isOpen,
  playgroundOrgData,
  closeCreateModal,
  issue,
}: Props) => {
  const { t } = useTranslation();
  const history = useHistory();
  const isMounted = useIsMounted();
  const { showTransientMessage, isShowingTransientMessage } =
    useTransientMessage();
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingBatch, setIsSavingBatch] = useState(false);

  const submitButton = useRef<HTMLButtonElement | null>(null);
  const isContributingFromOrg = Boolean(playgroundOrgData);
  const useExistingOrgConfig = Boolean(
    isContributingFromOrg && playgroundOrgData?.org_config_name,
  );
  const defaultOrgConfig = useExistingOrgConfig
    ? /* istanbul ignore next */ playgroundOrgData?.org_config_name ||
      DEFAULT_ORG_CONFIG_NAME
    : DEFAULT_ORG_CONFIG_NAME;

  /* istanbul ignore next */
  const onError = () => {
    if (isMounted.current) {
      setIsSaving(false);
      setIsSavingBatch(false);
    }
  };

  const additionalData: { [key: string]: any } = {
    epic: epic?.id,
    project: epic ? undefined : project.id,
    issue: issue ? issue.id : undefined,
  };

  if (isContributingFromOrg) {
    additionalData.dev_org = playgroundOrgData?.id as string;
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
      name: '',
      description: '',
      org_config_name: defaultOrgConfig,
    },
    objectType: OBJECT_TYPES.TASK,
    additionalData,
    onError,
  });

  // When default org config changes, update selection
  useFormDefaults({
    field: 'org_config_name',
    value: defaultOrgConfig,
    inputs,
    setInputs,
  });

  const closeModal = () => {
    closeCreateModal();
    resetForm();
  };

  const addSuccess = (action: AnyAction) => {
    /* istanbul ignore else */
    if (isMounted.current) {
      setIsSaving(false);
      closeModal();
      const {
        type,
        payload: { object, objectType },
      } = action;
      if (
        type === 'CREATE_OBJECT_SUCCEEDED' &&
        objectType === OBJECT_TYPES.TASK &&
        object?.slug
      ) {
        // Redirect to newly created task
        const url = epic
          ? routes.epic_task_detail(project.slug, epic.slug, object.slug)
          : routes.project_task_detail(project.slug, object.slug);
        // Trigger retrieve-changes from org
        const state = isContributingFromOrg
          ? { [RETRIEVE_CHANGES]: true }
          : undefined;
        history.push(url, state);
      }
    }
  };
  const submitClicked = () => {
    // Click hidden button inside form to activate native browser validation
    /* istanbul ignore else */
    if (submitButton.current) {
      submitButton.current.click();
    }
  };
  const doSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setIsSaving(true);
    handleSubmit(e, { success: addSuccess });
  };

  const batchAddSuccess = () => {
    /* istanbul ignore else */
    if (isMounted.current) {
      resetForm();
      setIsSavingBatch(false);
      showTransientMessage();
    }
  };
  const batchSubmitClicked = (e: React.MouseEvent<HTMLFormElement>) => {
    setIsSavingBatch(true);
    handleSubmit(e, { success: batchAddSuccess });
  };

  let heading;
  if (isContributingFromOrg) {
    heading = t('Create a Task to Contribute Work from Scratch Org');
  } else if (epic) {
    heading = t('Create a Task for {{epic_name}}', {
      epic_name: epic.name,
    });
  } else {
    heading = t('Create a Task for {{project_name}}', {
      project_name: project.name,
    });
  }

  return (
    <Modal
      isOpen={isOpen}
      size="small"
      disableClose={isSaving || isSavingBatch}
      heading={heading}
      assistiveText={{ closeButton: t('Cancel') }}
      onRequestClose={closeModal}
      footer={[
        isShowingTransientMessage && (
          <span
            key="success"
            className="slds-text-color_success
              slds-float_left
              slds-p-left_x-small
              slds-p-top_xx-small
              metecho-transition-out"
          >
            {t('A Task was successfully created.')}
          </span>
        ),
        <Button
          key="cancel"
          label={t('Cancel')}
          onClick={closeModal}
          disabled={isSaving || isSavingBatch}
        />,
        !isContributingFromOrg && (
          <Button
            key="create-new"
            label={
              isSavingBatch ? (
                <LabelWithSpinner label={t('Creating…')} />
              ) : (
                t('Create & New')
              )
            }
            onClick={batchSubmitClicked}
            disabled={isSaving || isSavingBatch}
          />
        ),
        <Button
          key="submit"
          type="submit"
          label={
            isSaving ? (
              <LabelWithSpinner label={t('Creating…')} variant="inverse" />
            ) : (
              t('Create')
            )
          }
          variant="brand"
          onClick={submitClicked}
          disabled={isSaving || isSavingBatch}
        />,
      ]}
    >
      <div className="slds-p-around_large">
        {!epic && !isContributingFromOrg && (
          <p className="slds-m-bottom_small">
            {t(
              'You are creating a Task for this Project. To group multiple Tasks together, create an Epic.',
            )}
          </p>
        )}
        {issue && (
          <p className="slds-m-bottom_small">
            <strong>{t('Attached Issue:')}</strong> #{issue.number}:{' '}
            {issue.title}
            <br />
            <GitHubIssueLink url={issue.html_url} />
          </p>
        )}
        <form onSubmit={doSubmit} className="slds-form">
          <Input
            id="task-name"
            label={t('Task Name')}
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
            label={t('Description')}
            classNameContainer="slds-form-element_stacked slds-p-left_none"
            className="metecho-textarea"
            name="description"
            value={inputs.description}
            errorText={errors.description}
            onChange={handleInputChange}
          />
          <SelectFlowType
            orgConfigs={project.org_config_names || []}
            projectId={project.id}
            value={inputs.org_config_name}
            errors={errors.org_config_name}
            isLoading={project.currently_fetching_org_config_names}
            className={useExistingOrgConfig ? 'slds-hide' : ''}
            handleSelect={handleInputChange}
          />
          {/* Clicking hidden button allows for native browser form validation */}
          <button
            ref={submitButton}
            type="submit"
            style={{ display: 'none' }}
            disabled={isSaving || isSavingBatch}
          />
        </form>
      </div>
    </Modal>
  );
};

export default CreateTaskModal;
