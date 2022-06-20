import React from 'react';
import { useTranslation } from 'react-i18next';

import Path from '@/js/components/path';
import { EPIC_STATUSES, EpicStatuses } from '@/js/utils/constants';

interface Props {
  status: EpicStatuses;
  prIsOpen: boolean;
}

const EpicStatusPath = ({ status, prIsOpen }: Props) => {
  const { t } = useTranslation();

  let activeIdx = 0;
  let isCompleted = false;
  const steps = [t('Planned'), t('In progress'), t('Review'), t('Merged')];
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
