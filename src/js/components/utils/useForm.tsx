import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

import { ThunkDispatch } from '@/store';
import { createObject } from '@/store/actions';
import { addError } from '@/store/errors/actions';
import { ApiError } from '@/utils/api';
import { ObjectTypes } from '@/utils/constants';

import useIsMounted from './useIsMounted';

export default ({
  fields,
  objectType,
  url,
  additionalData = {},
  onSuccess = () => {},
  onError = () => {},
  shouldSubscribeToObject = true,
}: {
  fields: { [key: string]: any };
  objectType: ObjectTypes;
  url?: string;
  additionalData?: { [key: string]: any };
  onSuccess?: (...args: any[]) => any;
  onError?: (...args: any[]) => any;
  shouldSubscribeToObject?: boolean | ((...args: any[]) => boolean);
}) => {
  const isMounted = useIsMounted();
  const dispatch = useDispatch<ThunkDispatch>();
  const [inputs, setInputs] = useState<{ [key: string]: any }>(fields);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const resetForm = () => {
    setInputs(fields);
    setErrors({});
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    dispatch(
      createObject({
        objectType,
        url,
        data: {
          ...inputs,
          ...additionalData,
        },
        hasForm: true,
        shouldSubscribeToObject,
      }),
    )
      .then((...args: any[]) => {
        /* istanbul ignore else */
        if (isMounted.current) {
          resetForm();
        }
        onSuccess(...args);
      })
      .catch((err: ApiError) => {
        onError(err);
        const allErrors = typeof err?.body === 'object' ? err.body : {};
        const fieldErrors: typeof errors = {};
        for (const field of Object.keys(allErrors)) {
          if (Object.keys(fields).includes(field) && allErrors[field]?.length) {
            fieldErrors[field] = allErrors[field].join(', ');
          }
        }
        /* istanbul ignore else */
        if (isMounted.current && Object.keys(fieldErrors).length) {
          setErrors(fieldErrors);
        } else if (err.response?.status === 422) {
          // If no inline errors to show, fallback to default global error toast
          dispatch(addError(err.message));
        } else {
          throw err;
        }
      });
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
