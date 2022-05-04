import React, { ReactNode } from 'react';
import DocumentTitle from 'react-document-title';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import desertSvg from '@/img/desert.svg?raw';
import routes from '@/js/utils/routes';

export const EmptyIllustration = ({
  heading,
  message,
}: {
  heading?: string;
  message: ReactNode;
}) => (
  <div className="slds-illustration slds-illustration_large">
    <div
      className="slds-m-top_xx-large"
      dangerouslySetInnerHTML={{ __html: desertSvg }}
    />
    <h3 className="slds-illustration__header slds-text-heading_medium">
      {heading || '¯\\_(ツ)_/¯'}
    </h3>
    <p className="slds-text-body_regular">{message}</p>
  </div>
);

const FourOhFour = ({ message }: { message?: ReactNode }) => {
  const { t } = useTranslation();

  return (
    <DocumentTitle title={`${t('404')} | ${t('Metecho')}`}>
      <EmptyIllustration
        message={
          message || (
            <Trans i18nKey="pageCannotBeFound">
              That page cannot be found. Try the{' '}
              <Link to={routes.home()}>home page</Link>?
            </Trans>
          )
        }
      />
    </DocumentTitle>
  );
};

export default FourOhFour;
