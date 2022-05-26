import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import { uniqBy } from 'lodash';
import React, { useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { EmptyIllustration } from '@/js/components/404';
import RefreshCollaboratorsButton from '@/js/components/githubOrgs/refreshCollaboratorsButton';
import { UserTableCell } from '@/js/components/githubUsers/assignEpicCollaborators';
import { CreateProjectData } from '@/js/components/projects/createProjectModal';
import { SpinnerWrapper, UseFormProps } from '@/js/components/utils';
import { GitHubUser } from '@/js/store/user/reducer';

interface Props {
  collaborators: GitHubUser[];
  isRefreshingCollaborators: boolean;
  inputs: CreateProjectData;
  setInputs: UseFormProps['setInputs'];
  fetchCollaborators: (org: string) => Promise<void>;
}

const SelectProjectCollaboratorsForm = ({
  collaborators,
  isRefreshingCollaborators,
  inputs,
  setInputs,
  fetchCollaborators,
}: Props) => {
  const { t } = useTranslation();

  const handleUserClick = useCallback(
    (user: GitHubUser) => {
      const isSelected =
        inputs.github_users.findIndex((u) => u.id === user.id) > -1;
      if (isSelected) {
        setInputs({
          ...inputs,
          github_users: inputs.github_users.filter((u) => u.id !== user.id),
        });
      } else {
        setInputs({
          ...inputs,
          github_users: uniqBy([...inputs.github_users, user], 'id'),
        });
      }
    },
    [inputs, setInputs],
  );

  const doRefreshCollaborators = useCallback(
    () => fetchCollaborators(inputs.organization),
    [fetchCollaborators, inputs.organization],
  );

  const updateSelection = (
    event: React.ChangeEvent<HTMLInputElement>,
    data: { selection: GitHubUser[] },
  ) => {
    setInputs({ ...inputs, github_users: data.selection });
  };

  return (
    <form className="slds-form">
      <div
        className="slds-grid
          slds-grid_vertical-align-start
          slds-p-around_medium"
      >
        <div className="slds-grid slds-wrap slds-shrink slds-p-right_medium">
          <p>
            <Trans i18nKey="projectCollaboratorsHelp">
              Only users who have access to the selected GitHub Organization
              will appear in the list below.
            </Trans>
          </p>
        </div>
        <div
          className="slds-grid
            slds-grow
            slds-shrink-none
            slds-grid_align-end"
        >
          <RefreshCollaboratorsButton
            isRefreshing={isRefreshingCollaborators}
            doRefresh={doRefreshCollaborators}
          />
        </div>
      </div>
      <div className="slds-is-relative">
        {collaborators.length ? (
          <DataTable
            className="align-checkboxes table-row-targets"
            items={collaborators}
            selectRows="checkbox"
            selection={inputs.github_users}
            onRowChange={updateSelection}
          >
            <DataTableColumn
              label={t('GitHub Collaborators')}
              property="login"
              primaryColumn
              truncate
            >
              <UserTableCell handleUserClick={handleUserClick} />
            </DataTableColumn>
          </DataTable>
        ) : (
          <div className="slds-p-around_medium">
            <EmptyIllustration message={t('No Available Collaborators')} />
          </div>
        )}
        {isRefreshingCollaborators && <SpinnerWrapper />}
      </div>
    </form>
  );
};

export default SelectProjectCollaboratorsForm;
