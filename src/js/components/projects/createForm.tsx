import Button from '@salesforce/design-system-react/components/button';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import Combobox from '@salesforce/design-system-react/components/combobox';
import Input from '@salesforce/design-system-react/components/input';
import Textarea from '@salesforce/design-system-react/components/textarea';
import classNames from 'classnames';
import i18n from 'i18next';
import React, { useState } from 'react';
import { Trans } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { AnyAction } from 'redux';

import { useForm } from '@/components/utils';
import { ThunkDispatch } from '@/store';
import { fetchRepoBranches } from '@/store/repositories/actions';
import { Repository } from '@/store/repositories/reducer';
import { User } from '@/store/user/reducer';
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
  const [fromBranchChecked, setFromBranchChecked] = useState(false);
  const [fetchingBranches, setFetchingBranches] = useState(false);
  const [baseBranch, setBaseBranch] = useState('');
  const [repoBranches, setData] = useState([]); // @todo replace with branches from store
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
    handleSubmit,
    resetForm,
  } = useForm({
    fields: { name: '', description: '' },
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
      setFromBranchChecked(!fromBranchChecked);
    }
  };
  // const fakeData = [
  //   {
  //     id: '1',
  //     label: 'Acme',
  //     subTitle: 'Account • San Francisco',
  //     type: 'account',
  //   },
  //   {
  //     id: '2',
  //     label: 'Salesforce.com, Inc.',
  //     subTitle: 'Account • San Francisco',
  //     type: 'account',
  //   },
  // ];

  const doGetBranches = () => {
    if (repoBranches.length) {
      setBranchMenuOpen(true);
    } else {
      if (branchMenuOpen) {
        setBranchMenuOpen(false);
      }
      setFetchingBranches(true);
      dispatch(fetchRepoBranches(repository.id)).finally(() => {
        /* istanbul ignore else */
        setData([]);
        setFetchingBranches(false);
        setBranchMenuOpen(true);
      });
    }
  };

  const handleBranchSelection = (selection: any) => {
    setBaseBranch(selection[0].label);
    setBranchMenuOpen(false);
  };

  const resetBranch = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setBranchMenuOpen(false);
    setFromBranchChecked(false);
  };

  const noOptionsFoundText = (
    <p data-form="project-create">
      <Trans i18nKey="createProjectHelpText">
        There aren&apos;t any available branches at this time.{' '}
        <Button
          label={i18n.t('Check Again')}
          variant="base"
          onClick={doGetBranches}
        />
        {''} to refresh this list or{' '}
        <Button
          label={i18n.t('start from a new branch')}
          variant="link"
          onClick={resetBranch}
        />
        .
      </Trans>
    </p>
  );

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
              events={{
                onRequestOpen: doGetBranches,
                onSelect: (event: React.MouseEvent, data: any) =>
                  handleBranchSelection(data.selection),
              }}
              labels={{
                label: `${i18n.t('Select a branch to use for this project')}`,
                noOptionsFound: noOptionsFoundText,
              }}
              options={repoBranches}
              hasInputSpinner={fetchingBranches}
              value={baseBranch}
              variant="inline-listbox"
              classNameContainer="repo-branch"
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
