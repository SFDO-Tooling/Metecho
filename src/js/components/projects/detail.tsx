import Button from '@salesforce/design-system-react/components/button';
import Tabs from '@salesforce/design-system-react/components/tabs';
import TabsPanel from '@salesforce/design-system-react/components/tabs/panel';
import { t } from 'i18next';
import { pick } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import DocumentTitle from 'react-document-title';
import { Trans } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, RouteComponentProps } from 'react-router-dom';

import CreateEpicModal from '@/js/components/epics/createForm';
import EpicTable from '@/js/components/epics/table';
import SelectIssueModal from '@/js/components/githubIssues/selectIssueModal';
import PlaygroundOrgCard from '@/js/components/orgs/playgroundCard';
import ProjectNotFound from '@/js/components/projects/project404';
import CreateTaskModal from '@/js/components/tasks/createForm';
import TasksTableComponent from '@/js/components/tasks/table';
import HelpTour, { getDemoTask } from '@/js/components/tour/help';
import LandingModal from '@/js/components/tour/landing';
import PlanTour, { getDemoEpic } from '@/js/components/tour/plan';
import PlayTour, { getDemoOrg } from '@/js/components/tour/play';
import TourPopover from '@/js/components/tour/popover';
import {
  ContributeCallback,
  ContributeWorkModal,
  CreateOrgModal,
  DetailPageLayout,
  getProjectLoadingOrNotFound,
  LabelWithSpinner,
  OrgData,
  useAssignUserToTask,
  useFetchEpicsIfMissing,
  useFetchOrgsIfMissing,
  useFetchProjectIfMissing,
  useFetchProjectTasksIfMissing,
  useIsMounted,
} from '@/js/components/utils';
import { ThunkDispatch } from '@/js/store';
import { fetchObjects } from '@/js/store/actions';
import { GitHubIssue } from '@/js/store/githubIssues/reducer';
import { Org } from '@/js/store/orgs/reducer';
import { onboarded } from '@/js/store/user/actions';
import { User } from '@/js/store/user/reducer';
import { selectUserState } from '@/js/store/user/selectors';
import {
  OBJECT_TYPES,
  SHOW_WALKTHROUGH,
  WALKTHROUGH_TYPES,
  WalkthroughType,
} from '@/js/utils/constants';
import routes from '@/js/utils/routes';

