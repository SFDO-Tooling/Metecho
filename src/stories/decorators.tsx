import { action } from '@storybook/addon-actions';
import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

const storyMiddleware = () => (next: (act: any) => any) => (act: any) => {
  // Log Redux action to Storybook "Actions" panel
  action('dispatch')(act);
  return next(act);
};

export const withRedux =
  (state = {}) =>
  // eslint-disable-next-line react/display-name
  (Story: React.ComponentClass) => {
    const store = configureStore([thunk, storyMiddleware])(state);
    return (
      <Provider store={store}>
        <Story />
      </Provider>
    );
  };
