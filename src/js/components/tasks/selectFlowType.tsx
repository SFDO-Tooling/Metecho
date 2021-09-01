import Button from '@salesforce/design-system-react/components/button';
import Radio from '@salesforce/design-system-react/components/radio-group/radio';
import Tooltip from '@salesforce/design-system-react/components/tooltip';
import classNames from 'classnames';
import i18n from 'i18next';
import React, { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { SpinnerWrapper, UseFormProps } from '@/js/components/utils';
import { ThunkDispatch } from '@/js/store';
import { refreshOrgConfigs } from '@/js/store/projects/actions';
import { OrgConfig } from '@/js/store/projects/reducer';
import { DEFAULT_ORG_CONFIG_NAME } from '@/js/utils/constants';

const SelectFlowType = ({
  orgConfigs,
  orgConfigHelp,
  projectId,
  value,
  errors,
  isDisabled,
  isLoading,
  className,
  handleSelect,
}: {
  orgConfigs: OrgConfig[];
  orgConfigHelp?: string;
  projectId?: string;
  value: string;
  errors?: string;
  isDisabled?: boolean;
  isLoading?: boolean;
  className?: string;
  handleSelect: UseFormProps['handleInputChange'];
}) => {
  const dispatch = useDispatch<ThunkDispatch>();

  const doRefreshOrgConfigs = useCallback(() => {
    /* istanbul ignore else */
    if (projectId) {
      dispatch(refreshOrgConfigs(projectId));
    }
  }, [dispatch, projectId]);

  // If there are no known org configs, check again once...
  useEffect(() => {
    if (!orgConfigs.length) {
      doRefreshOrgConfigs();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const flowTypes = orgConfigs.length
    ? orgConfigs
    : [{ key: DEFAULT_ORG_CONFIG_NAME }];
  const hasErrors = Boolean(errors);

  return (
    <fieldset
      className={classNames(className, 'slds-form-element', {
        'slds-has-error': hasErrors,
      })}
    >
      {isLoading && /* istanbul ignore next */ <SpinnerWrapper size="small" />}
      <legend className="slds-form-element__legend slds-form-element__label">
        <span className="slds-p-right_xx-small">{i18n.t('Org Type')}</span>
        <Tooltip
          content={
            orgConfigHelp ||
            i18n.t(
              'CumulusCI Projects can set up different kinds of Org environments. Which one would you like to work on for this Task?',
            )
          }
          position="overflowBoundaryElement"
          align="top left"
          dialogClassName="modal-tooltip"
        />
        <Button
          assistiveText={{
            icon: i18n.t('refresh list of available Org types'),
          }}
          title={i18n.t('refresh list of available Org types')}
          variant="icon"
          iconCategory="utility"
          iconName="refresh"
          className="slds-m-left_xx-small"
          onClick={doRefreshOrgConfigs}
          disabled={isLoading}
        />
      </legend>
      <div className="slds-form-element__control">
        {flowTypes.map(({ key, label, description }) => {
          let displayLabel = label || key;
          if (description) {
            displayLabel = `${displayLabel} - ${description}`;
          }
          if (key === DEFAULT_ORG_CONFIG_NAME) {
            displayLabel = `${displayLabel} (${i18n.t('recommended')})`;
          }
          return (
            <Radio
              key={key}
              id={key}
              labels={{ label: displayLabel }}
              value={key}
              checked={key === value}
              name="org_config_name"
              aria-describedby={
                hasErrors || isDisabled ? 'org_config_name-error' : undefined
              }
              disabled={isDisabled || isLoading}
              onChange={handleSelect}
            />
          );
        })}
      </div>
      {(hasErrors || isDisabled) && (
        <div
          id="org_config_name-error"
          className={classNames('slds-form-element__help', {
            'slds-text-color_error': isDisabled,
          })}
        >
          {isDisabled &&
            i18n.t(
              'Org Type cannot be changed while an Org exists for this Task.',
            )}
          {errors}
        </div>
      )}
    </fieldset>
  );
};

export default SelectFlowType;
