import { render } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

const mockStore = configureStore([]);

export const renderWithRedux = (
  ui,
  initialState = {},
  customStoreCreator = mockStore,
  rerender = false,
  customStore,
) => {
  const store = customStore || customStoreCreator(initialState);
  const renderFn = rerender ? rerender : render;
  return {
    ...renderFn(<Provider store={store}>{ui}</Provider>),
    // adding `store` to the returned utilities to allow us
    // to reference it in our tests (just try to avoid using
    // this to test implementation details).
    store,
  };
};

export const storeWithThunk = configureStore([thunk]);

export const renderHookWithRedux = (
  cb,
  initialState = {},
  customStore = storeWithThunk,
) => {
  const store = customStore(initialState);
  // eslint-disable-next-line react/prop-types
  const wrapper = ({ children }) => (
    <Provider store={store}>{children}</Provider>
  );
  return renderHook(cb, { wrapper });
};
