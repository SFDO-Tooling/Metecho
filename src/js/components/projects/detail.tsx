import Button from '@salesforce/design-system-react/components/button';
import i18n from 'i18next';
import React, { useCallback, useEffect, useState } from 'react';
import DocumentTitle from 'react-document-title';
import { Trans } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, RouteComponentProps } from 'react-router-dom';

import CreateEpicModal from '~js/components/epics/createForm';
import EpicTable from '~js/components/epics/table';
import PlaygroundOrgCard from '~js/components/orgs/playgroundCard';
import ProjectNotFound from '~js/components/projects/project404';
import LandingModal from '~js/components/tour/landing';
import PlanTour from '~js/components/tour/plan';
import PlayTour from '~js/components/tour/play';
import TourPopover from '~js/components/tour/popover';
import {
  CreateOrgModal,
  DetailPageLayout,
  getProjectLoadingOrNotFound,
  LabelWithSpinner,
  SpinnerWrapper,
  useFetchEpicsIfMissing,
  useFetchOrgsIfMissing,
  useFetchProjectIfMissing,
  useIsMounted,
} from '~js/components/utils';
import { ThunkDispatch } from '~js/store';
import { fetchObjects } from '~js/store/actions';
import { onboarded } from '~js/store/user/actions';
import { User } from '~js/store/user/reducer';
import { selectUserState } from '~js/store/user/selectors';
import {
  OBJECT_TYPES,
  SHOW_WALKTHROUGH,
  WALKTHROUGH_TYPES,
  WalkthroughType,
} from '~js/utils/constants';
import routes from '~js/utils/routes';

