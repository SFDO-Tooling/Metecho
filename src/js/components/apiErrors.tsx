import Toast from '@salesforce/design-system-react/components/toast';
import ToastContainer from '@salesforce/design-system-react/components/toast/container';
import i18n from 'i18next';
import React from 'react';

import { RemoveErrorAction } from '@/store/errors/actions';
import { ErrorType } from '@/store/errors/reducer';

const reloadPage = (): void => {
  window.location.reload();
};

const ErrorToast = ({
  error,
  doRemoveError,
}: {
  error: ErrorType;
  doRemoveError(id: string): RemoveErrorAction;
}) => (
  <Toast
    labels={{
      heading: i18n.t("Uh oh, we've encountered an error. You may need to"),
      headingLink: i18n.t('reload the page.'),
      details: error.message,
    }}
    variant="error"
    onClickHeadingLink={reloadPage}
    onRequestClose={() => doRemoveError(error.id)}
  />
);

const Errors = ({
  errors,
  doRemoveError,
}: {
  errors: ErrorType[];
  doRemoveError(id: string): RemoveErrorAction;
}) => (
  <ToastContainer className="half-container">
    {errors &&
      errors.map(err => (
        <ErrorToast key={err.id} error={err} doRemoveError={doRemoveError} />
      ))}
  </ToastContainer>
);

export default Errors;
