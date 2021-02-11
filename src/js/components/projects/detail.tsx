import Button from '@salesforce/design-system-react/components/button';
import i18n from 'i18next';
import React, { useState } from 'react';
import DocumentTitle from 'react-document-title';
import { Trans } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, RouteComponentProps } from 'react-router-dom';

import CreateEpicModal from '~js/components/epics/createForm';
import EpicTable from '~js/components/epics/table';
import ProjectNotFound from '~js/components/projects/project404';
import {
  DetailPageLayout,
  getProjectLoadingOrNotFound,
  LabelWithSpinner,
  SpinnerWrapper,
  useFetchEpicsIfMissing,
  useFetchProjectIfMissing,
  useIsMounted,
} from '~js/components/utils';
import { ThunkDispatch } from '~js/store';
import { fetchObjects } from '~js/store/actions';
import { User } from '~js/store/user/reducer';
import { selectUserState } from '~js/store/user/selectors';
import { OBJECT_TYPES } from '~js/utils/constants';
import routes from '~js/utils/routes';

import TourLandingModal from '../tour/landing';

const ProjectDetail = (props: RouteComponentProps) => {
  const user = useSelector(selectUserState) as User;
  const [fetchingEpics, setFetchingEpics] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [tourLandingModalOpen, setTourLandingModalOpen] = useState(
    Boolean(!user.onboarded_at),
  );
  const isMounted = useIsMounted();
  const dispatch = useDispatch<ThunkDispatch>();
  const { project, projectSlug } = useFetchProjectIfMissing(props);
  const { epics } = useFetchEpicsIfMissing(project, props);

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

  const closeTourLandingModal = () => setTourLandingModalOpen(false);

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
              className="slds-m-bottom_large create-epic"
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
        <TourLandingModal
          isOpen={tourLandingModalOpen}
          onRequestClose={closeTourLandingModal}
        />
      </DetailPageLayout>
    </DocumentTitle>
  );
};

export default ProjectDetail;
