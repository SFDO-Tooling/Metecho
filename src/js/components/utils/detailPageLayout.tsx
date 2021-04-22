import BreadCrumb from '@salesforce/design-system-react/components/breadcrumb';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import i18n from 'i18next';
import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { ExternalLink, PageDescription } from '~js/components/utils';
import routes from '~js/utils/routes';

interface Crumb {
  name: string;
  url?: string;
}

const DetailPageLayout = ({
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
  const showHeaderImage = Boolean(image && !description);

  return (
    <>
      <PageHeader
        className="page-header slds-p-around_x-large slds-is-relative"
        title={
          <div className="page-title">
            <span className="slds-m-right_xxx-small" title={title}>
              {title}
            </span>
            {titlePopover}
          </div>
        }
        info={
          <ExternalLink url={headerUrl} showGitHubIcon>
            /{headerUrlText}
          </ExternalLink>
        }
        onRenderControls={onRenderHeaderActions}
        icon={
          showHeaderImage ? (
            <div className="metecho-repo-image-header">
              <img
                src={image}
                alt={i18n.t('social image for {{title}}', { title })}
              />
            </div>
          ) : null
        }
      />
      <div
        className="slds-p-horizontal_x-large
          slds-p-top_x-small
          metecho-breadcrumb
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
          {description && (
            <PageDescription
              title={title}
              description={description}
              image={image}
            />
          )}
          {sidebar}
        </div>
      </div>
    </>
  );
};

export default DetailPageLayout;
