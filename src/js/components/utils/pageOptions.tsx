import Dropdown from '@salesforce/design-system-react/components/menu-dropdown';
import i18n from 'i18next';
import React from 'react';

const PageOptions = ({
  model,
  handleOptionSelect,
}: {
  model: 'Project' | 'Task';
  handleOptionSelect: (id: string) => void;
}) => {
  const handleSelect = (option: {
    id: string;
    label: string;
    disabled?: boolean;
  }) => {
    handleOptionSelect(option.id);
  };

  return (
    <Dropdown
      align="right"
      iconCategory="utility"
      iconName="settings"
      iconSize="large"
      iconVariant="more"
      width="xx-small"
      triggerClassName="slds-m-right_xx-small"
      assistiveText={{ icon: i18n.t(`${model} Options`) }}
      onSelect={handleSelect}
      options={[
        { id: 'edit', label: i18n.t(`Edit ${model}`) },
        // { type: 'divider' },
        // { id: 'delete', label: i18n.t('Delete Project') },
      ]}
    />
  );
};

export default PageOptions;
