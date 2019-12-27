import React, { ReactElement } from 'react';

import RepositoryNotFound from '@/components/repositories/repository404';
import { Repository } from '@/store/repositories/reducer';

import SpinnerWrapper from './spinnerWrapper';

export default ({
  repository,
  repositorySlug,
}: {
  repository?: Repository | null;
  repositorySlug?: string;
}): ReactElement | false => {
  if (!repository) {
    if (!repositorySlug || repository === null) {
      return <RepositoryNotFound />;
    }
    // Fetching repository from API
    return <SpinnerWrapper />;
  }
  return false;
};
