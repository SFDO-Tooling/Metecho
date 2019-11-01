import i18n from 'i18next';
import React, { ReactNode } from 'react';
import DocumentTitle from 'react-document-title';
import { Trans } from 'react-i18next';
import { Link } from 'react-router-dom';

import routes from '@/utils/routes';
import svgPath from '#/desert.svg';

export const EmptyIllustration = ({ message }: { message: ReactNode }) => (
  <div className="slds-illustration slds-illustration_large">
    <svg
      className="slds-illustration__svg"
      aria-hidden="true"
      name="desert"
      style={{ height: '400px' }}
    >
      <use xlinkHref={`${svgPath}#desert`} />
    </svg>
    <h3 className="slds-illustration__header slds-text-heading_medium">
      ¯\_(ツ)_/¯
    </h3>
    <p className="slds-text-body_regular">{message}</p>
  </div>
);

const FourOhFour = ({ message }: { message?: ReactNode }) => (
  <DocumentTitle title={`${i18n.t('404')} | ${i18n.t('MetaShare')}`}>
    <EmptyIllustration
      message={
        message === undefined ? (
          <Trans i18nKey="pageCannotBeFound">
            That page cannot be found. Try the{' '}
            <Link to={routes.home()}>home page</Link>?
          </Trans>
        ) : (
          message
        )
      }
    />
  </DocumentTitle>
);

export default FourOhFour;
