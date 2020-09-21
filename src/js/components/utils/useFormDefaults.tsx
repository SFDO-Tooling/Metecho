import { useEffect, useRef } from 'react';

interface Inputs {
  [key: string]: any;
}

// When default values change, update inputs accordingly
export default ({
  field,
  value,
  inputs,
  setInputs,
}: {
  field: string;
  value: any;
  inputs: Inputs;
  setInputs: (i: Inputs) => void;
}) => {
  const defaultRef = useRef(value);
  useEffect(() => {
    const prevValue = defaultRef.current;
    if (value !== prevValue) {
      setInputs({
        ...inputs,
        [field]: value,
      });
      defaultRef.current = value;
    }
  }, [field, value, inputs, setInputs]);
};
