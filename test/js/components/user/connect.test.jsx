import { fireEvent } from '@testing-library/react';
import React from 'react';

import ConnectModal from '@/js/components/user/connect';

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
    const { getAllByText } = setup();

    expect(getAllByText('Connect to Salesforce')[1]).toBeVisible();
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
