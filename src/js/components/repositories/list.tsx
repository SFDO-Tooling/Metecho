import Button from '@salesforce/design-system-react/components/button';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import i18n from 'i18next';
import React, { useCallback, useEffect, useState } from 'react';
import DocumentTitle from 'react-document-title';
import { ScrollProps, withScroll } from 'react-fns';
import { Trans } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { EmptyIllustration } from '@/components/404';
import RepositoryListItem from '@/components/repositories/listItem';
import {
  LabelWithSpinner,
  SpinnerWrapper,
  useIsMounted,
} from '@/components/utils';
import { ThunkDispatch } from '@/store';
import { fetchObjects } from '@/store/actions';
import { refreshRepos } from '@/store/repositories/actions';
import {
  selectNextUrl,
  selectRepositories,
  selectReposRefreshing,
} from '@/store/repositories/selectors';
import { OBJECT_TYPES } from '@/utils/constants';

const RepositoryList = withScroll(({ y }: ScrollProps) => {
  const [fetchingRepositories, setFetchingRepositories] = useState(false);
  const isMounted = useIsMounted();
  const dispatch = useDispatch<ThunkDispatch>();
  const repositories = useSelector(selectRepositories);
  const refreshing = useSelector(selectReposRefreshing);
  const next = useSelector(selectNextUrl);

  const doRefreshRepos = useCallback(() => {
    dispatch(refreshRepos());
  }, [dispatch]);

  useEffect(() => {
    if (fetchingRepositories || !next) {
      return;
    }

    const maybeFetchMoreRepositories = () => {
      /* istanbul ignore else */
      if (next && !fetchingRepositories) {
        /* istanbul ignore else */
        if (isMounted.current) {
          setFetchingRepositories(true);
        }
        dispatch(
          fetchObjects({
            objectType: OBJECT_TYPES.REPOSITORY,
            url: next,
          }),
        ).finally(() => {
          /* istanbul ignore else */
          if (isMounted.current) {
            setFetchingRepositories(false);
          }
        });
      }
    };

    /* istanbul ignore next */
    const scrollHeight =
      document.documentElement?.scrollHeight ||
      document.body?.scrollHeight ||
      Infinity;
    const clientHeight =
      document.documentElement?.clientHeight || window.innerHeight;
    // Fetch more repositories if within 100px of bottom of page...
    const scrolledToBottom = scrollHeight - Math.ceil(y + clientHeight) <= 100;

    /* istanbul ignore else */
    if (scrolledToBottom) {
      maybeFetchMoreRepositories();
    }
  }, [y, next, fetchingRepositories, isMounted, dispatch]);

  let contents;
  switch (repositories.length) {
    case 0: {
      // No repositories; show empty message
      const msg = (
        <Trans i18nKey="noRepositoriesHelper">
          We couldn’t find any repositories you have access to on GitHub.
          Confirm that you are logged into the correct account or contact an
          admin on GitHub.
        </Trans>
      );
      contents = <EmptyIllustration message={msg} />;
      break;
    }
    default: {
      contents = (
        <div className="slds-grid slds-wrap slds-grid_pull-padded-small">
          {repositories.map((repository) => (
            <RepositoryListItem repository={repository} key={repository.id} />
          ))}
        </div>
      );
      break;
    }
  }

  return (
    <DocumentTitle title={`${i18n.t('Repositories')} | ${i18n.t('Metecho')}`}>
      <>
        <PageHeader
          className="page-header slds-p-around_x-large"
          title={i18n.t('Select a Repository')}
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
                <Trans i18nKey="repositoryListHelper">
                  Contributor access on GitHub is required to view repositories.
                  If you do not see the repository you’re looking for below,
                  confirm that you are logged into the correct account or
                  contact an admin on GitHub.
                </Trans>
              </p>
              {/* <Button
                label={i18n.t('Create Repository')}
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
                    <LabelWithSpinner label={i18n.t('Syncing GitHub Repos…')} />
                  }
                  variant="outline-brand"
                  disabled
                />
              ) : (
                <Button
                  label={i18n.t('Re-Sync GitHub Repositories')}
                  variant="outline-brand"
                  iconCategory="utility"
                  iconName="refresh"
                  iconPosition="left"
                  onClick={doRefreshRepos}
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
          {fetchingRepositories ? (
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

export default RepositoryList;
