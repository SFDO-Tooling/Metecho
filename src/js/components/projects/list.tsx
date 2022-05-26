import useScrollPosition from '@react-hook/window-scroll';
import Button from '@salesforce/design-system-react/components/button';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import PageHeaderControl from '@salesforce/design-system-react/components/page-header/control';
import { sortBy } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import DocumentTitle from 'react-document-title';
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { RouteComponentProps } from 'react-router-dom';

import { EmptyIllustration } from '@/js/components/404';
import CreateProjectModal from '@/js/components/projects/createProjectModal';
import ProjectListItem from '@/js/components/projects/listItem';
import TourPopover from '@/js/components/tour/popover';
import {
  LabelWithSpinner,
  SpinnerWrapper,
  useIsMounted,
} from '@/js/components/utils';
import { ThunkDispatch } from '@/js/store';
import { fetchObjects } from '@/js/store/actions';
import {
  addProjectCreateError,
  refreshProjects,
} from '@/js/store/projects/actions';
import {
  selectNextUrl,
  selectProjects,
  selectProjectsRefreshing,
} from '@/js/store/projects/selectors';
import { User } from '@/js/store/user/reducer';
import { selectUserState } from '@/js/store/user/selectors';
import { OBJECT_TYPES, SHOW_PROJECT_CREATE_ERROR } from '@/js/utils/constants';

