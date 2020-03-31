import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import { Location } from 'history';
import i18n from 'i18next';
import React, { useCallback, useState } from 'react';
import { Trans } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { StaticContext, withRouter } from 'react-router';
import { Redirect, RouteComponentProps } from 'react-router-dom';

import Logout from '@/components/user/logout';
import {
  ExternalLink,
  LabelWithSpinner,
  useIsMounted,
} from '@/components/utils';
import { ThunkDispatch } from '@/store';
import { agreeToTerms } from '@/store/user/actions';
import { selectUserState } from '@/store/user/selectors';
import routes from '@/utils/routes';

interface Props
  extends RouteComponentProps<{}, StaticContext, { from?: Location }> {
  from?: { pathname?: string };
}

const Terms = ({ from = {}, location }: Props) => {
  const user = useSelector(selectUserState);
  let { pathname } = location.state?.from || from;
  if (!pathname) {
    pathname = routes.home();
  }
  const [submitting, setSubmitting] = useState(false);
  const isMounted = useIsMounted();
  const dispatch = useDispatch<ThunkDispatch>();

  const doAgree = useCallback(() => {
    setSubmitting(true);
    dispatch(agreeToTerms()).finally(() => {
      /* istanbul ignore else */
      if (isMounted.current) {
        setSubmitting(false);
      }
    });
  }, [dispatch, isMounted]);

  return !user ||
    user.agreed_to_tos_at ||
    !window.GLOBALS?.SITE?.clickthrough_agreement ? (
    <Redirect to={pathname} />
  ) : (
    <Modal
      isOpen
      disableClose
      heading={i18n.t('Metecho Terms of Service')}
      size="medium"
      footer={[
        <Logout
          key="cancel"
          label={i18n.t('Cancel and Log Out')}
          variant="neutral"
        />,
        <Button
          key="submit"
          label={
            submitting ? (
              <LabelWithSpinner label={i18n.t('Saving…')} variant="inverse" />
            ) : (
              i18n.t('I Agree')
            )
          }
          variant="brand"
          onClick={doAgree}
          disabled={submitting}
        />,
      ]}
    >
      {/* This text is pre-cleaned by the API */}
      <div
        className="slds-p-around_large slds-text-longform markdown"
        dangerouslySetInnerHTML={{
          __html: window.GLOBALS.SITE.clickthrough_agreement as string,
        }}
      />
    </Modal>
  );
};

export default withRouter(Terms);
