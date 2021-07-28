import i18n from 'i18next';
import React from 'react';

import Path from '@/js/components/path';
import { EPIC_STATUSES, EpicStatuses } from '@/js/utils/constants';

interface Props {
  status: EpicStatuses;
  prIsOpen: boolean;
}

const EpicStatusPath = ({ status, prIsOpen }: Props) => {
  let activeIdx = 0;
  let isCompleted = false;
  const steps = [
    i18n.t('Planned'),
    i18n.t('In progress'),
    i18n.t('Review'),
    i18n.t('Merged'),
  ];
  switch (status) {
    case EPIC_STATUSES.IN_PROGRESS:
      activeIdx = 1;
      break;
    case EPIC_STATUSES.REVIEW:
      if (prIsOpen) {
        activeIdx = 3;
      } else {
        activeIdx = 2;
      }
      break;
    case EPIC_STATUSES.MERGED:
      activeIdx = 3;
      isCompleted = true;
      break;
  }
  return (
    <div className="slds-p-bottom_x-large">
      <Path steps={steps} activeIdx={activeIdx} isCompleted={isCompleted} />
    </div>
  );
};

export default EpicStatusPath;
