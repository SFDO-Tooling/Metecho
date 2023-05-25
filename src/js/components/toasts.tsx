import Toast from '@salesforce/design-system-react/components/toast';
import ToastContainer from '@salesforce/design-system-react/components/toast/container';
import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import { removeToast } from '@/js/store/toasts/actions';
import { ToastType } from '@/js/store/toasts/reducer';
import { selectToasts } from '@/js/store/toasts/selectors';

import { ExternalLink } from './utils';

const ToastMessage = withRouter(
  ({ toast, history }: { toast: ToastType } & RouteComponentProps) => {
    const dispatch = useDispatch();
    const closeToast = useCallback(() => {
      if (toast.id) {
        dispatch(removeToast(toast.id));

        // Override default toast close behavior because default behavior
        // selects HTML body when toast can't find openeing element,
        // which is basically always in our case.
        const wrapper = document.getElementsByClassName('metecho-toast-focus');
        if (wrapper.length) {
          (wrapper[0] as HTMLElement).focus();
        }
      }
    }, [dispatch, toast]);
    const linkClicked = () => {
      if (toast.linkDownload) {
        const link = document.createElement('a');

        link.href = toast.linkUrl;
        link.download = toast.linkDownloadFilename || 'output.txt';
        link.click();
      } else {
        history.push(toast.linkUrl);
      }
    };

    return (
      <Toast
        labels={{
          headingLink:
            toast.linkText && !toast.openLinkInNewWindow ? toast.linkText : '',
          heading:
            toast.linkUrl && toast.openLinkInNewWindow
              ? [
                  `${toast.heading} `,
                  <ExternalLink
                    key={toast.id}
                    url={toast.linkUrl}
                    showButtonIcon
                  >
                    {toast.linkText}
                  </ExternalLink>,
                ]
              : toast.heading,
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
