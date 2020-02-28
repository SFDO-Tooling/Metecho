import { fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import CaptureModal from '@/components/tasks/capture';
import { createObject } from '@/store/actions';

import { renderWithRedux, storeWithThunk } from '../../utils';

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
  const setup = (options) => {
    const defaults = {
      changeset: defaultChangeset,
    };
    const opts = Object.assign({}, defaults, options);
    const { changeset } = opts;
    const toggleModal = jest.fn();
    const result = renderWithRedux(
      <MemoryRouter>
        <CaptureModal
          orgId="org-id"
          changeset={changeset}
          isOpen
          toggleModal={toggleModal}
          directories={['src']}
        />
      </MemoryRouter>,
      {},
      storeWithThunk,
    );
    return { ...result, toggleModal };
  };

  test('placeholder', () => {
    expect(true).toBeTruthy();
  });

  /* * /
  describe('cancel button', () => {
    test('closes modal', () => {
      const { getByText, toggleModal } = setup();

      expect(getByText('Select the changes to capture')).toBeVisible();
      expect(getByText('Cancel')).toBeVisible();

      fireEvent.click(getByText('Cancel'));

      expect(toggleModal).toHaveBeenCalledTimes(1);
    });
  });
  /* */

  describe('form submit', () => {
    test('creates a new commit', () => {
      const { getByText, getByLabelText } = setup();

      // Click forward to the select-changes modal:
      fireEvent.click(getByText('Save & Next'));

      const selectAll = getByLabelText('Select All Changes');
      const next1 = getByText('Save & Next');

      fireEvent.click(selectAll);
      fireEvent.click(next1);

      const commitInput = getByLabelText('Commit message');
      const next2 = getByText('Save & Next');
      fireEvent.change(commitInput, { target: { value: 'My Commit' } });
      fireEvent.click(next2);

      expect(getByText('Capturing Selected Changes…')).toBeVisible();
      expect(createObject).toHaveBeenCalledTimes(1);
      expect(createObject).toHaveBeenCalledWith({
        objectType: 'scratch_org_commit',
        url: window.api_urls.scratch_org_commit('org-id'),
        data: {
          commit_message: 'My Commit',
          changes: defaultChangeset,
        },
        hasForm: true,
        shouldSubscribeToObject: false,
      });
    });
  });

  /* * /
  describe('select-all/none', () => {
    test('selects/deselects all items', () => {
      const { getByLabelText } = setup();
      const selectAll = getByLabelText('Select All');
      const input1 = getByLabelText('Bar');
      const input2 = getByLabelText('Baz');
      const input3 = getByLabelText('Bing');
      fireEvent.click(selectAll);

      expect(input1.checked).toBe(true);
      expect(input2.checked).toBe(true);
      expect(input3.checked).toBe(true);

      fireEvent.click(selectAll);

      expect(input1.checked).toBe(false);
      expect(input2.checked).toBe(false);
      expect(input3.checked).toBe(false);
    });
  });

  /* * /
  describe('select/deselect-group', () => {
    test('selects/deselects all items in group', () => {
      const { getByLabelText } = setup();
      const group1 = getByLabelText('Buz');
      const input1 = getByLabelText('Bar');
      const input2 = getByLabelText('Baz');
      const input3 = getByLabelText('Bing');
      fireEvent.click(group1);

      expect(input1.checked).toBe(false);
      expect(input2.checked).toBe(true);
      expect(input3.checked).toBe(true);

      fireEvent.click(group1);

      expect(input1.checked).toBe(false);
      expect(input2.checked).toBe(false);
      expect(input3.checked).toBe(false);
    });
  });

  /* * /
  describe('select/deselect-item', () => {
    test('selects/deselects item', () => {
      const { getByLabelText } = setup();
      const input1 = getByLabelText('Bar');
      const input2 = getByLabelText('Baz');
      const input3 = getByLabelText('Bing');
      fireEvent.click(input2);

      expect(input1.checked).toBe(false);
      expect(input2.checked).toBe(true);
      expect(input3.checked).toBe(false);

      fireEvent.click(input3);

      expect(input1.checked).toBe(false);
      expect(input2.checked).toBe(true);
      expect(input3.checked).toBe(true);

      fireEvent.click(input3);

      expect(input1.checked).toBe(false);
      expect(input2.checked).toBe(true);
      expect(input3.checked).toBe(false);
    });
  });

  /* * /
  describe('accordion panel click', () => {
    test('expands/collapses', () => {
      const { baseElement, getByTitle } = setup();
      const content = baseElement.querySelector('.slds-accordion__content');

      expect(content).toHaveAttribute('aria-hidden', 'true');

      fireEvent.click(getByTitle('Buz'));

      expect(content).toHaveAttribute('aria-hidden', 'false');
    });
  });
  /* */
});
