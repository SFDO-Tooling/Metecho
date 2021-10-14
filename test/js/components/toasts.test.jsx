import { fireEvent } from '@testing-library/react';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import Toasts from '@/js/components/toasts';
import { removeToast } from '@/js/store/toasts/actions';

import { renderWithRedux } from './../utils';

jest.mock('@/js/store/toasts/actions');

removeToast.mockReturnValue({ type: 'TEST' });

afterEach(() => {
  removeToast.mockClear();
});

const defaultToast = {
  id: 'toast-1',
  heading: 'This is a message.',
  linkText: 'open link',
  linkUrl: '/test/url/',
};

describe('<Toasts />', () => {
  const setup = (options = {}) => {
    const toasts = options.toasts || [defaultToast];
    const context = {};
    const result = renderWithRedux(
      <StaticRouter context={context}>
        <Toasts />
      </StaticRouter>,
      { toasts },
    );
    return { ...result, context };
  };

  describe('link click', () => {
    test('navigates to link url', () => {
      const { getByText, context } = setup();
      fireEvent.click(getByText('open link'));

      expect(context.action).toBe('PUSH');
      expect(context.url).toBe('/test/url/');
    });

    test('opens link url in new window if `openLinkInNewWindow`', () => {
      const { getByText } = setup({
        toasts: [{ ...defaultToast, openLinkInNewWindow: true }],
      });
      fireEvent.click(getByText('open link'));

      expect(window.open).toHaveBeenCalledWith('/test/url/', '_blank');
    });

    test('does nothing if no linkUrl', () => {
      const { getByText } = setup({
        toasts: [{ ...defaultToast, openLinkInNewWindow: true, linkUrl: '' }],
      });
      fireEvent.click(getByText('open link'));

      expect(window.open).not.toHaveBeenCalled();
    });
  });

  describe('close click', () => {
    test('calls removeToast with id', () => {
      const { getByText } = setup();
      fireEvent.click(getByText('Close'));

      expect(removeToast).toHaveBeenCalledTimes(1);
      expect(removeToast).toHaveBeenCalledWith('toast-1');
    });

    test('does not call removeToast if no id', () => {
      const { getByText } = setup({
        toasts: [{ heading: 'This is a message.' }],
      });
      fireEvent.click(getByText('Close'));

      expect(removeToast).not.toHaveBeenCalled();
    });
  });
});
