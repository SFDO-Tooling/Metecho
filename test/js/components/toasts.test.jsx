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
      fireEvent.click(getByText(/open link/));

      expect(context.action).toBe('PUSH');
      expect(context.url).toBe('/test/url/');
    });

    test('opens link url in new window if `openLinkInNewWindow`', () => {
      const { getByText } = setup({
        toasts: [{ ...defaultToast, openLinkInNewWindow: true }],
      });

      const link = getByText(/open link/);

      expect(link).toHaveAttribute('href', '/test/url/');
      expect(link).toHaveAttribute('target', '_blank');
    });

    test('dont render link if no linkUrl', () => {
      const { queryByRole } = setup({
        toasts: [{ ...defaultToast, openLinkInNewWindow: true, linkUrl: '' }],
      });
      // A link should not render
      expect(queryByRole('link')).toBeNull();
    });

    test('starts download if linkDownload set', () => {
      const mockElement = {
        click: () => {},
      };
      const clickSpy = jest.spyOn(mockElement, 'click');
      const createElementSpy = jest.spyOn(window.document, 'createElement');

      const { getByText } = setup({
        toasts: [
          {
            ...defaultToast,
            linkDownload: true,
            linkDownloadFilename: 'foo.txt',
            linkUrl: '/foo.txt',
          },
        ],
      });

      createElementSpy.mockReturnValueOnce(mockElement);
      fireEvent.click(getByText('open link'));

      expect(createElementSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(window.open).not.toHaveBeenCalled();
    });

    test('defaults linkDownloadFilename', () => {
      const mockElement = {
        click: () => {},
      };
      const createElementSpy = jest.spyOn(window.document, 'createElement');

      const { getByText } = setup({
        toasts: [
          {
            ...defaultToast,
            linkDownload: true,
            linkUrl: '/foo.txt',
          },
        ],
      });

      createElementSpy.mockReturnValueOnce(mockElement);
      fireEvent.click(getByText('open link'));
      expect(mockElement.download).toBe('output.txt');
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

    test('removeToast focus control', () => {
      const { getByText } = setup();

      /* Setup dom nodes for test */
      const divNode = document.createElement('div');
      divNode.classList.add('metecho-toast-focus');

      const mockGetElement = jest.spyOn(document, 'getElementsByClassName');
      const mockFocus = jest.spyOn(divNode, 'focus');
      mockGetElement.mockReturnValue([divNode]);
      Object.defineProperty(document, 'getElementsByClassName', {
        value: mockGetElement,
      });

      fireEvent.click(getByText('Close'));

      expect(mockGetElement).toHaveBeenCalled();
      expect(mockFocus).toHaveBeenCalled();
      // expect(divNode).toHaveFocus();
    });
  });
});
