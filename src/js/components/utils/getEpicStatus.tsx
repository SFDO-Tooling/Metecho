import ProgressRing from '@salesforce/design-system-react/components/progress-ring';
import { t } from 'i18next';
import React from 'react';

import { EPIC_STATUSES, EpicStatuses } from '@/js/utils/constants';

const getEpicStatus = ({ epicStatus }: { epicStatus: EpicStatuses }) => {
  let displayStatus, icon;
  switch (epicStatus) {
    case EPIC_STATUSES.PLANNED:
      displayStatus = t('Planned');
      icon = <ProgressRing value={0} />;
      break;
    case EPIC_STATUSES.IN_PROGRESS:
      displayStatus = t('In Progress');
      icon = <ProgressRing value={40} flowDirection="fill" theme="active" />;
      break;
    case EPIC_STATUSES.REVIEW:
      displayStatus = t('Review');
      icon = <ProgressRing value={100} />;
      break;
    case EPIC_STATUSES.MERGED:
      displayStatus = t('Merged');
      icon = <ProgressRing value={100} theme="complete" hasIcon />;
      break;
  }

  return {
    status: displayStatus || epicStatus,
    icon,
  };
};

export default getEpicStatus;
