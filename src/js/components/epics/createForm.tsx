import Button from '@salesforce/design-system-react/components/button';
import Combobox from '@salesforce/design-system-react/components/combobox';
import comboboxFilter from '@salesforce/design-system-react/components/combobox/filter';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import Radio from '@salesforce/design-system-react/components/radio';
import RadioGroup from '@salesforce/design-system-react/components/radio-group';
import Textarea from '@salesforce/design-system-react/components/textarea';
import i18n from 'i18next';
import React, { useRef, useState } from 'react';
import { Trans } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { AnyAction } from 'redux';

import { LabelWithSpinner, useForm, useIsMounted } from '~js/components/utils';
import { ThunkDispatch } from '~js/store';
import { Project } from '~js/store/projects/reducer';
import { User } from '~js/store/user/reducer';
import apiFetch from '~js/utils/api';
import { OBJECT_TYPES } from '~js/utils/constants';
import routes from '~js/utils/routes';

interface ComboboxOption {
  id: string;
  label: string;
}

interface Props extends RouteComponentProps {
  user: User;
  project: Project;
  isOpen: boolean;
  closeCreateModal: () => void;
}

const CreateEpicModal = ({
  user,
  project,
  isOpen,
  closeCreateModal,
  history,
}: Props) => {
  const isMounted = useIsMounted();
  const [isSaving, setIsSaving] = useState(false);
  // state related to setting base branch on epic creation
  const [fromBranchChecked, setFromBranchChecked] = useState(false);
  const [fetchingBranches, setFetchingBranches] = useState(false);
  const [projectBranches, setProjectBranches] = useState<string[]>([]);
  const [filterVal, setFilterVal] = useState('');

  const submitButton = useRef<HTMLButtonElement | null>(null);

  const dispatch = useDispatch<ThunkDispatch>();

  const onSuccess = (action: AnyAction) => {
    const {
      type,
      payload: { object, objectType },
    } = action;
    /* istanbul ignore else */
    if (isMounted.current) {
      setIsSaving(false);
    }
    if (
      type === 'CREATE_OBJECT_SUCCEEDED' &&
      objectType === OBJECT_TYPES.EPIC &&
      object?.slug
    ) {
      const url = routes.epic_detail(project.slug, object.slug);
      history.push(url);
    }
  };

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
    },
    onSuccess,
    onError,
  });

  const submitClicked = () => {
    // Click hidden button inside form to activate native browser validation
    /* istanbul ignore else */
    if (submitButton.current) {
      submitButton.current.click();
    }
  };

  const doSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setIsSaving(true);
    handleSubmit(e);
  };

  const resetFilterVal = () => {
    setFilterVal('');
  };

  const closeForm = () => {
    setFromBranchChecked(false);
    resetFilterVal();
    resetForm();
    closeCreateModal();
  };

  const doGetBranches = async () => {
    setFetchingBranches(true);
    // fetching feature branches here when option selected,
    // in lieu of storing in store...
    const baseBranches = await apiFetch({
      url: `${window.api_urls.project_feature_branches(project.id)}`,
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
    noOptionsFoundText = i18n.t('Loading existing branches…');
  } else {
    noOptionsFoundText = (
      <>
        {noFeatureBranches
          ? i18n.t("There aren't any available branches at this time.")
          : i18n.t('No matching branches found.')}{' '}
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

  return (
    <Modal
      isOpen={isOpen}
      size="small"
      disableClose={isSaving}
      heading={i18n.t('Create an Epic for {{project_name}}', {
        project_name: project.name,
      })}
      onRequestClose={closeForm}
      assistiveText={{ closeButton: i18n.t('Cancel') }}
      footer={[
        <Button
          key="cancel"
          label={i18n.t('Cancel')}
          onClick={closeForm}
          disabled={isSaving}
        />,
        <Button
          key="submit"
          type="submit"
          label={
            isSaving ? (
              <LabelWithSpinner label={i18n.t('Creating…')} variant="inverse" />
            ) : (
              i18n.t('Create')
            )
          }
          variant="brand"
          onClick={submitClicked}
          disabled={isSaving}
        />,
      ]}
    >
      <form
        onSubmit={doSubmit}
        className="slds-form slds-p-around_large"
        data-form="create-epic-branch"
      >
        <RadioGroup
          assistiveText={{
            label: i18n.t('Epic Branch'),
            required: i18n.t('Required'),
          }}
          className="slds-form-element_stacked slds-p-left_none"
          name="epic-branch"
          required
          onChange={handleBranchCheckboxChange}
        >
          <Radio
            id="epic-branch-new"
            labels={{ label: i18n.t('Create new branch on GitHub') }}
            checked={!fromBranchChecked}
            name="epic-branch"
            value="new"
          />
          <Radio
            id="epic-branch-existing"
            labels={{ label: i18n.t('Use existing GitHub branch') }}
            checked={fromBranchChecked}
            name="epic-branch"
            value="existing"
          />
        </RadioGroup>
        {fromBranchChecked && (
          <Combobox
            id="combobox-inline-single"
            events={{
              onSelect: handleBranchSelection,
              onChange: handleBranchChange,
              onRequestRemoveSelectedOption: handleBranchRemoveSelection,
              onBlur: handleBranchBlur,
            }}
            labels={{
              label: i18n.t('Select a branch to use for this epic'),
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
          label={i18n.t('Epic Name')}
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
          label={i18n.t('Description')}
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
    </Modal>
  );
};

export default withRouter(CreateEpicModal);
