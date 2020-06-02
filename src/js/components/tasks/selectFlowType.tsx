import Radio from '@salesforce/design-system-react/components/radio-group/radio';
import Tooltip from '@salesforce/design-system-react/components/tooltip';
import classNames from 'classnames';
import i18n from 'i18next';
import React from 'react';

import { SpinnerWrapper, UseFormProps } from '@/components/utils';
import { OrgConfig } from '@/store/projects/reducer';
import { DEFAULT_ORG_CONFIG_NAME } from '@/utils/constants';

const SelectFlowType = ({
  orgConfigs,
  value,
  errors,
  isDisabled,
  isLoading,
  handleSelect,
}: {
  orgConfigs: OrgConfig[];
  value: string;
  errors?: string;
  isDisabled?: boolean;
  isLoading?: boolean;
  handleSelect: UseFormProps['handleInputChange'];
}) => {
  const flowTypes = orgConfigs.length
    ? orgConfigs
    : [{ key: DEFAULT_ORG_CONFIG_NAME }];
  const helpText = isDisabled
    ? i18n.t(
        'Org Type cannot be changed while a scratch org exists for this task.',
      )
    : i18n.t(
        'CumulusCI projects can set up different kinds of org environments. Which one would you like to work on for this task?',
      );
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
          content={helpText}
          position="overflowBoundaryElement"
          align="top left"
          dialogClassName="modal-tooltip"
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
            checked={Boolean(key === value)}
            name="org_config_name"
            aria-describedby={hasErrors ? 'org_config_name-error' : undefined}
            disabled={isDisabled || isLoading}
            onChange={handleSelect}
          />
        ))}
      </div>
      {hasErrors && (
        <div id="org_config_name-error" className="slds-form-element__help">
          {errors}
        </div>
      )}
    </fieldset>
  );
};

export default SelectFlowType;
