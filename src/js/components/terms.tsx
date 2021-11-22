import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import { Location } from 'history';
import { t } from 'i18next';
import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { StaticContext } from 'react-router';
import { Redirect, RouteComponentProps, withRouter } from 'react-router-dom';

import Logout from '@/js/components/user/logout';
import { LabelWithSpinner, useIsMounted } from '@/js/components/utils';
import { ThunkDispatch } from '@/js/store';
import { agreeToTerms } from '@/js/store/user/actions';
import { selectUserState } from '@/js/store/user/selectors';
import routes from '@/js/utils/routes';

interface TermsProps
  extends RouteComponentProps<
    { [key: string]: any },
    StaticContext,
    { from?: Location }
  > {
  from?: { pathname?: string };
}

export const TermsModal = ({
  isOpen,
  isRequired = false,
  isSubmitting = false,
  handleClose,
  handleSubmit,
}: {
  isOpen?: boolean;
  isRequired?: boolean;
  isSubmitting?: boolean;
  handleClose?: () => void;
  handleSubmit?: () => void;
}) => (
  <Modal
    isOpen={isRequired || isOpen || false}
    disableClose={isRequired}
    heading={t('Metecho Terms of Service')}
    size="medium"
    assistiveText={{ closeButton: t('Close') }}
    footer={
      isRequired
        ? [
            <Logout
              key="cancel"
              label={t('Cancel and Log Out')}
              variant="neutral"
            />,
            <Button
              key="submit"
              label={
                isSubmitting ? (
                  <LabelWithSpinner label={t('Saving…')} variant="inverse" />
                ) : (
                  t('I Agree')
                )
              }
              variant="brand"
              onClick={handleSubmit}
              disabled={isSubmitting}
            />,
          ]
        : null
    }
    onRequestClose={handleClose}
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

const Terms = ({ from = {}, location }: TermsProps) => {
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
    <TermsModal isRequired isSubmitting={submitting} handleSubmit={doAgree} />
  );
};

export default withRouter(Terms);