const ProjectDetail = (
  props: RouteComponentProps<
    any,
    any,
    { [SHOW_WALKTHROUGH]?: WalkthroughType }
  >,
) => {
  const user = useSelector(selectUserState) as User;
  const [fetchingEpics, setFetchingEpics] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createOrgModalOpen, setCreateOrgModalOpen] = useState(false);
  const [tourLandingModalOpen, setTourLandingModalOpen] = useState(
    Boolean(window.GLOBALS.ENABLE_WALKTHROUGHS && !user.onboarded_at),
  );
  const [tourRunning, setTourRunning] = useState<WalkthroughType | null>(null);
  const isMounted = useIsMounted();
  const dispatch = useDispatch<ThunkDispatch>();
  const { project, projectSlug } = useFetchProjectIfMissing(props);
  const { epics } = useFetchEpicsIfMissing(project, props);
  const { orgs } = useFetchOrgsIfMissing({ project, props });

  const playgroundOrg = (orgs || [])[0];

  // Auto-start the tour/walkthrough if `SHOW_WALKTHROUGH` param
  const {
    history,
    location: { state },
  } = props;
  useEffect(() => {
    const tours = Object.values(WALKTHROUGH_TYPES);
    const showTour = state?.[SHOW_WALKTHROUGH];
    if (epics?.fetched && showTour && tours.includes(showTour)) {
      // Remove location state
      history.replace({ state: {} });
      /* istanbul ignore else */
      if (!tourLandingModalOpen) {
        // Start tour
        setTourRunning(showTour);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, tourLandingModalOpen, epics?.fetched]);

  const fetchMoreEpics = useCallback(() => {
    /* istanbul ignore else */
    if (project?.id && epics?.next) {
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
  }, [dispatch, epics?.next, isMounted, project?.id]);

  // "create epic" modal related
  const openCreateModal = useCallback(() => {
    setCreateModalOpen(true);
    setCreateOrgModalOpen(false);
  }, []);
  const closeCreateModal = useCallback(() => {
    setCreateModalOpen(false);
  }, []);

  // "create scratch org" modal related
  const openCreateOrgModal = useCallback(() => {
    setCreateOrgModalOpen(true);
    setCreateModalOpen(false);
  }, []);
  const closeCreateOrgModal = useCallback(() => {
    setCreateOrgModalOpen(false);
  }, []);

  // guided tour related
  const closeTourLandingModal = useCallback(() => {
    setTourLandingModalOpen(false);
    /* istanbul ignore else */
    if (!user.onboarded_at) {
      dispatch(onboarded());
    }
  }, [dispatch, user.onboarded_at]);
  const doRunTour = useCallback(
    (type: WalkthroughType) => {
      setTourRunning(type);
      closeTourLandingModal();
    },
    [closeTourLandingModal],
  );
  const handleTourClose = useCallback(() => {
    setTourRunning(null);
  }, []);

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

  const hasEpics = epics && epics.epics.length > 0;

  return (
    <DocumentTitle title={`${project.name} | ${i18n.t('Metecho')}`}>
      <DetailPageLayout
        title={project.name}
        titlePopover={
          <TourPopover
            align="right"
            heading={i18n.t('Project name & GitHub link')}
            body={
              <Trans i18nKey="tourProjectName">
                View, test, and contribute to Salesforce Projects using Metecho!
                Metecho Projects are equivalent to repositories on GitHub. Click
                the link below the Project name to leave Metecho and access the
                repository on GitHub. To contribute to a Project, you must be
                given permission on GitHub.
              </Trans>
            }
          />
        }
        description={project.description_rendered}
        headerUrl={project.repo_url}
        headerUrlText={`${project.repo_owner}/${project.repo_name}`}
        breadcrumb={[{ name: project.name }]}
        image={project.repo_image_url}
        sidebar={
          <div
            className="slds-m-bottom_x-large
              metecho-secondary-block
              slds-m-left_medium"
          >
            <h2
              className="slds-text-heading_medium
                slds-p-bottom_medium
                slds-is-relative"
            >
              {i18n.t('My Project Scratch Org')}
              <TourPopover
                align="top"
                heading={i18n.t('Scratch Org management')}
                body={
                  <Trans i18nKey="tourProjectScratchOrg">
                    Your Scratch Org for a Project will appear in this column.
                    Create a Scratch Org for the entire Project or visit an Epic
                    or Task to create a Scratch Org for specific work
                    in-progress.
                  </Trans>
                }
              />
            </h2>
            {orgs ? (
              <>
                {playgroundOrg ? (
                  <div
                    className="slds-grid
                      slds-wrap
                      slds-grid_pull-padded-x-small"
                  >
                    <div
                      className="slds-size_1-of-1
                        slds-p-around_x-small
                        tour-scratch-org"
                    >
                      <PlaygroundOrgCard
                        org={playgroundOrg}
                        project={project}
                        repoUrl={project.repo_url}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="slds-is-relative">
                    <Button
                      className="tour-scratch-org"
                      label={i18n.t('Create Scratch Org')}
                      variant="outline-brand"
                      onClick={openCreateOrgModal}
                    />
                    <TourPopover
                      align="bottom"
                      heading={i18n.t('View & play with a Project')}
                      body={
                        <Trans i18nKey="tourProjectCreateScratchOrg">
                          Scratch Orgs are a temporary place for you to view the
                          work on this Project. You can use Scratch Orgs to play
                          with changes to the Project without affecting the
                          Project.
                        </Trans>
                      }
                    />
                  </div>
                )}
              </>
            ) : (
              // Fetching scratch orgs from API
              <Button
                label={
                  <LabelWithSpinner label={i18n.t('Loading Scratch Orgs…')} />
                }
                disabled
              />
            )}
          </div>
        }
      >
        {!epics || !epics.fetched ? (
          // Fetching epics from API
          <SpinnerWrapper />
        ) : (
          <>
            <h2 className="slds-text-heading_medium slds-p-bottom_medium">
              {hasEpics || !project.has_push_permission
                ? i18n.t('Epics for {{project_name}}', {
                    project_name: project.name,
                  })
                : i18n.t('Create an Epic for {{project_name}}', {
                    project_name: project.name,
                  })}
            </h2>
            {!hasEpics && (
              <p className="slds-m-bottom_large">
                {project.has_push_permission ? (
                  <Trans i18nKey="createEpicHelpText">
                    Epics in Metecho are the high-level features that can be
                    broken down into smaller parts by creating Tasks. You can
                    create a new epic or create an epic based on an existing
                    GitHub branch. Every epic requires a unique epic name, which
                    becomes the branch name in GitHub unless you choose to use
                    an existing branch.
                  </Trans>
                ) : (
                  <Trans i18nKey="noEpics">
                    Epics in Metecho are the high-level features that can be
                    broken down into smaller parts by creating Tasks. There are
                    no Epics for this Project.
                  </Trans>
                )}
              </p>
            )}
            {project.has_push_permission && (
              <div className="slds-m-bottom_large slds-is-relative">
                <Button
                  label={i18n.t('Create an Epic')}
                  variant="brand"
                  onClick={openCreateModal}
                  className="tour-create-epic"
                />
                <TourPopover
                  align="right"
                  body={
                    <Trans i18nKey="tourCreateEpicPopover">
                      Create an Epic to make a group of related Tasks. Invite
                      multiple Collaborators to your Epic and assign people as
                      Developers & Testers for each Task. Epics are equivalent
                      to GitHub branches, just like Tasks.
                    </Trans>
                  }
                  heading={i18n.t('Create Epics to group Tasks')}
                />
              </div>
            )}
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
        <LandingModal
          isOpen={tourLandingModalOpen}
          runTour={doRunTour}
          onRequestClose={closeTourLandingModal}
        />
        <PlayTour
          run={tourRunning === WALKTHROUGH_TYPES.PLAY}
          onClose={handleTourClose}
        />
        <PlanTour
          run={tourRunning === WALKTHROUGH_TYPES.PLAN}
          onClose={handleTourClose}
        />
        <CreateOrgModal
          project={project}
          isOpen={createOrgModalOpen}
          closeModal={closeCreateOrgModal}
        />
      </DetailPageLayout>
    </DocumentTitle>
  );
};

export default ProjectDetail;
