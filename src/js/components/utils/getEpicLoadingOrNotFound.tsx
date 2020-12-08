import React, { ReactElement } from 'react';

import EpicNotFound from '@/components/epics/epic404';
import RepositoryNotFound from '@/components/repositories/repository404';
import { SpinnerWrapper } from '@/components/utils';
import { Epic } from '@/store/epics/reducer';
import { Repository } from '@/store/repositories/reducer';

export default ({
  repository,
  epic,
  epicSlug,
}: {
  repository?: Repository | null;
  epic?: Epic | null;
  epicSlug?: string;
}): ReactElement | false => {
  if (!epic) {
    /* istanbul ignore if */
    if (!repository) {
      return <RepositoryNotFound />;
    }
    if (!epicSlug || epic === null) {
      return <EpicNotFound repository={repository} />;
    }
    // Fetching epic from API
    return <SpinnerWrapper />;
  }
  return false;
};
