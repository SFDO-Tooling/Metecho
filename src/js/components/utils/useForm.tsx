import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

import { ThunkDispatch } from '@/store';
import { createObject, updateObject } from '@/store/actions';
import { addError } from '@/store/errors/actions';
import { ApiError } from '@/utils/api';
import { ObjectTypes } from '@/utils/constants';

import useIsMounted from './useIsMounted';

export interface UseFormProps {
  inputs: { [key: string]: any };
  errors: { [key: string]: string };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setInputs: React.Dispatch<React.SetStateAction<{ [key: string]: any }>>;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  resetForm: () => void;
}

export default ({
  fields,
  objectType,
  url,
  additionalData = {},
  onSuccess = () => {},
  onError = () => {},
  shouldSubscribeToObject = true,
  update = false,
}: {
  fields: { [key: string]: any };
  objectType?: ObjectTypes;
  url?: string;
  additionalData?: { [key: string]: any };
  onSuccess?: (...args: any[]) => any;
  onError?: (...args: any[]) => any;
  shouldSubscribeToObject?: boolean | ((...args: any[]) => boolean);
  update?: boolean;
}) => {
  const isMounted = useIsMounted();
  const dispatch = useDispatch<ThunkDispatch>();
  const [inputs, setInputs] = useState<{ [key: string]: any }>({ ...fields });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const resetForm = () => {
    setInputs({ ...fields });
    setErrors({});
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value: boolean | string = e.target.value;
    if (e.target.type === 'checkbox') {
      value = e.target.checked;
    }
    setInputs({ ...inputs, [e.target.name]: value });
  };
  const handleSuccess = (...args: any[]) => {
    /* istanbul ignore else */
    if (isMounted.current) {
      resetForm();
    }
    onSuccess(...args);
  };
  const catchError = (err: ApiError) => {
    // We only consider `400` responses as valid form errors...
    // Non-400 errors are displayed in a global error message.
    /* istanbul ignore if */
    if (err.response?.status !== 400) {
      throw err;
    }
    const allErrors = typeof err?.body === 'object' ? err.body : {};
    const fieldErrors: typeof errors = {};
    for (const field of Object.keys(allErrors)) {
      if (Object.keys(fields).includes(field) && allErrors[field]?.length) {
        fieldErrors[field] = allErrors[field].join(', ');
      }
    }
    onError(err, fieldErrors);
    /* istanbul ignore else */
    const hasFormErrors = Boolean(Object.keys(fieldErrors).length);
    if (isMounted.current && hasFormErrors) {
      setErrors(fieldErrors);
    } else {
      // If no inline errors to show, fallback to default global error toast
      dispatch(addError(err.message));
    }
  };
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    if (update) {
      dispatch(
        updateObject({
          objectType,
          url,
          data: {
            ...additionalData,
            ...inputs,
          },
          hasForm: true,
        }),
      )
        .then(handleSuccess)
        .catch(catchError);
    } else {
      dispatch(
        createObject({
          objectType,
          url,
          data: {
            ...additionalData,
            ...inputs,
          },
          hasForm: true,
          shouldSubscribeToObject,
        }),
      )
        .then(handleSuccess)
        .catch(catchError);
    }
  };

  return {
    inputs,
    errors,
    handleInputChange,
    setInputs,
    handleSubmit,
    resetForm,
  };
};
