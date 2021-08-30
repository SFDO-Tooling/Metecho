import Toast from '@salesforce/design-system-react/components/toast';
import ToastContainer from '@salesforce/design-system-react/components/toast/container';
import i18n from 'i18next';
import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { removeError } from '@/js/store/errors/actions';
import { ErrorType } from '@/js/store/errors/reducer';
import { selectErrors } from '@/js/store/errors/selectors';

const reloadPage = (): void => {
  window.location.reload();
};

const ErrorToast = ({ error }: { error: ErrorType }) => {
  const dispatch = useDispatch();
  const closeToast = useCallback(() => {
    dispatch(removeError(error.id));
  }, [dispatch, error]);
  return (
    <Toast
      labels={{
        heading: i18n.t("Uh oh, we've encountered an error. You may need to"),
        headingLink: i18n.t('reload the page.'),
        details: error.message,
      }}
      variant="error"
      onClickHeadingLink={reloadPage}
      onRequestClose={closeToast}
    />
  );
};

const Errors = () => {
  const errors = useSelector(selectErrors);
  return (
    <ToastContainer className="half-container">
      {errors?.map((err) => (
        <ErrorToast key={err.id} error={err} />
      ))}
    </ToastContainer>
  );
};

export default Errors;
