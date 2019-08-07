import Toast from '@salesforce/design-system-react/components/toast';
import ToastContainer from '@salesforce/design-system-react/components/toast/container';
import i18n from 'i18next';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { removeError } from '@/store/errors/actions';
import { ErrorType } from '@/store/errors/reducer';
import { selectErrors } from '@/store/errors/selectors';

const reloadPage = (): void => {
  window.location.reload();
};

const ErrorToast = ({ error }: { error: ErrorType }) => {
  const dispatch = useDispatch();
  return (
    <Toast
      labels={{
        heading: i18n.t("Uh oh, we've encountered an error. You may need to"),
        headingLink: i18n.t('reload the page.'),
        details: error.message,
      }}
      variant="error"
      onClickHeadingLink={reloadPage}
      onRequestClose={() => dispatch(removeError(error.id))}
    />
  );
};

const Errors = () => {
  const errors = useSelector(selectErrors);
  return (
    <ToastContainer className="half-container">
      {errors && errors.map(err => <ErrorToast key={err.id} error={err} />)}
    </ToastContainer>
  );
};

export default Errors;
