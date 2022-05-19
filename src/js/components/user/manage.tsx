import BreadCrumb from '@salesforce/design-system-react/components/breadcrumb';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import routes from '@/js/utils/routes';

import DeleteAccount from './delete';

export const ManageAccountButton = () => {
  const { t } = useTranslation();

  return <Link to="/manage">{t('Manage Account')}</Link>;
};

const Manage = () => {
  const { t } = useTranslation();

  return (
    <>
      <div className="slds-is-relative page-title">
        <PageHeader
          className="page-header slds-p-around_x-large"
          title={
            <span
              className="slds-m-right_xxx-small"
              title={t('Manage Account')}
            >
              {t('Manage Account')}
            </span>
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
          <BreadCrumb
            trail={[
              <Link to={routes.home()} key="home">
                {t('Home')}
              </Link>,
              <div className="slds-p-horizontal_x-small" key="manage">
                {t('Manage Account')}
              </div>,
            ]}
          />
        </div>
      </div>
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
            <DeleteAccount></DeleteAccount>
          </div>
        </div>
      </div>
    </>
  );
};

export default Manage;
