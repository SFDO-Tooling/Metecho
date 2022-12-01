import BreadCrumb from '@salesforce/design-system-react/components/breadcrumb';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import React, { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import TourPopover from '@/js/components/tour/popover';
import { ExternalLink, PageDescription } from '@/js/components/utils';
import { OBJECT_TYPES } from '@/js/utils/constants';
import routes from '@/js/utils/routes';

interface Crumb {
  name: string;
  url?: string;
  emphasis?: boolean;
}

const DetailPageLayout = ({
  type,
  title,
  titlePopover,
  description,
  headerUrl,
  headerUrlText,
  breadcrumb,
  onRenderHeaderActions,
  sidebar,
  children,
  image,
}: {
  type: 'project' | 'epic' | 'task';
  title: string;
  titlePopover?: JSX.Element;
  description?: string;
  headerUrl: string;
  headerUrlText?: string;
  breadcrumb: Crumb[];
  onRenderHeaderActions?: () => JSX.Element;
  sidebar?: ReactNode;
  children?: ReactNode;
  image?: string;
}) => {
  const { t } = useTranslation();

  const showHeaderImage = Boolean(image && !description);
  let popover = null;
  const popoverHeading = t('Navigation breadcrumb');

  switch (type) {
    case OBJECT_TYPES.EPIC:
      popover = (
        <TourPopover
          id="tour-epic-breadcrumb"
          align="right"
          heading={popoverHeading}
          body={
            <Trans i18nKey="tourEpicBreadcrumb">
              This “breadcrumb” list shows the hierarchy of objects in Metecho.
              Projects contain Epics and Tasks. Epics contain Tasks. You are
              currently viewing an Epic. Click the Project name to return to
              that view. Click “Home” to see the list of all Projects.
            </Trans>
          }
        />
      );
      break;
    case OBJECT_TYPES.TASK:
      popover = (
        <TourPopover
          id="tour-task-breadcrumb"
          align="right"
          heading={popoverHeading}
          body={
            <Trans i18nKey="tourTaskBreadcrumb">
              This “breadcrumb” list shows the hierarchy of objects in Metecho.
              Projects contain Epics and Tasks. Epics contain Tasks. You are
              currently viewing a Task. Click the Project or Epic name to return
              to that view. Click “Home” to see the list of all Projects.
            </Trans>
          }
        />
      );
      break;
  }

  return (
    <>
      <div className="slds-is-relative page-title">
        {titlePopover}
        <PageHeader
          className="page-header slds-p-around_x-large"
          title={
            <span className="slds-m-right_xxx-small" title={title}>
              {title}
            </span>
          }
          info={
            headerUrl && headerUrlText ? (
              <ExternalLink url={headerUrl} showGitHubIcon>
                /{headerUrlText}
              </ExternalLink>
            ) : null
          }
          onRenderControls={onRenderHeaderActions}
          icon={
            showHeaderImage ? (
              <div className="metecho-repo-image-header">
                <img
                  src={image}
                  alt={t('social image for {{title}}', { title })}
                />
              </div>
            ) : undefined
          }
        />
      </div>
      <div>
        <div
          className="slds-p-horizontal_x-large
            slds-p-top_x-small
            slds-is-relative
            metecho-breadcrumb"
        >
          {popover}
          <BreadCrumb
            trail={[
              <Link to={routes.home()} key="home">
                {t('Home')}
              </Link>,
            ].concat(
              breadcrumb.map((crumb, idx) => {
                if (crumb.url) {
                  return (
                    <Link to={crumb.url} key={idx}>
                      {crumb.emphasis ? <em>{crumb.name}</em> : crumb.name}
                    </Link>
                  );
                }
                return (
                  <div className="slds-p-horizontal_x-small" key={idx}>
                    {crumb.emphasis ? <em>{crumb.name}</em> : crumb.name}
                  </div>
                );
              }),
            )}
          />
        </div>
      </div>
      <div
        className="slds-p-around_x-large
          slds-grid
          slds-gutters
          slds-wrap"
      >
        <div
          className="slds-col
            slds-size_1-of-1
            slds-medium-size_4-of-12
            slds-large-size_5-of-12
            slds-medium-order_2"
        >
          {description && (
            <PageDescription
              title={title}
              description={description}
              image={image}
            />
          )}
          {sidebar}
        </div>
        <div
          className="slds-col
            slds-size_1-of-1
            slds-medium-size_8-of-12
            slds-large-size_7-of-12
            slds-p-bottom_x-large"
        >
          {children}
        </div>
      </div>
    </>
  );
};

export default DetailPageLayout;
