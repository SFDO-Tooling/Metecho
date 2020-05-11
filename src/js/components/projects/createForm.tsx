import Button from '@salesforce/design-system-react/components/button';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import Combobox from '@salesforce/design-system-react/components/combobox';
import comboboxFilter from '@salesforce/design-system-react/components/combobox/filter';
import Input from '@salesforce/design-system-react/components/input';
import Textarea from '@salesforce/design-system-react/components/textarea';
import classNames from 'classnames';
import i18n from 'i18next';
import React, { useEffect, useState } from 'react';
import { Trans } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { AnyAction } from 'redux';

import { useForm } from '@/components/utils';
import { ThunkDispatch } from '@/store';
import { Repository } from '@/store/repositories/reducer';
import { User } from '@/store/user/reducer';
import apiFetch from '@/utils/api';
import { OBJECT_TYPES } from '@/utils/constants';
import routes from '@/utils/routes';

interface Props extends RouteComponentProps {
  user: User;
  repository: Repository;
  startOpen?: boolean;
}

const ProjectForm = ({
  user,
  repository,
  startOpen = false,
  history,
}: Props) => {
  const [isOpen, setIsOpen] = useState(startOpen);
  // state related to setting base branch on project creation
  const [fromBranchChecked, setFromBranchChecked] = useState(false);
  const [fetchingBranches, setFetchingBranches] = useState(false);
  const [baseBranch, setBaseBranch] = useState('');
  const [repoBranches, setRepoBranches] = useState<string[]>([]);
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const dispatch = useDispatch<ThunkDispatch>();

  const submitClicked = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isOpen) {
      setIsOpen(true);
      e.preventDefault();
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
    fields: { name: '', description: '', branch_name: null },
    objectType: OBJECT_TYPES.PROJECT,
    additionalData: {
      repository: repository.id,
      github_users: githubUser ? [githubUser] : [],
    },
    onSuccess,
  });

  const closeForm = () => {
    setIsOpen(false);
    resetForm();
  };

  const handleChange = (checked: boolean) => {
    if (checked) {
      setFromBranchChecked(true);
    } else {
      setBaseBranch('');
      setFromBranchChecked(!fromBranchChecked);
    }
  };

  const doGetBranches = async () => {
    if (repoBranches.length) {
      setBranchMenuOpen(true);
    } else {
      if (branchMenuOpen) {
        setBranchMenuOpen(false);
      }
      setFetchingBranches(true);
      // fetching feature branches here when option selected,
      // in lieu of storing in store...
      const baseBranches = await apiFetch({
        url: `${window.api_urls.repository_detail(
          repository.id,
        )}/feature_branches`,
        dispatch,
      });
      setRepoBranches(baseBranches);
      setFetchingBranches(false);
      setBranchMenuOpen(true);
    }
  };

  const handleBranchSelection = (selection: any) => {
    setBaseBranch(selection[0].label);
    setBranchMenuOpen(false);
  };
  useEffect(() => {
    if (baseBranch) {
      setInputs({ ...inputs, branch_name: baseBranch });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseBranch]);

  const resetBranch = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    resetForm();
    setBaseBranch('');
    setBranchMenuOpen(false);
    setFromBranchChecked(false);
  };

  // eslint-disable-next-line @typescript-eslint/camelcase
  const handleBranchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (baseBranch) {
      setBaseBranch(inputs.branch_name);
    }
    setBranchMenuOpen(true);
    handleInputChange(e);
  };

  const inputVal = inputs.branch_name;
  const noOptionsFoundText = (
    <p data-form="project-create">
      {inputVal ? (
        <>
          <Trans i18nKey="noBranchFoundText">
            No matches found for <em>{{ inputVal }}</em>. Try{' '}
          </Trans>
        </>
      ) : (
        <>
          {i18n.t("There aren't any available branches at this time.")}{' '}
          <Button
            label={i18n.t('Check Again')}
            variant="base"
            onClick={doGetBranches}
          />
          {i18n.t('to refresh this list or try')}{' '}
        </>
      )}
      <Button
        label={i18n.t('starting from a new branch.')}
        variant="link"
        onClick={resetBranch}
      />
    </p>
  );

  const branchOptions = repoBranches.map((item, index) => ({
    id: `${index + 1}`,
    label: item,
  }));
  const disableCreateBtn =
    fromBranchChecked && !repoBranches.includes(inputVal);
  return (
    <form onSubmit={handleSubmit} className="slds-form slds-m-bottom--large">
      {isOpen && (
        <>
          <Checkbox
            id="project-base-branch"
            assistiveText={{
              label: `${i18n.t('Use existing Github branch')}`,
            }}
            labels={{
              label: `${i18n.t('Use existing Github branch')}`,
            }}
            checked={fromBranchChecked}
            className="slds-form-element_stacked slds-p-left_none"
            onChange={(
              event: React.ChangeEvent<HTMLInputElement>,
              { checked }: { checked: boolean },
            ) => handleChange(checked)}
          />
          {fromBranchChecked && (
            <Combobox
              id="combobox-inline-single"
              isOpen={branchMenuOpen}
              input={
                <Input
                  id="project-branch_name"
                  label={i18n.t('Select a branch to use for this project')}
                  className="slds-combobox__input"
                  name="branch_name"
                  value={baseBranch ? baseBranch : inputs.branch_name}
                  errorText={errors.branch_name}
                  onChange={handleBranchChange}
                  onFocus={doGetBranches}
                />
              }
              events={{
                onRequestOpen: doGetBranches,
                onSelect: (event: React.MouseEvent, data: any) =>
                  handleBranchSelection(data.selection),
              }}
              labels={{
                label: `${i18n.t('Select a branch to use for this project')}`,
                noOptionsFound: noOptionsFoundText,
              }}
              menuItemVisibleLength={5}
              options={comboboxFilter({
                inputValue: inputs.branch_name,
                options: branchOptions,
                selection: branchOptions.filter(
                  (branch) => branch.label === baseBranch,
                ),
              })}
              value={baseBranch ? baseBranch : inputs.branch_name}
              hasInputSpinner={fetchingBranches}
              variant="inline-listbox"
              classNameContainer="repo-branch slds-form-element_stacked  slds-p-left_none"
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
        </>
      )}
      <div className={classNames({ 'slds-m-top--medium': isOpen })}>
        <Button
          label={isOpen ? i18n.t('Create Project') : i18n.t('Create a Project')}
          className={classNames({
            'slds-size_full hide-separator': !isOpen,
            'show-separator': isOpen,
          })}
          variant="brand"
          type="submit"
          onClick={submitClicked}
          disabled={disableCreateBtn}
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
      </div>
    </form>
  );
};

export default withRouter(ProjectForm);
