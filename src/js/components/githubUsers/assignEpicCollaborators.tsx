import Button from '@salesforce/design-system-react/components/button';
import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import Modal from '@salesforce/design-system-react/components/modal';
import React, { useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { EmptyIllustration } from '@/js/components/404';
import GitHubUserButton from '@/js/components/githubUsers/button';
import RefreshGitHubUsersButton from '@/js/components/githubUsers/refreshUsersButton';
import { SpinnerWrapper } from '@/js/components/utils';
import { GitHubUser } from '@/js/store/user/reducer';

interface TableCellProps {
  [key: string]: any;
  item?: GitHubUser;
  handleUserClick: (user: GitHubUser) => void;
}

const UserTableCell = ({ item, handleUserClick, ...props }: TableCellProps) => {
  /* istanbul ignore if */
  if (!item) {
    return null;
  }
  const { login } = item;
  const handleClick = () => {
    handleUserClick(item);
  };
  return (
    <DataTableCell {...props} title={login} className="slds-p-around_none">
      <GitHubUserButton user={item} badgeColor="light" onClick={handleClick} />
    </DataTableCell>
  );
};
UserTableCell.displayName = DataTableCell.displayName;

const AssignEpicCollaboratorsModal = ({
  allUsers,
  selectedUsers,
  heading,
  isOpen,
  onRequestClose,
  setUsers,
  isRefreshing,
  projectId,
}: {
  allUsers: GitHubUser[];
  selectedUsers: GitHubUser[];
  heading: string;
  isOpen: boolean;
  onRequestClose: () => void;
  setUsers: (users: GitHubUser[]) => void;
  isRefreshing: boolean;
  projectId: string;
}) => {
  const { t } = useTranslation();
  const [selection, setSelection] = useState(selectedUsers);
  const reset = useCallback(() => setSelection(selectedUsers), [selectedUsers]);

  // When selected users change, update row selection
  useEffect(() => {
    reset();
  }, [reset]);

  const handleUserClick = useCallback(
    (user: GitHubUser) => {
      const isSelected = selection.findIndex((u) => u.id === user.id) > -1;
      if (isSelected) {
        setSelection(selection.filter((u) => u.id !== user.id));
      } else {
        setSelection([...selection, user]);
      }
    },
    [selection],
  );

  // When modal is canceled, reset row selection
  const handleClose = () => {
    reset();
    onRequestClose();
  };
  const updateSelection = (
    event: React.ChangeEvent<HTMLInputElement>,
    data: { selection: GitHubUser[] },
  ) => {
    setSelection(data.selection);
  };
  const handleSubmit = () => {
    setUsers([...selection]);
    reset();
  };

  return (
    <Modal
      isOpen={isOpen}
      heading={heading}
      assistiveText={{ closeButton: t('Cancel') }}
      footer={
        allUsers.length
          ? [
              <Button key="cancel" label={t('Cancel')} onClick={handleClose} />,
              <Button
                key="submit"
                type="submit"
                label={t('Save')}
                variant="brand"
                onClick={handleSubmit}
              />,
            ]
          : null
      }
      size="small"
      onRequestClose={handleClose}
    >
      <div
        className="slds-grid
          slds-grid_vertical-align-start
          slds-p-around_medium"
      >
        <div className="slds-grid slds-wrap slds-shrink slds-p-right_medium">
          <p>
            <Trans i18nKey="epicCollaborators">
              Only users who have access to the GitHub repository for this Epic
              will appear in the list below. Visit GitHub to invite additional
              Collaborators.
            </Trans>
          </p>
        </div>
        <div
          className="slds-grid
            slds-grow
            slds-shrink-none
            slds-grid_align-end"
        >
          <RefreshGitHubUsersButton
            isRefreshing={isRefreshing}
            projectId={projectId}
            githubUsers={allUsers}
          />
        </div>
      </div>
      <div className="slds-is-relative">
        {allUsers.length ? (
          <DataTable
            className="align-checkboxes table-row-targets"
            items={allUsers}
            selectRows="checkbox"
            selection={selection}
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
            <EmptyIllustration
              message={
                <Trans i18nKey="noGitHubUsers">
                  We couldn’t find any GitHub users who have access to this
                  Project. Try re-syncing the list of available Collaborators,
                  or contact an admin for this Project on GitHub.
                </Trans>
              }
            />
          </div>
        )}
        {isRefreshing && <SpinnerWrapper />}
      </div>
    </Modal>
  );
};

export default AssignEpicCollaboratorsModal;
