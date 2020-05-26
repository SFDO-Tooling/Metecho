import RadioGroup from '@salesforce/design-system-react/components/radio-group';
import Radio from '@salesforce/design-system-react/components/radio-group/radio';
import i18n from 'i18next';
import React, { useState } from 'react';

import { ORG_TYPES } from '@/utils/constants';

const SelectOrgType = ({ isDisabled }: { isDisabled: boolean }) => {
  const [orgFlowSelected, setOrgFlowSelected] = useState<string>(ORG_TYPES.DEV);
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.value;
    setOrgFlowSelected(selected);
  };
  const orgTypes = [
    {
      type: ORG_TYPES.DEV,
      description: i18n.t('set up for package development'),
    },
    {
      type: ORG_TYPES.QA,
      description: i18n.t('use as a testing environment'),
    },
    {
      type: ORG_TYPES.BETA,
      description: i18n.t('what the cool kids want'),
    },
    {
      type: ORG_TYPES.RELEASE,
      description: i18n.t('ready for production'),
    },
  ];

  return (
    <div className="slds-m-top--medium">
      <RadioGroup
        labels={{ label: i18n.t('Org Type') }}
        onChange={handleChange}
        disabled={isDisabled}
        required
        name="org-type"
      >
        {orgTypes.map(({ type, description }) => (
          <Radio
            key={type}
            id={type}
            labels={{ label: `${type} - ${description}` }}
            value={type}
            checked={Boolean(type === orgFlowSelected)}
            variant="base"
            name="type"
          />
        ))}
      </RadioGroup>
    </div>
  );
};

export default SelectOrgType;
