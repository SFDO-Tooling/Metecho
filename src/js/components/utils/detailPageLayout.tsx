import BreadCrumb from '@salesforce/design-system-react/components/breadcrumb';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import i18n from 'i18next';
import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import ExternalLink from '@/components/utils/externalLink';
import routes from '@/utils/routes';

interface Crumb {
  name: string;
  url?: string;
}

const DetailPageLayout = ({
  title,
  description,
  repoUrl,
  breadcrumb,
  onRenderHeaderActions,
  sidebar,
  children,
  infoPanel,
}: {
  title: string;
  description?: string;
  repoUrl: string;
  breadcrumb: Crumb[];
  onRenderHeaderActions?: () => JSX.Element;
  sidebar?: ReactNode;
  children?: ReactNode;
  infoPanel?: ReactNode;
}) => {
  const descriptionHasTitle =
    description?.startsWith('<h1>') || description?.startsWith('<h2>');

  return (
    <>
      <PageHeader
        className="page-header slds-p-around_x-large"
        title={title}
        info={<ExternalLink url={repoUrl} shortenGithub />}
        onRenderControls={onRenderHeaderActions}
      />
      <div
        className="slds-p-horizontal_x-large
          slds-p-top_x-small
          ms-breadcrumb
          slds-truncate"
      >
        <BreadCrumb
          trail={[
            <Link to={routes.home()} key="home">
              {i18n.t('Home')}
            </Link>,
          ].concat(
            breadcrumb.map((crumb, idx) => {
              if (crumb.url) {
                return (
                  <Link to={crumb.url} key={idx}>
                    {crumb.name}
                  </Link>
                );
              }
              return (
                <div className="slds-p-horizontal_x-small" key={idx}>
                  {crumb.name}
                </div>
              );
            }),
          )}
        />
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
            slds-medium-size_7-of-12
            slds-p-bottom_x-large"
        >
          {children}
        </div>
        <div
          className="slds-col
            slds-size_1-of-1
            slds-medium-size_5-of-12"
        >
          {infoPanel ? (
            infoPanel
          ) : (
            <div className="slds-text-longform">
              {!descriptionHasTitle && (
                <h2 className="slds-text-heading_medium">{title}</h2>
              )}
              {/* This description is pre-cleaned by the API */}
              {description && (
                <p
                  className="markdown"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              )}
            </div>
          )}
          {sidebar}
        </div>
      </div>
    </>
  );
};

export default DetailPageLayout;