const ProjectList = (
  props: RouteComponentProps<
    any,
    any,
    { [SHOW_PROJECT_CREATE_ERROR]?: { name: string; message?: string } }
  >,
) => {
  const { t } = useTranslation();
  const scrollY = useScrollPosition();
  const user = useSelector(selectUserState) as User;
  const [fetchingProjects, setFetchingProjects] = useState(false);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const isMounted = useIsMounted();
  const dispatch = useDispatch<ThunkDispatch>();
  const projects = useSelector(selectProjects);
  const refreshing = useSelector(selectProjectsRefreshing);
  const next = useSelector(selectNextUrl);
  const {
    history,
    location: { state },
  } = props;

  const openCreateProjectModal = () => {
    setCreateProjectModalOpen(true);
  };
  const closeCreateProjectModal = () => {
    setCreateProjectModalOpen(false);
  };

  const doRefreshProjects = useCallback(() => {
    dispatch(refreshProjects());
  }, [dispatch]);

  // Show error message if redirected after project creation failed
  const { name, message } = state?.[SHOW_PROJECT_CREATE_ERROR] || {};
  useEffect(() => {
    if (name) {
      // Remove location state
      history.replace({ state: {} });
      dispatch(addProjectCreateError({ name, message }));
    }
  }, [dispatch, history, message, name, t]);

  useEffect(() => {
    if (fetchingProjects || !next) {
      return;
    }

    const maybeFetchMoreProjects = () => {
      /* istanbul ignore else */
      if (next && !fetchingProjects) {
        /* istanbul ignore else */
        if (isMounted.current) {
          setFetchingProjects(true);
        }
        dispatch(
          fetchObjects({
            objectType: OBJECT_TYPES.PROJECT,
            url: next,
          }),
        ).finally(
          /* istanbul ignore next */ () => {
            if (isMounted.current) {
              setFetchingProjects(false);
            }
          },
        );
      }
    };

    /* istanbul ignore next */
    const scrollHeight =
      document.documentElement?.scrollHeight ||
      document.body?.scrollHeight ||
      Infinity;
    const clientHeight =
      document.documentElement?.clientHeight || window.innerHeight;
    // Fetch more projects if within 100px of bottom of page...
    const scrolledToBottom =
      scrollHeight - Math.ceil(scrollY + clientHeight) <= 100;

    /* istanbul ignore else */
    if (scrolledToBottom) {
      maybeFetchMoreProjects();
    }
  }, [scrollY, next, fetchingProjects, isMounted, dispatch]);

  let contents;
  switch (projects.length) {
    case 0: {
      // No projects; show empty message
      const msg = (
        <Trans i18nKey="noProjectsHelper">
          We couldn’t find any Projects you have access to on GitHub. Confirm
          that you are logged into the correct account or contact an admin on
          GitHub.
        </Trans>
      );
      contents = <EmptyIllustration message={msg} />;
      break;
    }
    default: {
      contents = (
        <div
          className="slds-grid
            slds-wrap
            slds-grid_pull-padded-small
            slds-is-relative
            project-list"
        >
          <TourPopover
            id="tour-projects-list"
            align="top left"
            heading={t('Metecho Project')}
            body={
              <Trans i18nKey="tourMetechoProject">
                This is a Metecho <b>Project</b>. Projects are equivalent to
                Repositories in GitHub. Select a Project to view the work being
                done. If you would like to contribute, please make sure you have
                “push” permissions in GitHub.
              </Trans>
            }
          />
          {sortBy(projects, [(item) => item.name.toLowerCase()]).map(
            (project) => (
              <ProjectListItem project={project} key={project.id} />
            ),
          )}
        </div>
      );
      break;
    }
  }

  const onRenderHeaderActions = () => (
    <PageHeaderControl>
      <Button
        label={t('Create Project')}
        variant="outline-brand"
        onClick={openCreateProjectModal}
        className="slds-align-middle"
      />
      <div className="slds-is-relative inline-container slds-m-left_x-small">
        {refreshing ? (
          <Button
            label={<LabelWithSpinner label={t('Syncing Projects…')} />}
            variant="outline-brand"
            className="slds-align-middle"
            disabled
          />
        ) : (
          <>
            <Button
              label={t('Re-Sync Projects')}
              variant="outline-brand"
              iconCategory="utility"
              iconName="refresh"
              iconPosition="left"
              onClick={doRefreshProjects}
              className="slds-align-middle"
            />
            <TourPopover
              id="tour-projects-resync-list"
              align="bottom right"
              heading={t('View an updated Project list')}
              body={
                <Trans i18nKey="tourUpdateProject">
                  If you have recently been added to a Project on GitHub, you
                  may not yet see your new Project in this list. First, make
                  sure you are logged in with the correct GitHub account. Next,
                  use the re-sync button to get an updated list of Projects.
                </Trans>
              }
            />
          </>
        )}
      </div>
    </PageHeaderControl>
  );

  return (
    <DocumentTitle title={`${t('Projects')} | ${t('Metecho')}`}>
      <>
        <div className="slds-is-relative page-title">
          <TourPopover
            id="tour-projects-select-project"
            align="bottom left"
            heading={t('Begin exploring Projects')}
            body={
              <Trans i18nKey="tourSelectProject">
                Select a Metecho Project from the list to begin viewing or
                contributing to the Project. Projects are equivalent to
                Repositories in GitHub. They have Orgs, Tasks, and Epics. To
                learn more, continue the self-guided tour on a Project page.
              </Trans>
            }
          />
          <PageHeader
            className="page-header
              slds-is-relative
              slds-p-around_x-large"
            title={t('Select a Project')}
            onRenderControls={onRenderHeaderActions}
          />
        </div>

        <div className="slds-p-around_x-large">
          <div className="slds-grid slds-wrap slds-grid_pull-padded-small">
            <div
              className="slds-p-horizontal_small
                slds-m-bottom_medium
                slds-size_1-of-1
                slds-medium-size_1-of-2
                slds-large-size_1-of-3"
            >
              <h2 className="slds-text-heading_small slds-p-bottom_small">
                {t('Can’t Find Your Project?')}
              </h2>
              <ul className="slds-list_dotted">
                <Trans i18nKey="projectListHelper">
                  <li>Confirm that you are logged into the correct account.</li>
                  <li>Re-sync Projects using the button in the upper right.</li>
                  <li>Contact the Project maintainer on GitHub.</li>
                </Trans>
              </ul>
            </div>
            <div
              className="slds-p-horizontal_small
                slds-m-bottom_medium
                slds-size_1-of-1
                slds-medium-size_1-of-2
                slds-large-size_1-of-3"
            >
              <h2 className="slds-text-heading_small slds-p-bottom_small">
                {t('Creating a New Project?')}
              </h2>
              <ul className="slds-list_dotted">
                <Trans i18nKey="projectCreateHelper">
                  <li>
                    Create a new Project using the button in the upper right.
                  </li>
                </Trans>
              </ul>
            </div>
          </div>
          {refreshing ? (
            <div className="slds-align_absolute-center slds-m-top_x-large">
              <span className="slds-is-relative">
                <SpinnerWrapper />
              </span>
            </div>
          ) : (
            contents
          )}
          {fetchingProjects ? (
            <div className="slds-align_absolute-center slds-m-top_x-large">
              <span className="slds-is-relative slds-m-right_large">
                <SpinnerWrapper variant="brand" size="small" />
              </span>
              {t('Loading…')}
            </div>
          ) : null}
        </div>

        <CreateProjectModal
          orgs={user.organizations}
          isRefreshingOrgs={user.currently_fetching_orgs}
          isOpen={createProjectModalOpen}
          closeModal={closeCreateProjectModal}
        />
      </>
    </DocumentTitle>
  );
};

export default ProjectList;
