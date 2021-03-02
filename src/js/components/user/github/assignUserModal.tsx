import Avatar from '@salesforce/design-system-react/components/avatar';
import Button from '@salesforce/design-system-react/components/button';
import Card from '@salesforce/design-system-react/components/card';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import Modal from '@salesforce/design-system-react/components/modal';
import classNames from 'classnames';
import i18n from 'i18next';
import React, { useCallback, useEffect, useState } from 'react';
import { Trans } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { Project } from 'src/js/store/projects/reducer';

import { EmptyIllustration } from '~js/components/404';
import ReSyncGithubUserButton from '~js/components/user/github/reSyncButton';
import GithubUserTable from '~js/components/user/github/table';
import { GitHubUserButton } from '~js/components/user/githubUser';
import { LabelWithSpinner, SpinnerWrapper } from '~js/components/utils';
import { ThunkDispatch } from '~js/store';
import { refreshGitHubUsers } from '~js/store/projects/actions';
import { GitHubUser, User } from '~js/store/user/reducer';
import { selectUserState } from '~js/store/user/selectors';
import { ORG_TYPES, OrgTypes } from '~js/utils/constants';

const AssignUserModal = ({
  epicUsers,
  selectedUser,
  orgType,
  isOpen,
  emptyMessageText,
  emptyMessageAction,
  onRequestClose,
  setUser,
  project,
}: {
  epicUsers: GitHubUser[];
  selectedUser: GitHubUser | null;
  orgType: OrgTypes;
  isOpen: boolean;
  emptyMessageText: string;
  emptyMessageAction: () => void;
  onRequestClose: () => void;
  setUser: (user: GitHubUser | null, shouldAlertAssignee: boolean) => void;
  project: Project;
}) => {
  const currentUser = useSelector(selectUserState) as User;
  const dispatch = useDispatch<ThunkDispatch>();
  const [selection, setSelection] = useState<GitHubUser | null>(null);
  const [shouldAlertAssignee, setShouldAlertAssignee] = useState(true);
  const [autoToggle, setAutoToggle] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleAlertAssignee = (
    event: React.FormEvent<HTMLFormElement>,
    { checked }: { checked: boolean },
  ) => {
    setShouldAlertAssignee(checked);
    setAutoToggle(false);
  };
  const handleAssigneeSelection = (user: GitHubUser) => {
    const currentUserSelected = user.login === currentUser.username;
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
  };
  const handleSave = () => {
    console.log('setUser');
    handleClose();
    /* @@@ todo... does this need to chenge?
    setUser(selection, shouldAlertAssignee);
    handleClose();
    */
  };

  const doRefreshGitHubUsers = useCallback(() => {
    /* istanbul ignore if */
    if (!project) {
      return;
    }
    setIsRefreshing(true);
    dispatch(refreshGitHubUsers(project.id)).finally(() =>
      setIsRefreshing(false),
    );
  }, [project, dispatch]);

  const filteredUsers = epicUsers.filter(
    (user) => user.id !== selectedUser?.id,
  );
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

  const githubCollaboratorHeading = filteredUsers.length
    ? 'Other Github Collaborators'
    : 'Github Collaborators';
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      heading={heading}
      directional
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
          onClick={handleSave}
        />,
      ]}
    >
      <div
        className="slds-grid
          slds-grid_vertical-align-start
          slds-p-top_medium
          slds-p-horizontal_medium"
      >
        <div className="slds-grid slds-wrap slds-shrink slds-p-right_medium">
          <p>
            <Trans i18nKey="assignUserHelper">
              Assign any Github user to this role. If they are not already, the
              will also be added as an Epic Collaborator.
            </Trans>
          </p>
        </div>
        <div
          className="slds-grid
            slds-grow
            slds-shrink-none
            slds-grid_align-end"
        >
          <ReSyncGithubUserButton
            isRefreshing={isRefreshing}
            refreshUsers={doRefreshGitHubUsers}
          />
        </div>
      </div>
      <div className="slds-p-around_medium">
        <input type="text" placeholder="Quick Find" />
      </div>
      {filteredUsers.length ? (
        <>
          <h2 className="slds-text-heading_medium slds-p-left_medium slds-p-bottom_medium">
            Epic Collaborators
          </h2>
          <GithubUserTable users={epicUsers} />
        </>
      ) : null}
      <h2 className="slds-text-heading_medium slds-p-around_medium">
        {githubCollaboratorHeading}
      </h2>
      <GithubUserTable users={project.github_users} />
      {isRefreshing && <SpinnerWrapper />}
    </Modal>
  );
};

export default AssignUserModal;
