import Toast from '@salesforce/design-system-react/components/toast';
import ToastContainer from '@salesforce/design-system-react/components/toast/container';
import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import { removeToast } from '~js/store/toasts/actions';
import { ToastType } from '~js/store/toasts/reducer';
import { selectToasts } from '~js/store/toasts/selectors';

const ToastMessage = withRouter(
  ({ toast, history }: { toast: ToastType } & RouteComponentProps) => {
    const dispatch = useDispatch();
    const closeToast = useCallback(() => {
      if (toast.id) {
        dispatch(removeToast(toast.id));
      }
    }, [dispatch, toast]);
    const linkClicked = () => {
      if (toast.linkUrl) {
        if (toast.openLinkInNewWindow) {
          window.open(toast.linkUrl, '_blank');
        } else {
          history.push(toast.linkUrl);
        }
      }
    };
    return (
      <Toast
        labels={{
          heading: toast.heading,
          headingLink: toast.linkText,
          details: toast.details,
        }}
        variant={toast.variant || 'success'}
        onClickHeadingLink={linkClicked}
        onRequestClose={closeToast}
      />
    );
  },
);

const Toasts = () => {
  const toasts = useSelector(selectToasts);
  return (
    <ToastContainer className="half-container">
      {toasts?.map((toast) => (
        <ToastMessage key={toast.id} toast={toast} />
      ))}
    </ToastContainer>
  );
};

export default Toasts;
