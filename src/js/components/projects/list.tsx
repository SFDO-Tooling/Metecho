import Button from '@salesforce/design-system-react/components/button';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import i18n from 'i18next';
import React, { useCallback, useEffect, useState } from 'react';
import DocumentTitle from 'react-document-title';
import { ScrollProps, withScroll } from 'react-fns';
import { Trans } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { EmptyIllustration } from '~js/components/404';
import ProjectListItem from '~js/components/projects/listItem';
import {
  LabelWithSpinner,
  SpinnerWrapper,
  useIsMounted,
} from '~js/components/utils';
import { ThunkDispatch } from '~js/store';
import { fetchObjects } from '~js/store/actions';
import { refreshProjects } from '~js/store/projects/actions';
import {
  selectNextUrl,
  selectProjects,
  selectProjectsRefreshing,
} from '~js/store/projects/selectors';
import { OBJECT_TYPES } from '~js/utils/constants';

const ProjectList = withScroll(({ y }: ScrollProps) => {
  const [fetchingProjects, setFetchingProjects] = useState(false);
  const isMounted = useIsMounted();
  const dispatch = useDispatch<ThunkDispatch>();
  const projects = useSelector(selectProjects);
  const refreshing = useSelector(selectProjectsRefreshing);
  const next = useSelector(selectNextUrl);

  const doRefreshProjects = useCallback(() => {
    dispatch(refreshProjects());
  }, [dispatch]);

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
    const scrolledToBottom = scrollHeight - Math.ceil(y + clientHeight) <= 100;

    /* istanbul ignore else */
    if (scrolledToBottom) {
      maybeFetchMoreProjects();
    }
  }, [y, next, fetchingProjects, isMounted, dispatch]);

  let contents;
  switch (projects.length) {
    case 0: {
      // No projects; show empty message
      const msg = (
        <Trans i18nKey="noProjectsHelper">
          We couldn’t find any projects you have access to on GitHub. Confirm
          that you are logged into the correct account or contact an admin on
          GitHub.
        </Trans>
      );
      contents = <EmptyIllustration message={msg} />;
      break;
    }
    default: {
      contents = (
        <div className="slds-grid slds-wrap slds-grid_pull-padded-small">
          {projects.map((project) => (
            <ProjectListItem project={project} key={project.id} />
          ))}
        </div>
      );
      break;
    }
  }

  return (
    <DocumentTitle title={`${i18n.t('Projects')} | ${i18n.t('Metecho')}`}>
      <>
        <PageHeader
          className="page-header slds-p-around_x-large"
          title={i18n.t('Select a Project')}
        />
        <div className="slds-p-around_x-large">
          <div className="slds-grid slds-grid_vertical-align-start">
            <div
              className="slds-grid
                slds-wrap
                slds-shrink
                slds-m-bottom_medium
                slds-p-right_x-large
                restricted-container"
            >
              <p className="slds-p-bottom_small">
                <Trans i18nKey="projectListHelper">
                  Access on GitHub is required to view projects. If you do not
                  see the project you’re looking for below, confirm that you are
                  logged into the correct account or contact an admin for the
                  repository on GitHub.
                </Trans>
              </p>
              {/* <Button
                label={i18n.t('Create Project')}
                variant="brand"
                disabled
              /> */}
            </div>
            <div
              className="slds-grid
                slds-grow
                slds-shrink-none
                slds-grid_align-end"
            >
              {refreshing ? (
                <Button
                  label={
                    <LabelWithSpinner label={i18n.t('Syncing Projects…')} />
                  }
                  variant="outline-brand"
                  disabled
                />
              ) : (
                <Button
                  label={i18n.t('Re-Sync Projects')}
                  variant="outline-brand"
                  iconCategory="utility"
                  iconName="refresh"
                  iconPosition="left"
                  onClick={doRefreshProjects}
                />
              )}
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
              {i18n.t('Loading…')}
            </div>
          ) : null}
        </div>
      </>
    </DocumentTitle>
  );
});

export default ProjectList;