const ProjectDetail = (
  props: RouteComponentProps<
    any,
    any,
    { [SHOW_WALKTHROUGH]?: WalkthroughType }
  >,
) => {
  const user = useSelector(selectUserState) as User;
  const [fetchingEpics, setFetchingEpics] = useState(false);
  const [selectIssueModalOpen, setSelectIssueModalOpen] = useState<
    false | 'epic' | 'task'
  >(false);
  const [issue, setIssue] = useState<GitHubIssue | null>(null);
  const [createEpicModalOpen, setCreateEpicModalOpen] = useState(false);
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [convertOrgData, setConvertOrgData] = useState<OrgData | null>(null);
  const [createOrgModalOpen, setCreateOrgModalOpen] = useState(false);
  const [contributeModalOpen, setContributeModalOpen] = useState(false);
  const [tourLandingModalOpen, setTourLandingModalOpen] = useState(
    Boolean(window.GLOBALS.ENABLE_WALKTHROUGHS && !user.onboarded_at),
  );
  const [tasksTabViewed, setTasksTabViewed] = useState(false);
  const [selectedTabOverride, setSelectedTabOverride] = useState<
    number | undefined
  >(undefined);
  const [tourRunning, setTourRunning] = useState<WalkthroughType | null>(null);
  const [playTourOrg, setPlayTourOrg] = useState<Org | null>(null);
  const isMounted = useIsMounted();
  const dispatch = useDispatch<ThunkDispatch>();
  const { project, projectSlug } = useFetchProjectIfMissing(props);
  const { epics } = useFetchEpicsIfMissing({ projectId: project?.id }, props);
  const { orgs } = useFetchOrgsIfMissing({ projectId: project?.id }, props);
  const { tasks } = useFetchProjectTasksIfMissing(
    {
      projectId: project?.id,
      tasksTabViewed,
    },
    props,
  );
  const assignUser = useAssignUserToTask();
  const runningPlayTour = tourRunning === WALKTHROUGH_TYPES.PLAY;
  const runningHelpTour = tourRunning === WALKTHROUGH_TYPES.HELP;
  const runningPlanTour = tourRunning === WALKTHROUGH_TYPES.PLAN;
  const playgroundOrg = runningPlayTour
    ? playTourOrg
    : ((orgs || [])[0] as Org | undefined);

  // Auto-start the tour/walkthrough if `SHOW_WALKTHROUGH` param is truthy
  const {
    history,
    location: { state },
  } = props;
  useEffect(() => {
    const tours = Object.values(WALKTHROUGH_TYPES);
    const showTour = state?.[SHOW_WALKTHROUGH];
    if (orgs && epics?.fetched && showTour && tours.includes(showTour)) {
      // Remove location state
      history.replace({ state: {} });
      /* istanbul ignore else */
      if (!tourLandingModalOpen) {
        // Start tour
        setTourRunning(showTour);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, tourLandingModalOpen, orgs, epics?.fetched]);

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
  const openCreateEpicModal = useCallback(() => {
    setCreateEpicModalOpen(true);
    setCreateOrgModalOpen(false);
    setCreateTaskModalOpen(false);
    setContributeModalOpen(false);
    setSelectIssueModalOpen(false);
    setConvertOrgData(null);
    setIssue(null);
  }, []);
  const closeCreateEpicModal = useCallback(() => {
    setCreateEpicModalOpen(false);
  }, []);

  // "create issue" modal related
  const openSelectIssueModal = useCallback((type: 'epic' | 'task') => {
    setSelectIssueModalOpen(type);
    setCreateEpicModalOpen(false);
    setCreateOrgModalOpen(false);
    setCreateTaskModalOpen(false);
    setContributeModalOpen(false);
    setConvertOrgData(null);
    setIssue(null);
  }, []);
  const closeSelectIssueModal = useCallback(() => {
    setSelectIssueModalOpen(false);
  }, []);
  const setIssueAndCreateEpicOrTask = useCallback(
    (selectedIssue: GitHubIssue | null, type: 'epic' | 'task') => {
      setIssue(selectedIssue);
      if (type === 'epic') {
        setCreateEpicModalOpen(true);
        setCreateTaskModalOpen(false);
      } else {
        setCreateTaskModalOpen(true);
        setCreateEpicModalOpen(false);
      }
      setCreateOrgModalOpen(false);
      setContributeModalOpen(false);
      setConvertOrgData(null);
    },
    [],
  );
  // "create task" modal related
  const openCreateTaskModal = useCallback(() => {
    setCreateTaskModalOpen(true);
    setCreateEpicModalOpen(false);
    setCreateOrgModalOpen(false);
    setContributeModalOpen(false);
    setSelectIssueModalOpen(false);
    setConvertOrgData(null);
    setIssue(null);
  }, []);
  const closeCreateTaskModal = useCallback(() => {
    setCreateTaskModalOpen(false);
  }, []);

  // "create scratch org" modal related
  const openCreateOrgModal = useCallback(() => {
    setCreateOrgModalOpen(true);
    setCreateEpicModalOpen(false);
    setCreateTaskModalOpen(false);
    setContributeModalOpen(false);
    setSelectIssueModalOpen(false);
    setConvertOrgData(null);
    setIssue(null);
  }, []);
  const closeCreateOrgModal = useCallback(() => {
    setCreateOrgModalOpen(false);
  }, []);

  // "contribute work" modal related:
  const openContributeModal = () => {
    setContributeModalOpen(true);
    setCreateEpicModalOpen(false);
    setCreateTaskModalOpen(false);
    setCreateOrgModalOpen(false);
    setSelectIssueModalOpen(false);
    setConvertOrgData(null);
    setIssue(null);
  };
  const closeContributeModal = useCallback(() => {
    setContributeModalOpen(false);
  }, []);
  const createAndContribute: ContributeCallback = useCallback(
    (orgData, { createEpicLessTask }) => {
      setConvertOrgData(orgData);
      if (createEpicLessTask) {
        setCreateTaskModalOpen(true);
        setCreateEpicModalOpen(false);
      } else {
        setCreateEpicModalOpen(true);
        setCreateTaskModalOpen(false);
      }
      setCreateOrgModalOpen(false);
      setSelectIssueModalOpen(false);
      setIssue(null);
    },
    [],
  );

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
    setSelectedTabOverride(undefined);
  }, []);
  const setTasksTabActive = useCallback(() => {
    setSelectedTabOverride(1);
    // Activating the tab programmatically does not fire the
    // `handleTabSelect` callback to fetch Tasks from the API,
    // so do that manually:
    setTasksTabViewed(true);
  }, []);
  const demoOrg = getDemoOrg({
    project: project?.id || null,
    owner: user.id,
    owner_gh_username: user.username,
    owner_gh_id: user.github_id,
    latest_commit: project?.latest_sha || '',
  });
  /* istanbul ignore next */
  const handlePlayTourStep = useCallback(
    (index: number) => {
      switch (index) {
        case 2:
          setPlayTourOrg(demoOrg);
          break;
        case 4:
          setTasksTabActive();
          setPlayTourOrg(null);
          break;
        case 5:
          setSelectedTabOverride(0);
          break;
      }
    },
    [demoOrg, setTasksTabActive],
  );
  /* istanbul ignore next */
  const handlePlanTourStep = useCallback((index: number) => {
    switch (index) {
      case 2:
        setSelectedTabOverride(0);
        break;
    }
  }, []);

  const handleTabSelect = useCallback((idx: number) => {
    /* istanbul ignore else */
    if (idx === 1) {
      setTasksTabViewed(true);
    }
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

  return (
    <DocumentTitle title={`${project.name} | ${t('Metecho')}`}>
      <DetailPageLayout
        type={OBJECT_TYPES.PROJECT}
        title={project.name}
        titlePopover={
          <TourPopover
            id="tour-project-name"
            align="bottom left"
            heading={t('Project name & GitHub link')}
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
              tour-scratch-org"
          >
            <div className="slds-is-relative heading">
              <TourPopover
                id="tour-project-scratch-org"
                align="top"
                heading={t('View & play with a Project')}
                body={
                  <Trans i18nKey="tourProjectScratchOrg">
                    Scratch Orgs are a temporary place for you to view the work
                    on this Project. You can use Scratch Orgs to play with
                    changes to the Project without affecting the Project. Create
                    a Scratch Org for the entire Project or visit an Epic or
                    Task to create a Scratch Org for specific work in-progress.
                  </Trans>
                }
              />
              <h2 className="slds-text-heading_medium slds-p-bottom_medium">
                {t('My Project Scratch Org')}
              </h2>
            </div>
            {orgs || runningPlayTour ? (
              <>
                {playgroundOrg ? (
                  <div
                    className="slds-grid
                      slds-wrap
                      slds-grid_pull-padded-x-small"
                  >
                    <div className="slds-size_1-of-1 slds-p-around_x-small">
                      <PlaygroundOrgCard
                        org={playgroundOrg}
                        project={project}
                        repoUrl={project.repo_url}
                        openContributeModal={openContributeModal}
                      />
                    </div>
                  </div>
                ) : (
                  <Button
                    className="tour-create-scratch-org"
                    label={t('Create Scratch Org')}
                    variant="outline-brand"
                    onClick={openCreateOrgModal}
                  />
                )}
              </>
            ) : (
              // Fetching scratch orgs from API
              <Button
                className="tour-scratch-org"
                label={<LabelWithSpinner label={t('Loading Scratch Orgs…')} />}
                disabled
              />
            )}
          </div>
        }
      >
        <Tabs
          variant="scoped"
          onSelect={handleTabSelect}
          selectedIndex={selectedTabOverride}
        >
          <TabsPanel
            label={
              <div className="tour-project-epics-list">
                <TourPopover
                  id="tour-project-epics-list"
                  align="top left"
                  heading={t('List of Epics')}
                  body={
                    <Trans i18nKey="tourEpicsList">
                      Select the Epics tab to see a list of all Epics for this
                      Project. Each Epic is a group of related Tasks.
                    </Trans>
                  }
                />
                {t('Epics')}
              </div>
            }
          >
            <div className="slds-m-bottom_x-small">
              <span className="slds-is-relative metecho-btn-container">
                <Button
                  label={
                    epics?.fetched || tourRunning
                      ? t('Create an Epic')
                      : t('Loading Epics…')
                  }
                  variant="brand"
                  onClick={openCreateEpicModal}
                  className="slds-m-bottom_x-small tour-create-epic"
                  disabled={
                    !tourRunning &&
                    (!project.has_push_permission || !epics?.fetched)
                  }
                />
                <TourPopover
                  id="tour-project-create-epic"
                  align="top left"
                  body={
                    <Trans i18nKey="tourCreateEpic">
                      Create an Epic to make a group of related Tasks. Invite
                      multiple Collaborators to your Epic and assign people as
                      Developers and Testers for each Task. Epics are equivalent
                      to GitHub branches, just like Tasks.
                    </Trans>
                  }
                  heading={t('Create Epics to group Tasks')}
                />
              </span>
              <span className="slds-is-relative metecho-btn-container">
                <Button
                  label={t('Create Epic from GitHub Issue')}
                  variant="outline-brand"
                  onClick={() => openSelectIssueModal('epic')}
                  className="slds-m-bottom_x-small tour-create-epic-from-issue"
                  disabled={
                    !tourRunning &&
                    (!project.has_push_permission || !epics?.fetched)
                  }
                />
                <TourPopover
                  id="tour-project-create-epic-from-issue"
                  align="top left"
                  body={
                    <Trans i18nKey="tourCreateEpicFromIssue">
                      If you want to help as a Developer on this Project, one
                      option is to browse the list of GitHub Issues. Issues are
                      items in GitHub’s bug and enhancement tracking system.
                      Select an Issue to work on, and create an Epic or Task.
                      Create an Epic for an Issue if it will require multiple
                      Tasks to complete. If you’re unsure, begin with a Task and
                      create an Epic later, as needed.
                    </Trans>
                  }
                  heading={t('Create Epic from GitHub Issue')}
                />
              </span>
            </div>
            <EpicTable
              epics={
                /* istanbul ignore next */ tourRunning && !epics?.epics?.length
                  ? [
                      getDemoEpic({
                        project: project.id,
                        github_id: user.github_id,
                      }),
                    ]
                  : epics?.epics || []
              }
              isFetched={Boolean(epics?.fetched)}
              userHasPermissions={project.has_push_permission}
              projectSlug={project.slug}
            />
            {epics?.epics?.length && epics?.next ? (
              <div className="slds-m-top_large">
                <Button
                  label={fetchingEpics ? <LabelWithSpinner /> : t('Load More')}
                  onClick={fetchMoreEpics}
                />
              </div>
            ) : /* istanbul ignore next */ null}
          </TabsPanel>
          <TabsPanel
            label={
              <div className="tour-project-tasks-list">
                <TourPopover
                  id="tour-project-tasks-list"
                  align="top left"
                  heading={t('List of Tasks')}
                  body={
                    <Trans i18nKey="tourTasksList">
                      Select the Tasks tab to see a list of all the work being
                      done on this Project and who is working on it. Tasks
                      represent small changes to the Project, and may be part of
                      an Epic.
                    </Trans>
                  }
                />
                {t('Tasks')}
              </div>
            }
          >
            <div className="slds-m-bottom_x-small">
              <span className="slds-is-relative metecho-btn-container">
                <Button
                  label={
                    tasks || tourRunning
                      ? t('Create a Task')
                      : t('Loading Tasks…')
                  }
                  variant="brand"
                  className="slds-m-bottom_x-small tour-create-task"
                  onClick={openCreateTaskModal}
                  disabled={
                    !tourRunning && (!project.has_push_permission || !tasks)
                  }
                />
                <TourPopover
                  id="tour-project-add-task"
                  align="top left"
                  heading={t('Create a Task to contribute')}
                  body={
                    <Trans i18nKey="tourProjectCreateTask">
                      To get started contributing to this Project, create a
                      Task. Tasks represent small changes to this Project; each
                      one has a Developer and a Tester. Tasks are equivalent to
                      GitHub branches.
                    </Trans>
                  }
                />
              </span>
              <span className="slds-is-relative metecho-btn-container">
                <Button
                  label={t('Create Task from GitHub Issue')}
                  variant="outline-brand"
                  onClick={() => openSelectIssueModal('task')}
                  className="slds-m-bottom_x-small tour-create-task-from-issue"
                  disabled={
                    !tourRunning && (!project.has_push_permission || !tasks)
                  }
                />
                <TourPopover
                  id="tour-project-create-task-from-issue"
                  align="top left"
                  body={
                    <Trans i18nKey="tourCreateTaskFromIssue">
                      If you want to help as a Developer on this Project, one
                      option is to browse the list of GitHub Issues. Issues are
                      items in GitHub’s bug and enhancement tracking system.
                      Select an Issue to work on, and create an Epic or Task.
                      Create an Epic for an Issue if it will require multiple
                      Tasks to complete. If you’re unsure, begin with a Task and
                      create an Epic later, as needed.
                    </Trans>
                  }
                  heading={t('Create Task from GitHub Issue')}
                />
              </span>
            </div>
            <TasksTableComponent
              projectId={project.id}
              projectSlug={project.slug}
              tasks={
                tourRunning && !tasks?.length
                  ? [
                      getDemoTask({
                        project: project.id,
                        github_id: user.github_id,
                      }),
                    ]
                  : tasks || []
              }
              isFetched={Boolean(tasks)}
              githubUsers={project.github_users}
              canAssign={project.has_push_permission}
              isRefreshingUsers={project.currently_fetching_github_users}
              assignUserAction={assignUser}
              viewEpicsColumn
            />
          </TabsPanel>
        </Tabs>
        <SelectIssueModal
          projectId={project.id}
          projectSlug={project.slug}
          isOpen={selectIssueModalOpen}
          closeIssueModal={closeSelectIssueModal}
          issueSelected={setIssueAndCreateEpicOrTask}
          currentlyResyncing={project.currently_fetching_issues}
        />
        <CreateEpicModal
          user={user}
          project={project}
          isOpen={createEpicModalOpen}
          playgroundOrgData={convertOrgData}
          closeCreateModal={closeCreateEpicModal}
          issue={issue}
        />
        <LandingModal
          isOpen={tourLandingModalOpen}
          runTour={doRunTour}
          onRequestClose={closeTourLandingModal}
        />
        <PlayTour
          run={runningPlayTour}
          onClose={handleTourClose}
          onBeforeStep={handlePlayTourStep}
        />
        <HelpTour
          run={runningHelpTour}
          onStart={setTasksTabActive}
          onClose={handleTourClose}
        />
        <PlanTour
          run={runningPlanTour}
          onStart={setTasksTabActive}
          onClose={handleTourClose}
          onBeforeStep={handlePlanTourStep}
        />
        <CreateOrgModal
          project={project}
          isOpen={createOrgModalOpen}
          closeModal={closeCreateOrgModal}
        />
        <CreateTaskModal
          project={project}
          isOpen={createTaskModalOpen}
          playgroundOrgData={convertOrgData}
          closeCreateModal={closeCreateTaskModal}
          issue={issue}
        />
        {playgroundOrg ? (
          <ContributeWorkModal
            isOpen={contributeModalOpen}
            hasPermissions={project.has_push_permission}
            orgData={pick(playgroundOrg, ['id', 'org_config_name'])}
            closeModal={closeContributeModal}
            doContribute={createAndContribute}
          />
        ) : null}
      </DetailPageLayout>
    </DocumentTitle>
  );
};

export default ProjectDetail;
