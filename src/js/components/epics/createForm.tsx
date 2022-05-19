import Button from '@salesforce/design-system-react/components/button';
import Combobox from '@salesforce/design-system-react/components/combobox';
import comboboxFilter from '@salesforce/design-system-react/components/combobox/filter';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import Radio from '@salesforce/design-system-react/components/radio';
import RadioGroup from '@salesforce/design-system-react/components/radio-group';
import Textarea from '@salesforce/design-system-react/components/textarea';
import React, { useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { AnyAction } from 'redux';

import { GitHubIssueLink } from '@/js/components/githubIssues/selectIssueModal';
import {
  LabelWithSpinner,
  OrgData,
  useForm,
  useIsMounted,
} from '@/js/components/utils';
import { ThunkDispatch } from '@/js/store';
import { GitHubIssue } from '@/js/store/githubIssues/reducer';
import { Project } from '@/js/store/projects/reducer';
import { User } from '@/js/store/user/reducer';
import apiFetch from '@/js/utils/api';
import { CREATE_TASK_FROM_ORG, OBJECT_TYPES } from '@/js/utils/constants';
import routes from '@/js/utils/routes';

interface ComboboxOption {
  id: string;
  label: string;
}

interface Props {
  user: User;
  project: Project;
  isOpen: boolean;
  playgroundOrgData?: OrgData | null;
  issue?: GitHubIssue | null;
  closeCreateModal: () => void;
}

const CreateEpicModal = ({
  user,
  project,
  isOpen,
  playgroundOrgData,
  closeCreateModal,
  issue,
}: Props) => {
  const history = useHistory();
  const isMounted = useIsMounted();
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  // state related to setting base branch on epic creation
  const [fromBranchChecked, setFromBranchChecked] = useState(false);
  const [fetchingBranches, setFetchingBranches] = useState(false);
  const [projectBranches, setProjectBranches] = useState<string[]>([]);
  const [filterVal, setFilterVal] = useState('');

  const submitButton = useRef<HTMLButtonElement | null>(null);
  const isContributingFromOrg = Boolean(playgroundOrgData);

  const dispatch = useDispatch<ThunkDispatch>();

  /* istanbul ignore next */
  const onError = () => {
    if (isMounted.current) {
      setIsSaving(false);
    }
  };

  const {
    inputs,
    errors,
    handleInputChange,
    setInputs,
    handleSubmit,
    resetForm,
  } = useForm({
    fields: { name: '', description: '', branch_name: '' },
    objectType: OBJECT_TYPES.EPIC,
    additionalData: {
      project: project.id,
      github_users: user.github_id ? [user.github_id] : [],
      issue: issue ? issue.id : undefined,
    },
    onError,
  });

  const resetFilterVal = () => {
    setFilterVal('');
  };

  const closeForm = () => {
    setFromBranchChecked(false);
    resetFilterVal();
    resetForm();
    closeCreateModal();
  };

  const onSuccess = (action: AnyAction) => {
    /* istanbul ignore else */
    if (isMounted.current) {
      setIsSaving(false);
      closeForm();
      const {
        type,
        payload: { object, objectType },
      } = action;
      if (
        type === 'CREATE_OBJECT_SUCCEEDED' &&
        objectType === OBJECT_TYPES.EPIC &&
        object?.slug
      ) {
        // Redirect to newly created epic
        const url = routes.epic_detail(project.slug, object.slug);
        // Trigger create-task
        const state = isContributingFromOrg
          ? { [CREATE_TASK_FROM_ORG]: playgroundOrgData as OrgData }
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
    handleSubmit(e, { success: onSuccess });
  };

  const doGetBranches = async () => {
    setFetchingBranches(true);
    // fetching feature branches here when option selected,
    // in lieu of storing in store...
    const baseBranches = await apiFetch({
      url: window.api_urls.project_feature_branches(project.id),
      dispatch,
    });
    /* istanbul ignore else */
    if (isMounted.current) {
      setProjectBranches(baseBranches || []);
      setFetchingBranches(false);
    }
  };

  const setBranch = (branch: string) => {
    setInputs({ ...inputs, branch_name: branch });
  };

  const resetBranchForm = () => {
    setBranch('');
    resetFilterVal();
  };

  const closeBranchForm = () => {
    resetBranchForm();
    setFromBranchChecked(false);
  };

  const handleBranchCheckboxChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (event.target.value === 'existing') {
      doGetBranches();
      setFromBranchChecked(true);
    } else {
      closeBranchForm();
    }
  };

  const handleBranchSelection = (
    event: any,
    { selection }: { selection: ComboboxOption[] },
  ) => {
    setBranch(selection[0].label);
  };

  const handleBranchChange = (event: any, { value }: { value: string }) => {
    setFilterVal(value);
  };

  const handleBranchRemoveSelection = () => {
    resetBranchForm();
  };

  const handleBranchBlur = () => {
    if (projectBranches.includes(filterVal)) {
      setBranch(filterVal);
    }
    resetFilterVal();
  };

  const noFeatureBranches = !projectBranches.length;
  const inputVal = inputs.branch_name;
  const branchOptions: ComboboxOption[] = projectBranches.map(
    (item, index) => ({
      id: `${index + 1}`,
      label: item,
    }),
  );
  const selection = branchOptions.find((branch) => branch.label === inputVal);
  let noOptionsFoundText = null;
  if (fetchingBranches) {
    noOptionsFoundText = t('Loading existing branches…');
  } else {
    noOptionsFoundText = (
      <>
        {noFeatureBranches
          ? t("There aren't any available branches at this time.")
          : t('No matching branches found.')}{' '}
        <Trans i18nKey="refreshProjectBranches">
          <Button variant="link" onClick={doGetBranches}>
            Check again
          </Button>{' '}
          to refresh this list or{' '}
          <Button variant="link" onClick={closeBranchForm}>
            start from a new branch.
          </Button>
        </Trans>
      </>
    );
  }

  let heading;
  if (isContributingFromOrg) {
    heading = t('Create an Epic to Contribute Work from Scratch Org');
  } else {
    heading = t('Create an Epic for {{project_name}}', {
      project_name: project.name,
    });
  }

  return (
    <Modal
      isOpen={isOpen}
      size="small"
      disableClose={isSaving}
      heading={heading}
      onRequestClose={closeForm}
      assistiveText={{ closeButton: t('Cancel') }}
      footer={[
        <Button
          key="cancel"
          label={t('Cancel')}
          onClick={closeForm}
          disabled={isSaving}
        />,
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
          disabled={isSaving}
        />,
      ]}
    >
      <div className="slds-p-around_large">
        {issue && (
          <p className="slds-m-bottom_small">
            <strong>{t('Attached Issue:')}</strong> #{issue.number}:{' '}
            {issue.title}
            <br />
            <GitHubIssueLink url={issue.html_url} />
          </p>
        )}
        <form
          onSubmit={doSubmit}
          className="slds-form"
          data-form="create-epic-branch"
        >
          <RadioGroup
            assistiveText={{
              label: t('Epic Branch'),
              required: t('Required'),
            }}
            className="slds-form-element_stacked slds-p-left_none"
            name="epic-branch"
            required
            onChange={handleBranchCheckboxChange}
          >
            <Radio
              id="epic-branch-new"
              labels={{ label: t('Create new branch on GitHub') }}
              checked={!fromBranchChecked}
              name="epic-branch"
              value="new"
            />
            <Radio
              id="epic-branch-existing"
              labels={{ label: t('Use existing GitHub branch') }}
              checked={fromBranchChecked}
              name="epic-branch"
              value="existing"
            />
          </RadioGroup>
          {fromBranchChecked && (
            <Combobox
              events={{
                onSelect: handleBranchSelection,
                onChange: handleBranchChange,
                onRequestRemoveSelectedOption: handleBranchRemoveSelection,
                onBlur: handleBranchBlur,
              }}
              labels={{
                label: t('Select a branch to use for this Epic'),
                noOptionsFound: noOptionsFoundText,
              }}
              menuItemVisibleLength={5}
              predefinedOptionsOnly
              options={comboboxFilter({
                inputValue: filterVal,
                options: branchOptions,
                selection: selection ? [selection] : [],
              })}
              selection={selection ? [selection] : []}
              value={selection ? selection.label : filterVal}
              errorText={errors.branch_name}
              hasInputSpinner={fetchingBranches}
              required
              variant="inline-listbox"
              classNameContainer="slds-form-element_stacked slds-p-left_none"
            />
          )}
          <Input
            id="epic-name"
            label={t('Epic Name')}
            className="slds-form-element_stacked slds-p-left_none"
            name="name"
            value={inputs.name}
            required
            aria-required
            errorText={errors.name}
            onChange={handleInputChange}
          />
          <Textarea
            id="epic-description"
            label={t('Description')}
            classNameContainer="slds-form-element_stacked slds-p-left_none"
            className="metecho-textarea"
            name="description"
            value={inputs.description}
            errorText={errors.description}
            onChange={handleInputChange}
          />
          {/* Clicking hidden button allows for native browser form validation */}
          <button
            ref={submitButton}
            type="submit"
            style={{ display: 'none' }}
            disabled={isSaving}
          />
        </form>
      </div>
    </Modal>
  );
};

export default CreateEpicModal;
