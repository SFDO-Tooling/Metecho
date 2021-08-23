import Button from '@salesforce/design-system-react/components/button';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import Popover from '@salesforce/design-system-react/components/popover';
import classNames from 'classnames';
import i18n from 'i18next';
import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { match as Match, useHistory, useRouteMatch } from 'react-router-dom';

// import backpackIcon from '@/img/backpack-sm.svg';
import mapIcon from '@/img/map-sm.svg';
import seesawIcon from '@/img/seesaw-sm.svg';
import { useIsMounted } from '@/js/components/utils';
import { AppState, ThunkDispatch } from '@/js/store';
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
  const dispatch = useDispatch<ThunkDispatch>();
  const history = useHistory();
  const match =
    useRouteMatch<{
      projectSlug?: string;
    }>(routePatterns.project_detail) ||
    ({ params: {} } as Match<{ projectSlug?: string }>);
  const selectProjectWithProps = useCallback(selectProject, []);
  const project = useSelector((state: AppState) =>
    selectProjectWithProps(state, { match }),
  );
  const projectUrl = project ? routes.project_detail(project.slug) : null;
  const user = useSelector(selectUserState);
  const [isSaving, setIsSaving] = useState(false);
  const isMounted = useIsMounted();

  const handleSelect = useCallback(
    (type: WalkthroughType) => {
      /* istanbul ignore else */
      if (projectUrl) {
        history.push(projectUrl, { [SHOW_WALKTHROUGH]: type });
      }
    },
    [projectUrl], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleToggle = useCallback(
    (
      event: React.ChangeEvent<HTMLInputElement>,
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
      heading={i18n.t('How to Use Metecho')}
      classNameBody="slds-p-horizontal_none"
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
                  label={i18n.t('Play Walkthrough')}
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
              {/* <li className="slds-p-horizontal_small">
                <Button
                  label={i18n.t('Help Walkthrough')}
                  variant="base"
                  iconPosition="left"
                  iconSize="large"
                  iconPath={`${backpackIcon}#backpack-sm`}
                  style={{ width: '100%' }}
                  onClick={() => handleSelect(WALKTHROUGH_TYPES.HELP)}
                />
              </li> */}
              <li className="slds-p-horizontal_small">
                <Button
                  label={i18n.t('Plan Walkthrough')}
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
            className="slds-p-horizontal_small"
            checked={user?.self_guided_tour_enabled}
            disabled={isSaving}
            onChange={handleToggle}
          />
        </>
      }
    >
      <Button
        variant="icon"
        assistiveText={{ icon: i18n.t('Get Help') }}
        className={triggerClassName}
        iconCategory="utility"
        iconName="question"
        iconSize="large"
        iconVariant="more"
      />
    </Popover>
  );
};

export default TourDropdown;
