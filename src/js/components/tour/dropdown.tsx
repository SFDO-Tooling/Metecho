import Button from '@salesforce/design-system-react/components/button';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import Popover from '@salesforce/design-system-react/components/popover';
import classNames from 'classnames';
import React, { ChangeEvent, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useRouteMatch } from 'react-router-dom';

import backpackIcon from '@/img/backpack-sm.svg';
import mapIcon from '@/img/map-sm.svg';
import seesawIcon from '@/img/seesaw-sm.svg';
import { ExternalLink, useIsMounted } from '@/js/components/utils';
import { AppState, RouteProps, ThunkDispatch } from '@/js/store';
import { selectProject } from '@/js/store/projects/selectors';
import { updateTour } from '@/js/store/user/actions';
import { selectUserState } from '@/js/store/user/selectors';
import {
  SHOW_WALKTHROUGH,
  WALKTHROUGH_TYPES,
  WalkthroughType,
} from '@/js/utils/constants';
import routes, { routePatterns } from '@/js/utils/routes';

const TourDropdown = ({
  className,
  triggerClassName,
}: {
  className?: string;
  triggerClassName?: string;
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<ThunkDispatch>();
  const history = useHistory();
  const match = useRouteMatch(routePatterns.project_detail) || {
    params: {},
  };
  const selectProjectWithProps = useCallback(selectProject, []);
  const project = useSelector((state: AppState) =>
    selectProjectWithProps(state, { match } as RouteProps),
  );
  const projectUrl = project ? routes.project_detail(project.slug) : null;
  const user = useSelector(selectUserState);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const isMounted = useIsMounted();

  const handleOpenClose = useCallback(() => setIsOpen(!isOpen), [isOpen]);
  const handleClose = useCallback(() => setIsOpen(false), []);

  const handleSelect = useCallback(
    (type: WalkthroughType) => {
      /* istanbul ignore else */
      if (projectUrl) {
        history.push(projectUrl, { [SHOW_WALKTHROUGH]: type });
      }
      handleClose();
    },
    [projectUrl, handleClose], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleToggle = useCallback(
    (
      event: ChangeEvent<HTMLInputElement>,
      { checked }: { checked: boolean },
    ) => {
      setIsSaving(true);
      dispatch(updateTour({ enabled: checked })).finally(() => {
        /* istanbul ignore else */
        if (isMounted.current) {
          setIsSaving(false);
        }
      });
    },
    [dispatch, isMounted],
  );

  return (
    <Popover
      align="bottom right"
      className={classNames(className, 'slds-popover_small')}
      hasNoCloseButton
      heading={t('How to Use Metecho')}
      classNameBody="slds-p-horizontal_none"
      isOpen={isOpen}
      onClick={handleOpenClose}
      onRequestClose={handleClose}
      body={
        <>
          {project && (
            <ul
              className="slds-border_bottom
                slds-p-bottom_x-small
                slds-m-bottom_x-small"
            >
              <li className="slds-p-horizontal_small">
                <Button
                  label={t('Play Walkthrough')}
                  variant="base"
                  iconPosition="left"
                  iconSize="large"
                  iconPath={`${seesawIcon}#seesaw-sm`}
                  style={{ width: '100%' }}
                  onClick={
                    /* istanbul ignore next */ () =>
                      handleSelect(WALKTHROUGH_TYPES.PLAY)
                  }
                />
              </li>
              {
                <li className="slds-p-horizontal_small">
                  <Button
                    label={t('Help Walkthrough')}
                    variant="base"
                    iconPosition="left"
                    iconSize="large"
                    iconPath={`${backpackIcon}#backpack-sm`}
                    style={{ width: '100%' }}
                    onClick={
                      /* istanbul ignore next */ () =>
                        handleSelect(WALKTHROUGH_TYPES.HELP)
                    }
                  />
                </li>
              }
              <li className="slds-p-horizontal_small">
                <Button
                  label={t('Plan Walkthrough')}
                  variant="base"
                  iconPosition="left"
                  iconSize="large"
                  iconPath={`${mapIcon}#map-sm`}
                  style={{ width: '100%' }}
                  onClick={() => handleSelect(WALKTHROUGH_TYPES.PLAN)}
                />
              </li>
            </ul>
          )}
          <Checkbox
            labels={{ label: 'Self-guided Tour' }}
            className="slds-border_bottom
              slds-p-bottom_x-small
              slds-p-horizontal_small"
            checked={user?.self_guided_tour_enabled}
            disabled={isSaving}
            onChange={handleToggle}
          />
          <div className="slds-p-horizontal_small slds-p-top_x-small">
            <ExternalLink
              url="https://github.com/SFDO-Tooling/Metecho/blob/main/docs/metecho-how-to.md"
              showButtonIcon
            >
              {t('Contributor Guide')}
            </ExternalLink>
          </div>
        </>
      }
    >
      <Button
        variant="icon"
        assistiveText={{ icon: t('Get Help') }}
        className={triggerClassName}
        iconCategory="utility"
        iconName="question"
        iconVariant="more"
      />
    </Popover>
  );
};

export default TourDropdown;
