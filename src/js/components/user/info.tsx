import Avatar from '@salesforce/design-system-react/components/avatar';
import Button from '@salesforce/design-system-react/components/button';
import Icon from '@salesforce/design-system-react/components/icon';
import Modal from '@salesforce/design-system-react/components/modal';
import Popover from '@salesforce/design-system-react/components/popover';
import Tooltip from '@salesforce/design-system-react/components/tooltip';
import classNames from 'classnames';
import { t } from 'i18next';
import React, { useCallback, useState } from 'react';
import { Trans } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import ConnectModal from '@/js/components/user/connect';
import Logout from '@/js/components/user/logout';
import {
  ExternalLink,
  SpinnerWrapper,
  useIsMounted,
} from '@/js/components/utils';
import { ThunkDispatch } from '@/js/store';
import { disconnect, refreshUser } from '@/js/store/user/actions';
import { User } from '@/js/store/user/reducer';
import { selectUserState } from '@/js/store/user/selectors';

const ConnectToSalesforce = ({
  toggleModal,
}: {
  toggleModal: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const openConnectModal = () => {
    toggleModal(true);
  };

  return (
    <>
      <Button
        label={t('Connect to Salesforce')}
        className="slds-text-body_regular slds-p-right_xx-small"
        variant="link"
        onClick={openConnectModal}
      />
      <Tooltip
        content={t(
          'Connection to a Salesforce Org with Dev Hub enabled is required to create a Dev, Test, or Scratch Org.',
        )}
        position="overflowBoundaryElement"
        align="top right"
      />
    </>
  );
};

const ConnectionInfoWarning = () => (
  <Trans i18nKey="devHubNotEnabled">
    This Salesforce Org does not have Dev Hub enabled or your user does not have
    permission to create Dev, Test, or Scratch Orgs. Learn how to{' '}
    <ExternalLink url="https://help.salesforce.com/articleView?id=sfdx_setup_enable_devhub.htm&type=0">
      enable Dev Hub
    </ExternalLink>
    .
  </Trans>
);

const UserInfo = ({
  user,
  onDisconnect = () => {},
}: {
  user: User;
  onDisconnect?: () => void;
}) => {
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMounted = useIsMounted();
  const dispatch = useDispatch<ThunkDispatch>();
  const doDisconnect = useCallback(() => {
    setIsDisconnecting(true);
    dispatch(disconnect()).finally(() => {
      onDisconnect();
      /* istanbul ignore else */
      if (isMounted.current) {
        setIsDisconnecting(false);
      }
    });
  }, [dispatch, isMounted, onDisconnect]);
  const doRefreshDevHubStatus = useCallback(() => {
    setIsRefreshing(true);
    dispatch(refreshUser()).finally(() => {
      /* istanbul ignore else */
      if (isMounted.current) {
        setIsRefreshing(false);
      }
    });
  }, [dispatch, isMounted]);

  /* istanbul ignore if */
  if (user.uses_global_devhub) {
    return null;
  }

  return (
    <>
      {(isDisconnecting || isRefreshing) && <SpinnerWrapper />}
      <ul>
        <li>
          <strong>{t('Dev Hub:')}</strong>{' '}
          {user.is_devhub_enabled ? (
            <span className="slds-text-color_success">{t('Enabled')}</span>
          ) : (
            <>
              <span className="slds-text-color_error">{t('Not Enabled')}</span>
              {' | '}
              <Button
                label={t('Check Again')}
                variant="link"
                onClick={doRefreshDevHubStatus}
              />
            </>
          )}
        </li>
        {user.sf_username && (
          <li>
            <strong>{t('User:')}</strong> {user.sf_username}
          </li>
        )}
        {user.org_name && (
          <li>
            <strong>{t('Org:')}</strong> {user.org_name}
          </li>
        )}
        {user.org_type && (
          <li>
            <strong>{t('Type:')}</strong> {user.org_type}
          </li>
        )}
      </ul>
      {!user.devhub_username && (
        <Button
          label={t('Disconnect from Salesforce')}
          variant="link"
          className="slds-m-top_small"
          onClick={doDisconnect}
        />
      )}
    </>
  );
};

const ConnectionInfo = ({ user }: { user: User }) => (
  <>
    <Icon
      className="slds-is-absolute"
      category="utility"
      name="connected_apps"
      size="small"
    />
    <div className="slds-p-left_x-large slds-m-bottom_small">
      <p className="slds-text-heading_small">{t('Connected to Salesforce')}</p>
      {!user.is_devhub_enabled && (
        <p className="slds-text-color_weak slds-m-top_xx-small">
          <Icon
            assistiveText={{ label: t('Error') }}
            category="utility"
            name="error"
            colorVariant="error"
            size="x-small"
            className="slds-m-bottom_xxx-small"
            containerClassName="slds-m-right_xx-small"
          />
          <ConnectionInfoWarning />
        </p>
      )}
    </div>
    <UserInfo user={user} />
  </>
);

export const ConnectionInfoModal = ({
  user,
  isOpen,
  toggleModal,
  onDisconnect,
  successText,
}: {
  user: User;
  isOpen: boolean;
  toggleModal: (open: boolean) => void;
  onDisconnect?: () => void;
  successText?: string;
}) => {
  const handleClose = () => {
    toggleModal(false);
  };
  const isConnected = Boolean(
    user.valid_token_for || user.devhub_username || user.uses_global_devhub,
  );

  return (
    <Modal
      isOpen={isConnected && isOpen}
      assistiveText={{ closeButton: t('Close') }}
      heading={
        user.is_devhub_enabled ? t('Dev Hub Enabled') : t('Enable Dev Hub')
      }
      tagline={
        user.is_devhub_enabled ? (
          successText ||
          t('Please close this message and try your action again.')
        ) : (
          <ConnectionInfoWarning />
        )
      }
      prompt={user.is_devhub_enabled ? 'success' : 'warning'}
      footer={
        user.is_devhub_enabled && [
          <Button key="close" label={t('Continue')} onClick={handleClose} />,
        ]
      }
      onRequestClose={handleClose}
    >
      <div className="slds-p-vertical_medium slds-is-relative">
        <UserInfo user={user} onDisconnect={onDisconnect} />
      </div>
    </Modal>
  );
};

const UserDropdown = () => {
  const user = useSelector(selectUserState);
  const [modalOpen, setModalOpen] = useState(false);

  if (!user) {
    return null;
  }

  return (
    <>
      <Popover
        align="bottom right"
        body={
          <>
            <header
              className={classNames({
                'slds-border_bottom': !user.uses_global_devhub,
                'slds-p-bottom_x-small': !user.uses_global_devhub,
                'slds-m-bottom_x-small': !user.uses_global_devhub,
              })}
            >
              <div className="slds-p-vertical_small slds-p-horizontal_large">
                {user.avatar_url ? (
                  <div className="slds-is-absolute">
                    <Avatar
                      variant="user"
                      imgSrc={user.avatar_url}
                      imgAlt={t('avatar for user {{username}}', {
                        username: user.username,
                      })}
                      title={user.username}
                      size="small"
                    />
                  </div>
                ) : (
                  <Icon
                    className="slds-is-absolute"
                    category="utility"
                    name="user"
                    size="small"
                  />
                )}
                <div className="slds-p-left_x-large">
                  <h2
                    id="user-info-heading"
                    className="slds-text-heading_small"
                  >
                    {user.username}
                  </h2>
                  <Logout className="slds-m-top_xx-small" />
                </div>
              </div>
            </header>
            {!user.uses_global_devhub && (
              <div className="slds-p-vertical_small slds-p-horizontal_large">
                {user.valid_token_for || user.devhub_username ? (
                  <ConnectionInfo user={user} />
                ) : (
                  <ConnectToSalesforce toggleModal={setModalOpen} />
                )}
              </div>
            )}
          </>
        }
        classNameBody="slds-p-horizontal_none"
        ariaLabelledby="user-info-heading"
        hasNoCloseButton
      >
        <Button
          variant="icon"
          label={
            <Avatar
              variant="user"
              imgSrc={user.avatar_url || undefined}
              imgAlt={t('avatar for user {{username}}', {
                username: user.username,
              })}
              title={user.username}
              size="medium"
            />
          }
        />
      </Popover>
      {!user.uses_global_devhub && (
        <ConnectModal
          user={user}
          isOpen={modalOpen}
          toggleModal={setModalOpen}
        />
      )}
    </>
  );
};

export default UserDropdown;
