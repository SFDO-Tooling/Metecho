import { useEffect, useRef } from 'react';

// This is often considered an anti-pattern in React, but we consider it
// acceptable in cases where we don't want to cancel or cleanup an asynchronous
// action on unmount -- we just want to prevent a post-unmount state update
// after the action finishes.
// https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html
export default () => {
  const isMounted = useRef(true);
  useEffect(
    () => () => {
      isMounted.current = false;
    },
    [],
  );
  return isMounted;
};
