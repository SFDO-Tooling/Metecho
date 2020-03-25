import Dropdown from '@salesforce/design-system-react/components/menu-dropdown';
import i18n from 'i18next';
import React from 'react';

import { OBJECT_TYPES } from '@/utils/constants';

const PageOptions = ({
  modelType,
  handleOptionSelect,
}: {
  modelType: 'project' | 'task';
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

  switch (modelType) {
    case OBJECT_TYPES.TASK:
      assistiveText = i18n.t('Task Options');
      editLabel = i18n.t('Edit Task');
      deleteLabel = i18n.t('Delete Task');
      break;
    case OBJECT_TYPES.PROJECT:
      assistiveText = i18n.t('Project Options');
      editLabel = i18n.t('Edit Project');
      deleteLabel = i18n.t('Delete Project');
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
        {
          id: 'delete',
          label: deleteLabel,
          disabled: modelType === OBJECT_TYPES.TASK,
        },
      ]}
    />
  );
};

export default PageOptions;
