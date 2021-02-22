import Dropdown from '@salesforce/design-system-react/components/menu-dropdown';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import PageHeaderControl from '@salesforce/design-system-react/components/page-header/control';
import React, { useCallback, useState } from 'react';
import { CallBackProps, STATUS } from 'react-joyride';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import backpackSvg from '!raw-loader!~img/backpack.svg';
import mapSvg from '!raw-loader!~img/map.svg';
import seesawSvg from '!raw-loader!~img/seesaw.svg';
import Errors from '~js/components/apiErrors';
import OfflineAlert from '~js/components/offlineAlert';
import Toasts from '~js/components/toasts';
import { TourType } from '~js/components/tour/landing';
import PlanTour from '~js/components/tour/plan';
import UserInfo from '~js/components/user/info';
import { selectSocketState } from '~js/store/socket/selectors';
import { selectUserState } from '~js/store/user/selectors';
import routes from '~js/utils/routes';
import i18n from 'i18next';

const Header = () => {
  const user = useSelector(selectUserState);
  const socket = useSelector(selectSocketState);
  const [tourRunning, setTourRunning] = useState<TourType | null>(null);

  const doRunTour = (type: TourType) => setTourRunning(type);
  const handleTourCallback = useCallback((data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      setTourRunning(null);
    }
  }, []);
  const controls = () => (
    <PageHeaderControl className="slds-grid slds-grid_vertical-align-center">
      <div className="slds-col_padded">
        <Dropdown
          // todo translate
          assistiveText={{ icon: `${i18n.t('Get Help')}` }}
          buttonVariant="icon"
          iconName="question"
          iconSize="large"
          iconVariant="more"
          onSelect={({ value }: { value: TourType }) => {
            doRunTour(value);
          }}
          options={[
            {
              label: `${i18n.t('Play Walkthrough')}`,
              value: 'play',
              leftIcon: 'kanban',
            },
            {
              label: `${i18n.t('Help Walkthrough')}`,
              value: 'help',
              leftIcon: {
                category: 'utility',
                name: 'kanban',
              },
            },
            {
              label: `${i18n.t('Plan Walkthrough')}`,
              value: 'plan',
              leftIcon: {
                category: 'utility',
                name: 'side_list',
              },
            },
          ]}
        />
      </div>

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
      <PlanTour
        run={tourRunning === 'plan'}
        handleCallback={handleTourCallback}
      />
    </>
  ) : null;
};

export default Header;
