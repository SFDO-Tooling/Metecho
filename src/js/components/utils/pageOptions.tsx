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

  let assistiveText, editLabel, deleteLabel;
  switch (model) {
    case 'Task':
      assistiveText = i18n.t('Task Options');
      editLabel = i18n.t(`Edit Task`);
      deleteLabel = i18n.t(`Delete Task`);
      break;
    case 'Project':
      assistiveText = i18n.t('Project Options');
      editLabel = i18n.t('Edit Project');
      deleteLabel = i18n.t(`Delete Task`);
  }
  return (
    <Dropdown
      align="right"
      iconCategory="utility"
      iconName="settings"
      iconSize="large"
      iconVariant="more"
      width="xx-small"
      triggerClassName="slds-m-right_xx-small"
      assistiveText={{ icon: assistiveText }}
      onSelect={handleSelect}
      options={[
        { id: 'edit', label: editLabel },
        { id: 'delete', label: deleteLabel, disabled: model === 'Task' },
      ]}
    />
  );
};

export default PageOptions;
