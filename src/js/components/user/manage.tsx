import BreadCrumb from '@salesforce/design-system-react/components/breadcrumb';
import PageHeader from '@salesforce/design-system-react/components/page-header';
import React from 'react';
import DocumentTitle from 'react-document-title';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import DeleteAccount from '@/js/components/user/delete';
import routes from '@/js/utils/routes';

export const ManageAccountButton = (props: any) => {
  const { t } = useTranslation();

  return (
    <Link to={routes.manage()} {...props}>
      {t('Manage Account')}
    </Link>
  );
};

const Manage = () => {
  const { t } = useTranslation();

  return (
    <DocumentTitle title={`${t('Manage Account')} | ${t('Metecho')}`}>
      <div>
        <div className="page-title">
          <PageHeader
            className="page-header slds-p-around_x-large"
            title={t('Manage Account')}
          />
        </div>
        <div>
          <div
            className="slds-p-horizontal_x-large
              slds-p-top_x-small
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
        <div className="slds-p-around_x-large slds-grid slds-gutters">
          <div
            className="slds-m-bottom_medium
              slds-col
              slds-size_1-of-1
              slds-large-size_2-of-3"
          >
            <DeleteAccount />
          </div>
        </div>
      </div>
    </DocumentTitle>
  );
};

export default Manage;
