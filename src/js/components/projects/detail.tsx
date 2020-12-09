import Button from '@salesforce/design-system-react/components/button';
import i18n from 'i18next';
import React, { useState } from 'react';
import DocumentTitle from 'react-document-title';
import { Trans } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, RouteComponentProps } from 'react-router-dom';

import CreateEpicModal from '@/components/epics/createForm';
import EpicTable from '@/components/epics/table';
import ProjectNotFound from '@/components/projects/project404';
import {
  DetailPageLayout,
  getProjectLoadingOrNotFound,
  LabelWithSpinner,
  SpinnerWrapper,
  useFetchEpicsIfMissing,
  useFetchProjectIfMissing,
  useIsMounted,
} from '@/components/utils';
import { ThunkDispatch } from '@/store';
import { fetchObjects } from '@/store/actions';
import { User } from '@/store/user/reducer';
import { selectUserState } from '@/store/user/selectors';
import { OBJECT_TYPES } from '@/utils/constants';
import routes from '@/utils/routes';

const ProjectDetail = (props: RouteComponentProps) => {
  const [fetchingEpics, setFetchingEpics] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const isMounted = useIsMounted();
  const dispatch = useDispatch<ThunkDispatch>();
  const { project, projectSlug } = useFetchProjectIfMissing(props);
  const { epics } = useFetchEpicsIfMissing(project, props);
  const user = useSelector(selectUserState) as User;

  const loadingOrNotFound = getProjectLoadingOrNotFound({
    project,
    projectSlug,
  });

  if (loadingOrNotFound !== false) {
    return loadingOrNotFound;
  }

  // This redundant check is used to satisfy TypeScript...
  /* istanbul ignore if */
  if (!project) {
    return <ProjectNotFound />;
  }

  if (projectSlug && projectSlug !== project.slug) {
    // Redirect to most recent project slug
    return <Redirect to={routes.project_detail(project.slug)} />;
  }

  const fetchMoreEpics = () => {
    /* istanbul ignore else */
    if (epics?.next) {
      /* istanbul ignore else */
      if (isMounted.current) {
        setFetchingEpics(true);
      }

      dispatch(
        fetchObjects({
          objectType: OBJECT_TYPES.EPIC,
          filters: { project: project.id },
          url: epics.next,
        }),
      ).finally(() => {
        /* istanbul ignore else */
        if (isMounted.current) {
          setFetchingEpics(false);
        }
      });
    }
  };
  // create modal related
  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => setCreateModalOpen(false);

  const hasEpics = epics && epics.epics.length > 0;

  return (
    <DocumentTitle title={`${project.name} | ${i18n.t('Metecho')}`}>
      <DetailPageLayout
        title={project.name}
        description={project.description_rendered}
        headerUrl={project.repo_url}
        headerUrlText={`${project.repo_owner}/${project.repo_name}`}
        breadcrumb={[{ name: project.name }]}
        image={project.repo_image_url}
      >
        {!epics || !epics.fetched ? (
          // Fetching epics from API
          <SpinnerWrapper />
        ) : (
          <>
            <h2 className="slds-text-heading_medium slds-p-bottom_medium">
              {hasEpics
                ? `${i18n.t('Epics for')} ${project.name}`
                : `${i18n.t('Create an Epic for')} ${project.name}`}
            </h2>
            {!hasEpics && (
              <p className="slds-m-bottom_large">
                <Trans i18nKey="createEpicHelpText">
                  Epics in Metecho are the high-level features that can be
                  broken down into smaller parts by creating Tasks. You can
                  create a new epic or create an epic based on an existing
                  GitHub branch. Every epic requires a unique epic name, which
                  becomes the branch name in GitHub unless you choose to use an
                  existing branch.
                </Trans>
              </p>
            )}
            <Button
              label={i18n.t('Create an Epic')}
              variant="brand"
              onClick={openCreateModal}
              className="slds-m-bottom_large"
            />
            {hasEpics && (
              <>
                <EpicTable epics={epics.epics} projectSlug={project.slug} />
                {epics.next ? (
                  <div className="slds-m-top_large">
                    <Button
                      label={
                        fetchingEpics ? (
                          <LabelWithSpinner />
                        ) : (
                          i18n.t('Load More')
                        )
                      }
                      onClick={fetchMoreEpics}
                    />
                  </div>
                ) : null}
              </>
            )}
          </>
        )}
        <CreateEpicModal
          user={user}
          project={project}
          isOpen={createModalOpen}
          closeCreateModal={closeCreateModal}
        />
      </DetailPageLayout>
    </DocumentTitle>
  );
};

export default ProjectDetail;
