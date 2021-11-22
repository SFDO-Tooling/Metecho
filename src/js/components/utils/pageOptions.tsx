import Dropdown from '@salesforce/design-system-react/components/menu-dropdown';
import { t } from 'i18next';
import React from 'react';

import { OBJECT_TYPES, ObjectTypes } from '@/js/utils/constants';

const PageOptions = ({
  modelType,
  handleOptionSelect,
}: {
  modelType: ObjectTypes;
  handleOptionSelect: (id: 'edit' | 'delete') => void;
}) => {
  const handleSelect = (option: { id: 'edit' | 'delete'; label: string }) => {
    handleOptionSelect(option.id);
  };

  let assistiveText, editLabel, deleteLabel;

  switch (modelType) {
    case OBJECT_TYPES.TASK:
      assistiveText = t('Task Options');
      editLabel = t('Edit Task');
      deleteLabel = t('Delete Task');
      break;
    case OBJECT_TYPES.EPIC:
      assistiveText = t('Epic Options');
      editLabel = t('Edit Epic');
      deleteLabel = t('Delete Epic');
      break;
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
        {
          id: 'edit',
          label: editLabel,
          leftIcon: {
            name: 'edit',
            category: 'utility',
          },
        },
        {
          id: 'delete',
          label: deleteLabel,
          leftIcon: {
            name: 'delete',
            category: 'utility',
          },
        },
      ]}
    />
  );
};

export default PageOptions;
