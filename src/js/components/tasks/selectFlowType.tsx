import Button from '@salesforce/design-system-react/components/button';
import Radio from '@salesforce/design-system-react/components/radio-group/radio';
import Tooltip from '@salesforce/design-system-react/components/tooltip';
import classNames from 'classnames';
import i18n from 'i18next';
import React, { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { SpinnerWrapper, UseFormProps } from '@/components/utils';
import { ThunkDispatch } from '@/store';
import { refreshOrgConfigs } from '@/store/projects/actions';
import { OrgConfig } from '@/store/projects/reducer';
import { DEFAULT_ORG_CONFIG_NAME } from '@/utils/constants';

const SelectFlowType = ({
  orgConfigs,
  projectId,
  value,
  errors,
  isDisabled,
  isLoading,
  handleSelect,
}: {
  orgConfigs: OrgConfig[];
  projectId?: string;
  value: string;
  errors?: string;
  isDisabled?: boolean;
  isLoading?: boolean;
  handleSelect: UseFormProps['handleInputChange'];
}) => {
  const dispatch = useDispatch<ThunkDispatch>();

  const doRefreshOrgConfigs = useCallback(() => {
    /* istanbul ignore else */
    if (projectId) {
      dispatch(refreshOrgConfigs(projectId));
    }
  }, [dispatch, projectId]);

  const flowTypes = orgConfigs.length
    ? orgConfigs
    : [{ key: DEFAULT_ORG_CONFIG_NAME }];
  const hasErrors = Boolean(errors);
  return (
    <fieldset
      className={classNames('slds-form-element', {
        'slds-has-error': hasErrors,
      })}
    >
      {isLoading && <SpinnerWrapper size="small" />}
      <legend className="slds-form-element__legend slds-form-element__label">
        <span className="slds-p-right_xx-small">{i18n.t('Org Type')}</span>
        <Tooltip
          content={i18n.t(
            'CumulusCI projects can set up different kinds of org environments. Which one would you like to work on for this task?',
          )}
          position="overflowBoundaryElement"
          align="top left"
          dialogClassName="modal-tooltip"
        />
        <Button
          assistiveText={{
            icon: i18n.t('refresh list of available org types'),
          }}
          title={i18n.t('refresh list of available org types')}
          variant="icon"
          iconCategory="utility"
          iconName="refresh"
          className="slds-m-left_xx-small"
          onClick={doRefreshOrgConfigs}
        />
      </legend>
      <div className="slds-form-element__control">
        {flowTypes.map(({ key, label, description }) => (
          <Radio
            key={key}
            id={key}
            labels={{
              label: description
                ? `${label || key} - ${description}`
                : label || key,
            }}
            value={key}
            checked={key === value}
            name="org_config_name"
            aria-describedby={
              hasErrors || isDisabled ? 'org_config_name-error' : undefined
            }
            disabled={isDisabled || isLoading}
            onChange={handleSelect}
          />
        ))}
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
              'Org Type cannot be changed while a scratch org exists for this task.',
            )}
          {errors}
        </div>
      )}
    </fieldset>
  );
};

export default SelectFlowType;
