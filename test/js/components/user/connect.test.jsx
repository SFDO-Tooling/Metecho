import { fireEvent, render } from '@testing-library/react';
import React from 'react';

import ConnectModal from '@/components/user/connect';
import { addUrlParams } from '@/utils/api';

describe('<ConnectModal />', () => {
  const toggleModal = jest.fn();

  const setup = options => {
    const defaults = {
      isOpen: true,
    };
    const opts = { ...defaults, ...options };
    return render(
      <ConnectModal isOpen={opts.isOpen} toggleModal={toggleModal} />,
    );
  };

  describe('login click', () => {
    test('updates `window.location.href` on login click', () => {
      const { getAllByText } = setup();
      jest.spyOn(window.location, 'assign');
      fireEvent.click(getAllByText('Connect to Salesforce')[1]);
      const base = window.api_urls.salesforce_production_login();
      const expected = addUrlParams(base, {
        process: 'connect',
        next: window.location.pathname,
      });

      expect(window.location.assign).toHaveBeenCalledWith(expected);
    });
  });

  describe('CustomDomainForm', () => {
    let result;

    beforeEach(() => {
      result = setup();
      fireEvent.click(result.getByText('Use Custom Domain'));
    });

    test('updates label when input changes', () => {
      const { getByLabelText, getByTestId } = result;
      const input = getByLabelText('Custom Domain');

      expect(input).toBeVisible();
      expect(getByTestId('custom-domain')).toHaveTextContent('domain');

      fireEvent.change(input, { target: { value: ' ' } });

      expect(getByTestId('custom-domain')).toHaveTextContent('domain');

      fireEvent.change(input, { target: { value: ' foobar' } });

      expect(getByTestId('custom-domain')).toHaveTextContent('foobar');
    });

    test('updates window.location.href on submit', () => {
      const { getByLabelText, getByText } = result;

      jest.spyOn(window.location, 'assign');
      const input = getByLabelText('Custom Domain');
      fireEvent.change(input, { target: { value: ' ' } });
      fireEvent.click(getByText('Continue'));

      expect(window.location.assign).not.toHaveBeenCalled();

      fireEvent.change(input, { target: { value: 'foobar' } });
      fireEvent.click(getByText('Continue'));
      const baseUrl = window.api_urls.salesforce_custom_login();
      const expected = addUrlParams(baseUrl, {
        custom_domain: 'foobar',
        process: 'connect',
        next: window.location.pathname,
      });

      expect(window.location.assign).toHaveBeenCalledWith(expected);
    });

    describe('"back" click', () => {
      test('returns to default modal', () => {
        const { getByText } = result;
        fireEvent.click(getByText('Back'));

        expect(getByText('Use Custom Domain')).toBeVisible();
      });
    });

    describe('"close" click', () => {
      test('closes modal', () => {
        const { getByTitle } = result;
        fireEvent.click(getByTitle('Close'));

        expect(toggleModal).toHaveBeenCalledWith(false);
      });
    });
  });
});
