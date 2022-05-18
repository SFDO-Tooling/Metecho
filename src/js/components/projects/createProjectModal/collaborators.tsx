import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import { intersectionBy, uniqBy } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import setupSvg from '@/img/setup.svg?raw';
import { EmptyIllustration } from '@/js/components/404';
import RefreshCollaboratorsButton from '@/js/components/githubOrgs/refreshCollaboratorsButton';
import { UserTableCell } from '@/js/components/githubUsers/assignEpicCollaborators';
import { CreateProjectData } from '@/js/components/projects/createProjectModal';
import {
  Illustration,
  SpinnerWrapper,
  UseFormProps,
} from '@/js/components/utils';
import { ThunkDispatch } from '@/js/store';
import { GitHubUser } from '@/js/store/user/reducer';
import apiFetch from '@/js/utils/api';

interface Props {
  inputs: CreateProjectData;
  setInputs: UseFormProps['setInputs'];
}

const SelectProjectCollaboratorsForm = ({ inputs, setInputs }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<ThunkDispatch>();
  const [collaborators, setCollaborators] = useState<GitHubUser[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // @@@ move this up a level so that we don't refetch on every render?
  const fetchCollaborators = useCallback(async () => {
    if (inputs.organization) {
      setIsRefreshing(true);
      const response = await apiFetch({
        url: window.api_urls.organization_members(inputs.organization),
        dispatch,
      });
      setCollaborators(response || []);
      setIsRefreshing(false);
    } else {
      setCollaborators([]);
    }
  }, [dispatch, inputs.organization]);

  // Fetch GitHub Org members when organization changes
  useEffect(() => {
    if (inputs.organization) {
      fetchCollaborators();
    }
  }, [fetchCollaborators, inputs.organization]);

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

  const updateSelection = (
    event: React.ChangeEvent<HTMLInputElement>,
    data: { selection: GitHubUser[] },
  ) => {
    setInputs({ ...inputs, github_users: data.selection });
  };

  return (
    <form className="slds-form slds-p-around_large">
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
            isRefreshing={isRefreshing}
            doRefresh={fetchCollaborators}
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
            {isRefreshing ? (
              <Illustration svg={setupSvg} />
            ) : (
              <EmptyIllustration message={t('No Available Collaborators')} />
            )}
          </div>
        )}
        {isRefreshing && <SpinnerWrapper />}
      </div>
    </form>
  );
};

export default SelectProjectCollaboratorsForm;
