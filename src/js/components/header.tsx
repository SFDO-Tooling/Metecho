import Icon from '@salesforce/design-system-react/components/icon';
import Dropdown from '@salesforce/design-system-react/components/menu-dropdown';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import PageHeaderControl from '@salesforce/design-system-react/components/page-header/control';
import i18n from 'i18next';
import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Link,
  match as Match,
  useHistory,
  useRouteMatch,
} from 'react-router-dom';

import backpackIcon from '~img/backpack-sm.svg';
import mapIcon from '~img/map-sm.svg';
import seesawIcon from '~img/seesaw-sm.svg';
import Errors from '~js/components/apiErrors';
import OfflineAlert from '~js/components/offlineAlert';
import Toasts from '~js/components/toasts';
import UserInfo from '~js/components/user/info';
import { AppState } from '~js/store';
import { selectProject } from '~js/store/projects/selectors';
import { selectSocketState } from '~js/store/socket/selectors';
import { selectUserState } from '~js/store/user/selectors';
import {
  SHOW_WALKTHROUGH,
  WALKTHROUGH_TYPES,
  WalkthroughType,
} from '~js/utils/constants';
import routes, { routePatterns } from '~js/utils/routes';

const TourLabel = ({
  data: { label, iconPath, iconName },
}: {
  data: {
    label: string;
    iconPath: string;
    iconName: string;
  };
}) => (
  <span className="slds-truncate" title={label}>
    <Icon
      className="slds-m-right_x-small"
      position="left"
      size="small"
      path={`${iconPath}#${iconName}`}
    />
    {label}
  </span>
);

const TourDropdown = () => {
  const history = useHistory();
  const match =
    useRouteMatch<{
      projectSlug?: string;
    }>(routePatterns.project_detail()) ||
    ({ params: {} } as Match<{ projectSlug?: string }>);
  const selectProjectWithProps = useCallback(selectProject, []);
  const project = useSelector((state: AppState) =>
    selectProjectWithProps(state, { match }),
  );
  const projectUrl = project ? routes.project_detail(project.slug) : null;

  const handleSelect = useCallback(
    ({ value, disabled }: { value: WalkthroughType; disabled?: boolean }) => {
      /* istanbul ignore else */
      if (projectUrl && !disabled) {
        history.push(projectUrl, { [SHOW_WALKTHROUGH]: value });
      }
    },
    [projectUrl], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return project ? (
    <div className="slds-col_padded">
      <Dropdown
        align="right"
        assistiveText={{ icon: i18n.t('Get Help') }}
        buttonClassName="tour-walkthroughs"
        buttonVariant="icon"
        iconCategory="utility"
        iconName="question"
        iconSize="large"
        iconVariant="more"
        width="xx-small"
        listItemRenderer={TourLabel}
        options={[
          {
            label: i18n.t('Play Walkthrough'),
            value: WALKTHROUGH_TYPES.PLAY,
            iconPath: seesawIcon,
            iconName: 'seesaw-sm',
            disabled: true,
          },
          {
            label: i18n.t('Help Walkthrough'),
            value: WALKTHROUGH_TYPES.HELP,
            iconPath: backpackIcon,
            iconName: 'backpack-sm',
            disabled: true,
          },
          {
            label: i18n.t('Plan Walkthrough'),
            value: WALKTHROUGH_TYPES.PLAN,
            iconPath: mapIcon,
            iconName: 'map-sm',
          },
        ]}
        onSelect={handleSelect}
      />
    </div>
  ) : null;
};

const Header = () => {
  const user = useSelector(selectUserState);
  const socket = useSelector(selectSocketState);

  const controls = () => (
    <PageHeaderControl className="slds-grid slds-grid_vertical-align-center">
      {window.GLOBALS.ENABLE_WALKTHROUGHS ? <TourDropdown /> : null}
      <UserInfo />
    </PageHeaderControl>
  );

  return user ? (
    <>
      {socket ? null : <OfflineAlert />}
      <Errors />
      <Toasts />
      <PageHeader
        className="global-header
          slds-p-horizontal_x-large
          slds-p-vertical_medium"
        title={
          <Link
            to={routes.home()}
            className="slds-text-heading_large slds-text-link_reset"
          >
            <span data-logo-bit="start">met</span>
            <span data-logo-bit="end">échō</span>
          </Link>
        }
        onRenderControls={controls}
      />
    </>
  ) : null;
};

export default Header;
