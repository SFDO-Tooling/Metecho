import { useEffect, useRef } from 'react';

// use to track a previous state //
export default (value: any) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};
