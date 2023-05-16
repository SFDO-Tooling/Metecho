import { t } from 'i18next';

import { EPIC_STATUSES, EpicStatuses } from '@/js/utils/constants';

const getEpicStatus = ({ epicStatus }: { epicStatus: EpicStatuses }) => {
  let displayStatus;
  switch (epicStatus) {
    case EPIC_STATUSES.PLANNED:
      displayStatus = t('Planned');
      break;
    case EPIC_STATUSES.IN_PROGRESS:
      displayStatus = t('In Progress');
      break;
    case EPIC_STATUSES.REVIEW:
      displayStatus = t('Review');
      break;
    case EPIC_STATUSES.MERGED:
      displayStatus = t('Merged');
      break;
  }

  return {
    status: displayStatus || epicStatus,
  };
};

export default getEpicStatus;
