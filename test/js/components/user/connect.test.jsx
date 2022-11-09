import { fireEvent } from '@testing-library/react';
import React from 'react';

import ConnectModal from '@/js/components/user/connect';

import { extractCustomDomain, extractShard } from './../../../../src/js/utils/helpers';
import { render } from './../../utils';

describe('<ConnectModal />', () => {
  const toggleModal = jest.fn();

  const setup = (options) => {
    const defaults = {
      isOpen: true,
    };
    const opts = { ...defaults, ...options };
    return render(
      <ConnectModal user={{}} isOpen={opts.isOpen} toggleModal={toggleModal} />,
    );
  };

  test('renders login form', () => {
    const { getAllByText, getByTestId } = setup();

    expect(getAllByText('Connect to Salesforce')[1]).toBeVisible();
    expect(getByTestId('sf-login-next')).toHaveValue(window.location.pathname);
  });

  describe('CustomDomainForm', () => {
    let result;

    beforeEach(() => {
      result = setup();
      fireEvent.click(result.getByText('Use Custom Domain'));
    });

    test('renders login form', () => {
      const { getByLabelText, getByTestId } = setup();

      expect(getByLabelText('Custom Domain')).toBeVisible();
      expect(getByTestId('sf-login-custom-domain-next')).toHaveValue(
        window.location.pathname,
      );
      expect(getByTestId('sf-login-custom-domain')).toHaveValue('');
    });

    test('updates label when input changes', () => {
      const { getByLabelText, getByTestId } = result;
      const input = getByLabelText('Custom Domain');

      expect(input).toBeVisible();
      expect(getByTestId('custom-domain')).toHaveTextContent('domain');
      expect(getByTestId('sf-login-custom-domain')).toHaveValue('');

      fireEvent.change(input, { target: { value: ' ' } });

      expect(getByTestId('custom-domain')).toHaveTextContent('domain');
      expect(getByTestId('sf-login-custom-domain')).toHaveValue('');

      fireEvent.change(input, { target: { value: ' foobar' } });

      expect(getByTestId('custom-domain')).toHaveTextContent('foobar');
      expect(getByTestId('sf-login-custom-domain')).toHaveValue('foobar');
    });

    test('Checks custom domain properly formats regardless of format', () => {
      const { getByLabelText, getByTestId } = result;
      const input = getByLabelText('Custom Domain');

      expect(input).toBeVisible();
      expect(getByTestId('custom-domain')).toHaveTextContent('domain');
      expect(getByTestId('sf-login-custom-domain')).toHaveValue('');

      fireEvent.change(input, { target: { value: ' ' } });

      expect(getByTestId('custom-domain')).toHaveTextContent('domain');
      expect(getByTestId('sf-login-custom-domain')).toHaveValue('');

      const inputs = [
        `https://sfdc-ax-hub-axe.scratch.my.salesforce.com`,
        `https://sfdc-ax-hub-axe.patch.my.salesforce.com`,
        `https://sfdc-ax-hub-axe.demo.my.salesforce.com`,
        `https://sfdc-ax-hub-axe.sandbox.my.salesforce.com`,
        `https://sfdc-ax-hub-axe.free.my.salesforce.com`,
        `https://sfdc-ax-hub-axe.trailblaze.my.salesforce.com`,
        `https://sfdc-ax-hub-axe.develop.my.salesforce.com`,
        `https://sfdc-ax-hub-axe.my.salesforce.com`,
        `http://sfdc-ax-hub-axe.my.salesforce.com`,
        `sfdc-ax-hub-axe`,
      ];

      inputs.forEach((custom_domain) => {
        fireEvent.change(input, {
          target: {
            value: `https://${extractCustomDomain(custom_domain)}${extractShard(custom_domain)}.my.salesforce.com`,
          },
        });
        expect(getByTestId('custom-domain')).toHaveTextContent(
          `${extractCustomDomain(custom_domain)}${extractShard(custom_domain)}`,
        );
        expect(getByTestId('sf-login-custom-domain')).toHaveValue(
          `https://${extractCustomDomain(custom_domain)}${extractShard(custom_domain)}.my.salesforce.com`,
        );
      });
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
