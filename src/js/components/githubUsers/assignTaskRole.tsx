import Button from '@salesforce/design-system-react/components/button';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import InputIcon from '@salesforce/design-system-react/components/icon/input-icon';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import i18n from 'i18next';
import { orderBy } from 'lodash';
import React, { useState } from 'react';
import { Trans } from 'react-i18next';
import { useSelector } from 'react-redux';

import GitHubUserButton from '~js/components/githubUsers/button';
import RefreshGitHubUsersButton from '~js/components/githubUsers/refreshUsersButton';
import { SpinnerWrapper } from '~js/components/utils';
import { GitHubUser, User } from '~js/store/user/reducer';
import { selectUserState } from '~js/store/user/selectors';
import { ORG_TYPES, OrgTypes } from '~js/utils/constants';

const AssignTaskRoleModal = ({
  projectId,
  epicUsers,
  githubUsers,
  selectedUser,
  orgType,
  isOpen,
  isRefreshingUsers,
  onRequestClose,
  setUser,
}: {
  projectId: string;
  epicUsers: GitHubUser[];
  githubUsers: GitHubUser[];
  selectedUser: GitHubUser | null;
  orgType: OrgTypes;
  isOpen: boolean;
  isRefreshingUsers: boolean;
  onRequestClose: () => void;
  setUser: (user: string | null, shouldAlertAssignee: boolean) => void;
}) => {
  const currentUser = useSelector(selectUserState) as User;
  const [selection, setSelection] = useState<GitHubUser | null>(null);
  const [shouldAlertAssignee, setShouldAlertAssignee] = useState(true);
  const [autoToggle, setAutoToggle] = useState(true);
  const [findText, setFindText] = useState('');

  const sort = (arr: GitHubUser[]) =>
    orderBy(
      arr,
      [(u) => u.id === currentUser.github_id, (u) => u.login.toLowerCase()],
      ['desc', 'asc'],
    );
  const validEpicUsers = sort(
    epicUsers.filter(
      (u) =>
        (u.permissions?.push || orgType === ORG_TYPES.QA) &&
        u.id !== selectedUser?.id,
    ),
  );
  const epicUserIds = validEpicUsers.map((u) => u.id);
  const validGitHubUsers = sort(
    githubUsers.filter(
      (u) =>
        (u.permissions?.push || orgType === ORG_TYPES.QA) &&
        u.id !== selectedUser?.id &&
        !epicUserIds.includes(u.id),
    ),
  );

  const filteredEpicUsers = findText
    ? validEpicUsers.filter(
        (u) =>
          u.login.toLowerCase().includes(findText.toLowerCase()) ||
          (u.name && u.name.toLowerCase().includes(findText.toLowerCase())),
      )
    : validEpicUsers;

  const filteredGitHubUsers = findText
    ? validGitHubUsers.filter(
        (u) =>
          u.login.toLowerCase().includes(findText.toLowerCase()) ||
          (u.name && u.name.toLowerCase().includes(findText.toLowerCase())),
      )
    : validGitHubUsers;

  const handleAlertAssignee = (
    event: React.FormEvent<HTMLFormElement>,
    { checked }: { checked: boolean },
  ) => {
    setShouldAlertAssignee(checked);
    setAutoToggle(false);
  };
  const handleAssigneeSelection = (user: GitHubUser) => {
    const currentUserSelected = user.id === currentUser.github_id;
    setSelection(user);
    if (autoToggle) {
      setShouldAlertAssignee(!currentUserSelected);
    }
  };
  const handleClose = () => {
    onRequestClose();
    setSelection(null);
    setShouldAlertAssignee(true);
    setAutoToggle(true);
    setFindText('');
  };
  const handleSave = () => {
    /* istanbul ignore else */
    if (selection) {
      setUser(selection.id, shouldAlertAssignee);
    }
    handleClose();
  };

  const handleFindTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFindText(e.target.value);
  };

  const heading =
    orgType === ORG_TYPES.QA
      ? i18n.t('Assign Tester')
      : i18n.t('Assign Developer');
  const checkboxLabel =
    orgType === ORG_TYPES.QA
      ? i18n.t('Notify Assigned Tester by Email')
      : i18n.t('Notify Assigned Developer by Email');
  const alertType =
    orgType === ORG_TYPES.DEV ? 'should_alert_dev' : 'should_alert_qa';

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      assistiveText={{ closeButton: i18n.t('Cancel') }}
      heading={heading}
      directional
      size="small"
      className="modal-set-height"
      footer={[
        <Checkbox
          key="alert"
          labels={{ label: checkboxLabel }}
          className="slds-float_left slds-p-top_xx-small"
          name={alertType}
          checked={shouldAlertAssignee}
          onChange={handleAlertAssignee}
        />,
        <Button key="cancel" label={i18n.t('Cancel')} onClick={handleClose} />,
        <Button
          key="submit"
          label={i18n.t('Save')}
          variant="brand"
          disabled={!selection}
          onClick={handleSave}
        />,
      ]}
    >
      {selectedUser && (
        <>
          <div className="slds-p-around_medium">
            <h3 className="slds-text-heading_small slds-m-bottom_x-small">
              {i18n.t('Currently Assigned')}
            </h3>
            <GitHubUserButton
              user={selectedUser}
              isAssigned
              badgeColor="light"
            />
          </div>
          <hr className="slds-m-vertical_none slds-m-horizontal_medium" />
        </>
      )}
      <div
        className="slds-grid
          slds-grid_vertical-align-start
          slds-p-around_medium"
      >
        <div className="slds-grid slds-wrap slds-shrink slds-p-right_medium">
          <p>
            <Trans i18nKey="assignUserHelper">
              Assign any user to this role, and they will also be added as an
              Epic Collaborator.
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
            isRefreshing={isRefreshingUsers}
            projectId={projectId}
            githubUsers={githubUsers}
          />
        </div>
      </div>
      <div className="slds-is-relative">
        <div
          className="slds-size_1-of-1
            slds-small-size_2-of-3
            slds-p-horizontal_medium
            slds-p-bottom_medium"
        >
          <Input
            value={findText}
            onChange={handleFindTextChange}
            iconRight={<InputIcon name="search" category="utility" />}
            placeholder={i18n.t('Search for user')}
          />
        </div>
        <div className="slds-p-horizontal_medium slds-p-bottom_medium">
          <h3 className="slds-text-heading_small slds-m-bottom_x-small">
            {i18n.t('Epic Collaborators')}
          </h3>
          {filteredEpicUsers.length ? (
            <ul>
              {filteredEpicUsers.map((user) => (
                <li key={user.id}>
                  <GitHubUserButton
                    user={user}
                    isSelected={selection === user}
                    onClick={() => handleAssigneeSelection(user)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="slds-p-left_x-small">
              {findText
                ? i18n.t('No users found.')
                : i18n.t('There are no available Epic Collaborators.')}
            </p>
          )}
        </div>
        <div className="slds-p-horizontal_medium slds-p-bottom_medium">
          <h3 className="slds-text-heading_small slds-m-bottom_x-small">
            {i18n.t('Other GitHub Collaborators')}
          </h3>
          {filteredGitHubUsers.length ? (
            <ul>
              {filteredGitHubUsers.map((user) => (
                <li key={user.id}>
                  <GitHubUserButton
                    user={user}
                    isSelected={selection === user}
                    onClick={() => handleAssigneeSelection(user)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="slds-p-left_x-small">
              {findText
                ? i18n.t('No users found.')
                : i18n.t('There are no available GitHub Collaborators.')}
            </p>
          )}
        </div>
        {isRefreshingUsers && <SpinnerWrapper />}
      </div>
    </Modal>
  );
};

export default AssignTaskRoleModal;
