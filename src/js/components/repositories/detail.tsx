import Button from '@salesforce/design-system-react/components/button';
import Icon from '@salesforce/design-system-react/components/icon';
import i18n from 'i18next';
import React, { useState } from 'react';
import DocumentTitle from 'react-document-title';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, RouteComponentProps } from 'react-router-dom';

import ProjectForm from '@/components/projects/createForm';
import ProjectListItem from '@/components/projects/listItem';
import RepositoryNotFound from '@/components/repositories/repository404';
import {
  DetailPageLayout,
  ExternalLink,
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

  const sidebarContent = (
    <ExternalLink url={repository.repo_url}>
      {i18n.t('GitHub Repo')}
      <Icon
        category="utility"
        name="new_window"
        size="xx-small"
        className="slds-m-bottom_xx-small"
        containerClassName="slds-m-left_xx-small slds-current-color"
      />
    </ExternalLink>
  );

  return (
    <DocumentTitle title={`${repository.name} | ${i18n.t('MetaShare')}`}>
      <DetailPageLayout
        title={repository.name}
        description={repository.description_rendered}
        repoUrl={repository.repo_url}
        breadcrumb={[{ name: repository.name }]}
        sidebar={sidebarContent}
      >
        {!projects || !projects.fetched ? (
          // Fetching projects from API
          <SpinnerWrapper />
        ) : (
          <>
            <h2 className="slds-text-heading_medium slds-p-bottom_medium">
              {projects.projects.length ? (
                <>
                  {i18n.t('Projects for')} {repository.name}
                </>
              ) : (
                <>
                  {i18n.t('Create a Project for')} {repository.name}
                </>
              )}
            </h2>
            <ProjectForm
              user={user}
              repository={repository}
              startOpen={!projects.projects.length}
            />
            {Boolean(projects.projects.length) && (
              <>
                <ul className="slds-has-dividers_bottom">
                  {projects.projects.map((project) => (
                    <ProjectListItem
                      key={project.id}
                      project={project}
                      repository={repository}
                    />
                  ))}
                </ul>
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
