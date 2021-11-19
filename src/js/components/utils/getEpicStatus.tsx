import ProgressRing from '@salesforce/design-system-react/components/progress-ring';
import i18n from 'i18next';
import React from 'react';

import { EPIC_STATUSES, EpicStatuses } from '@/js/utils/constants';

const getEpicStatus = ({ epicStatus }: { epicStatus: EpicStatuses }) => {
  let displayStatus, icon;
  switch (epicStatus) {
    case EPIC_STATUSES.PLANNED:
      displayStatus = i18n.t('Planned');
      icon = <ProgressRing value={0} />;
      break;
    case EPIC_STATUSES.IN_PROGRESS:
      displayStatus = i18n.t('In Progress');
      icon = <ProgressRing value={40} flowDirection="fill" theme="active" />;
      break;
    case EPIC_STATUSES.REVIEW:
      displayStatus = i18n.t('Review');
      icon = <ProgressRing value={100} />;
      break;
    case EPIC_STATUSES.MERGED:
      displayStatus = i18n.t('Merged');
      icon = <ProgressRing value={100} theme="complete" hasIcon />;
      break;
  }

  return {
    status: displayStatus || epicStatus,
    icon,
  };
};

export default getEpicStatus;
