import { useEffect, useRef, useState } from 'react';

import { useIsMounted } from '~js/components/utils';

export default ({ timeout }: { timeout: number } = { timeout: 3000 }) => {
  const isMounted = useIsMounted();
  const [isShowingTransientMessage, setIsShowingTransientMessage] =
    useState(false);
  const successTimeout = useRef<number | null>(null);

  const clearSuccessTimeout = () => {
    if (typeof successTimeout.current === 'number') {
      window.clearTimeout(successTimeout.current);
      successTimeout.current = null;
    }
  };

  useEffect(
    () => () => {
      clearSuccessTimeout();
    },
    [],
  );

  const showTransientMessage = () => {
    /* istanbul ignore else */
    if (isMounted.current) {
      setIsShowingTransientMessage(true);
      successTimeout.current = window.setTimeout(() => {
        setIsShowingTransientMessage(false);
      }, timeout);
    }
  };

  return {
    showTransientMessage,
    isShowingTransientMessage,
  };
};
