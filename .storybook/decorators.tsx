import React from 'react';
import { Provider } from 'react-redux';
import { action } from '@storybook/addon-actions';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

const storyMiddleware = (store: any) => (next: (act: any) => any) => (
  act: any,
) => {
  action('dispatch');
  return next(act);
};

export const withRedux = (state = {}) => (Story: React.ComponentClass) => {
  const store = configureStore([thunk, storyMiddleware])(state);
  return (
    <Provider store={store}>
      <Story />
    </Provider>
  );
};
