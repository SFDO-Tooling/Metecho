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
import { useDispatch } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { AnyAction } from 'redux';

import { LabelWithSpinner, useForm, useIsMounted } from '@/components/utils';
import { ThunkDispatch } from '@/store';
import { Repository } from '@/store/repositories/reducer';
import { User } from '@/store/user/reducer';
import apiFetch from '@/utils/api';
import { OBJECT_TYPES } from '@/utils/constants';
import routes from '@/utils/routes';

interface ComboboxOption {
  id: string;
  label: string;
}

interface Props extends RouteComponentProps {
  user: User;
  repository: Repository;
  isOpen: boolean;
  closeCreateModal: () => void;
}

const CreateProjectModal = ({
  user,
  repository,
  isOpen,
  history,
  closeCreateModal,
}: Props) => {
  const isMounted = useIsMounted();
  // state related to setting base branch on project creation
  const [fromBranchChecked, setFromBranchChecked] = useState(false);
  const [fetchingBranches, setFetchingBranches] = useState(false);
  const [repoBranches, setRepoBranches] = useState<string[]>([]);
  const [filterVal, setFilterVal] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const submitButton = useRef<HTMLButtonElement | null>(null);

  const dispatch = useDispatch<ThunkDispatch>();

  const submitClicked = (e: React.MouseEvent<HTMLButtonElement>) => {
    /* istanbul ignore if */
    if (!isOpen) {
      e.preventDefault();
    }
    /* istanbul ignore else */
    if (submitButton.current) {
      submitButton.current.click();
      setIsSaving(true);
    }
  };

  const onSuccess = (action: AnyAction) => {
    const {
      type,
      payload: { object, objectType },
    } = action;
    if (
      type === 'CREATE_OBJECT_SUCCEEDED' &&
      objectType === OBJECT_TYPES.PROJECT &&
      object?.slug
    ) {
      setIsSaving(false);
      const url = routes.project_detail(repository.slug, object.slug);
      history.push(url);
    }
  };

  const githubUser = repository.github_users.find(
    (ghUser) => ghUser.login === user.username,
  );
  const {
    inputs,
    errors,
    handleInputChange,
    setInputs,
    handleSubmit,
    resetForm,
  } = useForm({
    fields: { name: '', description: '', branch_name: '' },
    objectType: OBJECT_TYPES.PROJECT,
    additionalData: {
      repository: repository.id,
      github_users: githubUser ? [githubUser] : [],
    },
    onSuccess,
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

  const doGetBranches = async () => {
    setFetchingBranches(true);
    // fetching feature branches here when option selected,
    // in lieu of storing in store...
    const baseBranches = await apiFetch({
      url: `${window.api_urls.repository_feature_branches(repository.id)}`,
      dispatch,
    });
    /* istanbul ignore else */
    if (isMounted.current) {
      setRepoBranches(baseBranches);
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
    if (repoBranches.includes(filterVal)) {
      setBranch(filterVal);
    }
    resetFilterVal();
  };

  const noFeatureBranches = !repoBranches.length;
  const inputVal = inputs.branch_name;
  const branchOptions: ComboboxOption[] = repoBranches.map((item, index) => ({
    id: `${index + 1}`,
    label: item,
  }));
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
        <Button
          label={i18n.t('Check again')}
          variant="link"
          onClick={doGetBranches}
        />{' '}
        {i18n.t('to refresh this list or')}{' '}
        <Button
          label={i18n.t('start from a new branch.')}
          variant="link"
          onClick={closeBranchForm}
        />
      </>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      size="small"
      disableClose={isSaving}
      heading={`${i18n.t('Create a Project for')} ${repository.name}`}
      onRequestClose={closeForm}
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
              <LabelWithSpinner label={i18n.t('Saving…')} variant="inverse" />
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
        onSubmit={handleSubmit}
        className="slds-form slds-m-bottom--large slds-p-around_large"
        data-form="create-project-branch"
      >
        <RadioGroup
          assistiveText={{
            label: i18n.t('Project Branch'),
            required: i18n.t('Required'),
          }}
          className="slds-form-element_stacked slds-p-left_none"
          name="project-branch"
          required
          onChange={handleBranchCheckboxChange}
        >
          <Radio
            id="project-branch-new"
            labels={{ label: i18n.t('Create new branch on GitHub') }}
            checked={!fromBranchChecked}
            name="project-branch"
            value="new"
          />
          <Radio
            id="project-branch-existing"
            labels={{ label: i18n.t('Use existing GitHub branch') }}
            checked={fromBranchChecked}
            name="project-branch"
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
              label: i18n.t('Select a branch to use for this project'),
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
          id="project-name"
          label={i18n.t('Project Name')}
          className="slds-form-element_stacked slds-p-left_none"
          name="name"
          value={inputs.name}
          required
          aria-required
          errorText={errors.name}
          onChange={handleInputChange}
        />
        <Textarea
          id="project-description"
          label={i18n.t('Description')}
          classNameContainer="slds-form-element_stacked slds-p-left_none"
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

export default withRouter(CreateProjectModal);
