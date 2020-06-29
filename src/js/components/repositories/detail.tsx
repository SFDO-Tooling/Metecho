import Button from '@salesforce/design-system-react/components/button';
import i18n from 'i18next';
import React, { useState } from 'react';
import DocumentTitle from 'react-document-title';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, RouteComponentProps } from 'react-router-dom';

import ProjectForm from '@/components/projects/createForm';
import ProjectTable from '@/components/projects/table';
import RepositoryNotFound from '@/components/repositories/repository404';
import {
  DetailPageLayout,
  getRepositoryLoadingOrNotFound,
  LabelWithSpinner,
  SpinnerWrapper,
  useFetchProjectsIfMissing,
  useFetchRepositoryIfMissing,
  useIsMounted,
} from '@/components/utils';
import { ThunkDispatch } from '@/store';
import { fetchObjects } from '@/store/actions';
import { User } from '@/store/user/reducer';
import { selectUserState } from '@/store/user/selectors';
import { OBJECT_TYPES } from '@/utils/constants';
import routes from '@/utils/routes';

const RepositoryDetail = (props: RouteComponentProps) => {
  const [fetchingProjects, setFetchingProjects] = useState(false);
  const isMounted = useIsMounted();
  const dispatch = useDispatch<ThunkDispatch>();
  const { repository, repositorySlug } = useFetchRepositoryIfMissing(props);
  const { projects } = useFetchProjectsIfMissing(repository, props);
  const user = useSelector(selectUserState) as User;

  const loadingOrNotFound = getRepositoryLoadingOrNotFound({
    repository,
    repositorySlug,
  });

  if (loadingOrNotFound !== false) {
    return loadingOrNotFound;
  }

  // This redundant check is used to satisfy TypeScript...
  /* istanbul ignore if */
  if (!repository) {
    return <RepositoryNotFound />;
  }

  if (repositorySlug && repositorySlug !== repository.slug) {
    // Redirect to most recent repository slug
    return <Redirect to={routes.repository_detail(repository.slug)} />;
  }

  const fetchMoreProjects = () => {
    /* istanbul ignore else */
    if (projects?.next) {
      /* istanbul ignore else */
      if (isMounted.current) {
        setFetchingProjects(true);
      }

      dispatch(
        fetchObjects({
          objectType: OBJECT_TYPES.PROJECT,
          filters: { repository: repository.id },
          url: projects.next,
        }),
      ).finally(() => {
        /* istanbul ignore else */
        if (isMounted.current) {
          setFetchingProjects(false);
        }
      });
    }
  };

  return (
    <DocumentTitle title={`${repository.name} | ${i18n.t('Metecho')}`}>
      <DetailPageLayout
        title={repository.name}
        description={repository.description_rendered}
        headerUrl={repository.repo_url}
        headerUrlText={`${repository.repo_owner}/${repository.repo_name}`}
        breadcrumb={[{ name: repository.name }]}
        image={repository.repo_image_url}
      >
        {!projects || !projects.fetched ? (
          // Fetching projects from API
          <SpinnerWrapper />
        ) : (
          <>
            <h2 className="slds-text-heading_medium slds-p-bottom_medium">
              {projects.projects.length
                ? `${i18n.t('Projects for')} ${repository.name}`
                : `${i18n.t('Create a Project for')} ${repository.name}`}
            </h2>
            <ProjectForm
              user={user}
              repository={repository}
              hasProjects={projects.projects.length > 0}
            />
            {Boolean(projects.projects.length) && (
              <>
                <ProjectTable
                  projects={projects.projects}
                  repositorySlug={repository.slug}
                />
                {projects.next ? (
                  <div className="slds-m-top_large">
                    <Button
                      label={
                        fetchingProjects ? (
                          <LabelWithSpinner />
                        ) : (
                          i18n.t('Load More')
                        )
                      }
                      onClick={fetchMoreProjects}
                    />
                  </div>
                ) : null}
              </>
            )}
          </>
        )}
      </DetailPageLayout>
    </DocumentTitle>
  );
};

export default RepositoryDetail;
