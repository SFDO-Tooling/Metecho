import { fireEvent, waitForElementToBeRemoved } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import UserDropdown, { ConnectionInfoModal } from '@/js/components/user/info';
import { disconnect, refreshUser } from '@/js/store/user/actions';

import { renderWithRedux, storeWithThunk } from './../../utils';

jest.mock('@/js/store/user/actions');

disconnect.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));
refreshUser.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));

afterEach(() => {
  disconnect.mockClear();
  refreshUser.mockClear();
});

describe('<ConnectionInfoModal />', () => {
  const toggleModal = jest.fn();

  const setup = (options) => {
    const defaults = {
      isOpen: true,
    };
    const opts = { ...defaults, ...options };
    return renderWithRedux(
      <MemoryRouter>
        <ConnectionInfoModal
          user={{ valid_token_for: 'foo' }}
          isOpen={opts.isOpen}
          toggleModal={toggleModal}
        />
        ,
      </MemoryRouter>,
      {},
      storeWithThunk,
    );
  };

  describe('"close" click', () => {
    test('closes modal', () => {
      const { getByTitle } = setup();
      fireEvent.click(getByTitle('Close'));

      expect(toggleModal).toHaveBeenCalledWith(false);
    });
  });
});

describe('<UserDropdown />', () => {
  const setup = (
    initialState = {
      user: { username: 'Test User' },
    },
  ) => {
    const result = renderWithRedux(
      <MemoryRouter>
        <UserDropdown />
      </MemoryRouter>,
      initialState,
      storeWithThunk,
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
    expect(getByText('Log Out')).toBeVisible();
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
          avatar_url: 'http://avatar.com',
          valid_token_for: 'token',
          sf_username: 'user@domain.com',
          org_name: 'Test Org',
          org_type: 'Test Org Type',
          is_devhub_enabled: true,
        },
      });

      expect(getByText('Test User')).toBeVisible();
      expect(getByText('Connected to Salesforce')).toBeVisible();
      expect(getByText('Enabled')).toBeVisible();
      expect(getByText('user@domain.com')).toBeVisible();
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
            sf_username: 'user@domain.com',
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
        test('calls refreshUser', async () => {
          const { getByText, container } = result;
          fireEvent.click(getByText('Check Again'));

          expect(refreshUser).toHaveBeenCalledTimes(1);
          await waitForElementToBeRemoved(
            container.querySelector('.spinner-container'),
          );
        });
      });

      describe('"disconnect" click', () => {
        test('calls disconnect', async () => {
          const { getByText, container } = result;
          fireEvent.click(getByText('Disconnect from Salesforce'));

          expect(disconnect).toHaveBeenCalledTimes(1);
          await waitForElementToBeRemoved(
            container.querySelector('.spinner-container'),
          );
        });
      });
    });
  });

  describe('connected to global devhub', () => {
    test('does not render connection info', () => {
      const { getByText, queryByText } = setup({
        user: {
          username: 'Test User',
          avatar_url: 'http://avatar.com',
          valid_token_for: null,
          sf_username: 'user@domain.com',
          is_devhub_enabled: true,
          uses_global_devhub: true,
        },
      });

      expect(getByText('Test User')).toBeVisible();
      expect(queryByText('Connected to Salesforce')).toBeNull();
      expect(queryByText('user@domain.com')).toBeNull();
    });
  });

  describe('logged out', () => {
    test('renders nothing', () => {
      const { container } = setup({ user: null });

      expect(container).toBeEmptyDOMElement();
    });
  });
});
