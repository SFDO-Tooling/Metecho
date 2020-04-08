import { fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import CaptureModal from '@/components/tasks/capture';
import { createObject } from '@/store/actions';

import { renderWithRedux, storeWithThunk } from '../../../utils';

jest.mock('@/store/actions');

createObject.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);

afterEach(() => {
  createObject.mockClear();
});

const defaultChangeset = {
  Foo: ['Bar'],
  Buz: ['Baz', 'Bing'],
};

describe('<CaptureModal/>', () => {
  const setup = (options = {}) => {
    const defaults = {
      changeset: defaultChangeset,
      directories: { config: ['foo/bar'], pre: ['buz/baz'] },
      rerender: false,
    };
    const opts = Object.assign({}, defaults, options);
    const toggleModal = jest.fn();
    const result = renderWithRedux(
      <MemoryRouter>
        <CaptureModal
          orgId="org-id"
          changeset={opts.changeset}
          directories={opts.directories}
          isOpen
          toggleModal={toggleModal}
        />
      </MemoryRouter>,
      {},
      storeWithThunk,
      opts.rerender,
      opts.store,
    );
    return { ...result, toggleModal };
  };

  test('can navigate forward/back, close modal', () => {
    const { getByText, toggleModal } = setup();

    expect(getByText('Select the location to retrieve changes')).toBeVisible();

    fireEvent.click(getByText('Save & Next'));

    expect(getByText('Select the changes to retrieve or ignore')).toBeVisible();

    fireEvent.click(getByText('Go Back'));

    expect(getByText('Select the location to retrieve changes')).toBeVisible();

    fireEvent.click(getByText('Close'));

    expect(toggleModal).toHaveBeenCalledTimes(1);
  });

  test('updates default fields when props change', () => {
    const { getByLabelText, queryByLabelText, store, rerender } = setup({
      directories: { source: ['src'] },
    });

    expect(getByLabelText('src')).toBeChecked();
    expect(queryByLabelText('force-app')).toBeNull();

    setup({
      directories: { source: ['force-app'] },
      store,
      rerender,
    });

    expect(getByLabelText('force-app')).toBeChecked();
    expect(queryByLabelText('src')).toBeNull();
  });

  describe('form submit', () => {
    test('creates a new commit', () => {
      const { getByText, getByLabelText } = setup();

      // Click forward to the select-changes modal:
      fireEvent.click(getByText('Save & Next'));

      const selectAll = getByLabelText('Select All Changes');
      fireEvent.click(selectAll);
      // Click forward to the commit-message modal:
      fireEvent.click(getByText('Save & Next'));

      const commitInput = getByLabelText('*Commit Message', { exact: false });
      const submit = getByText('Retrieve Selected Changes');
      fireEvent.change(commitInput, { target: { value: 'My Commit' } });
      fireEvent.click(submit);

      expect(getByText('Retrieving Selected Changes…')).toBeVisible();
      expect(createObject).toHaveBeenCalledTimes(1);
      expect(createObject).toHaveBeenCalledWith({
        objectType: 'scratch_org_commit',
        url: window.api_urls.scratch_org_commit('org-id'),
        data: {
          commit_message: 'My Commit',
          ignored: {},
          changes: defaultChangeset,
          target_directory: 'src',
        },
        hasForm: true,
        shouldSubscribeToObject: false,
      });
    });
  });

  describe('form error', () => {
    test.each([
      ['target_directory', 'Select the location to retrieve changes', true],
      ['changes', 'Select the changes to retrieve or ignore', true],
      ['commit_message', 'Describe the changes you are retrieving', true],
      ['foobar', 'Describe the changes you are retrieving', false],
    ])(
      'navigates to correct page to show error: %s',
      async (field, text, showsErr) => {
        createObject.mockReturnValueOnce(() =>
          // eslint-disable-next-line prefer-promise-reject-errors
          Promise.reject({
            body: {
              [field]: ['Do not do that'],
            },
            response: {
              status: 400,
            },
          }),
        );
        const { getByText, getByLabelText, findByText } = setup();
        // Click forward to the select-changes modal:
        fireEvent.click(getByText('Save & Next'));
        const selectAll = getByLabelText('Select All Changes');
        fireEvent.click(selectAll);
        // Click forward to the commit-message modal:
        fireEvent.click(getByText('Save & Next'));
        const commitInput = getByLabelText('*Commit Message', { exact: false });
        const submit = getByText('Retrieve Selected Changes');
        fireEvent.change(commitInput, { target: { value: 'My Commit' } });
        fireEvent.click(submit);

        expect.assertions(showsErr ? 2 : 1);
        await findByText(text);

        expect(getByText(text)).toBeVisible();
        if (showsErr) {
          expect(getByText('Do not do that')).toBeVisible();
        }
      },
    );
  });

  describe('select changes', () => {
    let getters, selectAll, group1, inputs;

    beforeEach(() => {
      getters = setup();
      const { getByLabelText, getByText } = getters;
      fireEvent.click(getByText('Save & Next'));
      selectAll = getByLabelText('Select All Changes');
      group1 = getByLabelText('Buz');
      inputs = [
        getByLabelText('Bar'),
        getByLabelText('Baz'),
        getByLabelText('Bing'),
      ];
    });

    describe('select-all/none', () => {
      test('selects/deselects all items', () => {
        fireEvent.click(selectAll);

        expect(inputs[0].checked).toBe(true);
        expect(inputs[1].checked).toBe(true);
        expect(inputs[2].checked).toBe(true);

        fireEvent.click(selectAll);

        expect(inputs[0].checked).toBe(false);
        expect(inputs[1].checked).toBe(false);
        expect(inputs[2].checked).toBe(false);
      });
    });

    describe('select/deselect-group', () => {
      test('selects/deselects all items in group', () => {
        fireEvent.click(group1);

        expect(inputs[0].checked).toBe(false);
        expect(inputs[1].checked).toBe(true);
        expect(inputs[2].checked).toBe(true);

        fireEvent.click(group1);

        expect(inputs[0].checked).toBe(false);
        expect(inputs[1].checked).toBe(false);
        expect(inputs[2].checked).toBe(false);
      });
    });

    describe('select/deselect-item', () => {
      test('selects/deselects item', () => {
        fireEvent.click(inputs[1]);

        expect(inputs[0].checked).toBe(false);
        expect(inputs[1].checked).toBe(true);
        expect(inputs[2].checked).toBe(false);

        fireEvent.click(inputs[2]);

        expect(inputs[0].checked).toBe(false);
        expect(inputs[1].checked).toBe(true);
        expect(inputs[2].checked).toBe(true);

        fireEvent.click(inputs[2]);

        expect(inputs[0].checked).toBe(false);
        expect(inputs[1].checked).toBe(true);
        expect(inputs[2].checked).toBe(false);
      });
    });

    describe('accordion panel click', () => {
      test('expands/collapses', () => {
        const { baseElement, getByTitle } = getters;
        const content = baseElement.querySelector('.slds-accordion__content');

        expect(content).toHaveAttribute('aria-hidden', 'true');

        fireEvent.click(getByTitle('Buz'));

        expect(content).toHaveAttribute('aria-hidden', 'false');
      });
    });
  });

  describe('commit message', () => {
    let getters;

    beforeEach(() => {
      getters = setup();
      const { getByLabelText, getByText } = getters;
      fireEvent.click(getByText('Save & Next'));
      fireEvent.click(getByLabelText('Select All Changes'));
      fireEvent.click(getByText('Save & Next'));
    });

    describe('accordion panel click', () => {
      test('expands/collapses', () => {
        const { baseElement, getByTitle } = getters;
        const content = baseElement.querySelector('.slds-accordion__content');

        expect(content).toHaveAttribute('aria-hidden', 'true');

        fireEvent.click(getByTitle('Buz'));

        expect(content).toHaveAttribute('aria-hidden', 'false');
      });
    });
  });
});
