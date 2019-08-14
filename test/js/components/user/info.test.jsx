import { fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import UserInfo from '@/components/user/info';
import { disconnect, refreshDevHubStatus } from '@/store/user/actions';

import { renderWithRedux } from './../../utils';

jest.mock('@/store/user/actions');

disconnect.mockReturnValue({ type: 'TEST' });
refreshDevHubStatus.mockReturnValue({ type: 'TEST' });

afterEach(() => {
  disconnect.mockClear();
  refreshDevHubStatus.mockClear();
});

describe('<UserInfo />', () => {
  const setup = (
    initialState = {
      user: { username: 'Test User' },
    },
  ) => {
    const result = renderWithRedux(
      <MemoryRouter>
        <UserInfo />
      </MemoryRouter>,
      initialState,
    );
    const btn = result.container.querySelector('.slds-button');
    if (btn) {
      fireEvent.click(result.container.querySelector('.slds-button'));
    }
    return result;
  };

  test('renders profile dropdown', () => {
    const { getByText } = setup();

    expect(getByText('Test User')).toBeVisible();
    expect(getByText('Log Out of GitHub')).toBeVisible();
  });

  describe('not connected', () => {
    describe('"connect" button click', () => {
      test('opens modal', () => {
        const { getByText } = setup();
        fireEvent.click(getByText('Connect to Salesforce'));

        expect(getByText('Use Custom Domain')).toBeVisible();
      });
    });
  });

  describe('connected', () => {
    test('renders connection info', () => {
      const { getByText } = setup({
        user: {
          username: 'Test User',
          valid_token_for: 'token',
          org_name: 'Test Org',
          org_type: 'Test Org Type',
          is_devhub_enabled: true,
        },
      });

      expect(getByText('Connected to Salesforce')).toBeVisible();
      expect(getByText('Enabled')).toBeVisible();
      expect(getByText('Test User')).toBeVisible();
      expect(getByText('Test Org')).toBeVisible();
      expect(getByText('Test Org Type')).toBeVisible();
    });

    describe('no dev hub', () => {
      let result;

      beforeEach(() => {
        result = setup({
          user: {
            username: 'Test User',
            valid_token_for: 'token',
            org_name: 'Test Org',
            org_type: 'Test Org Type',
            is_devhub_enabled: false,
          },
        });
      });

      test('renders dev hub status', () => {
        const { getByText } = result;

        expect(getByText('Connected to Salesforce')).toBeVisible();
        expect(getByText('Not Enabled')).toBeVisible();
      });

      describe('"check again" click', () => {
        test('calls refreshDevHubStatus', () => {
          const { getByText } = result;
          fireEvent.click(getByText('Check Again'));

          expect(refreshDevHubStatus).toHaveBeenCalledTimes(1);
        });
      });

      describe('"disconnect" click', () => {
        test('calls disconnect', () => {
          const { getByText } = result;
          fireEvent.click(getByText('Disconnect from Salesforce'));

          expect(disconnect).toHaveBeenCalledTimes(1);
        });
      });
    });
  });

  describe('logged out', () => {
    test('renders nothing', () => {
      const { container } = setup({ user: null });

      expect(container).toBeEmpty();
    });
  });
});
