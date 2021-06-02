import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import CaptureModal from '~js/components/tasks/capture';
import { createObject, updateObject } from '~js/store/actions';

import {
  renderWithRedux,
  reRenderWithRedux,
  storeWithThunk,
} from '../../../utils';

jest.mock('~js/store/actions');

createObject.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);
updateObject.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);

afterEach(() => {
  createObject.mockClear();
  updateObject.mockClear();
});

const defaultChangeset = {
  Foo: ['Bar'],
  Buz: ['Baz', 'Bing'],
};

const defaultIgnored = {
  Bang: ['Bazinga'],
};

const defaultDirs = { config: ['foo/bar'], pre: ['buz/baz'] };

const defaultOrg = {
  id: 'org-id',
  unsaved_changes: defaultChangeset,
  ignored_changes: defaultIgnored,
  valid_target_directories: defaultDirs,
};

describe('<CaptureModal/>', () => {
  const setup = (options = {}) => {
    const defaults = {
      org: defaultOrg,
      rerender: false,
    };
    const opts = Object.assign({}, defaults, options);
    const closeModal = jest.fn();
    const ui = (
      <MemoryRouter>
        <CaptureModal org={opts.org} isOpen closeModal={closeModal} />
      </MemoryRouter>
    );
    if (opts.rerender) {
      return {
        ...reRenderWithRedux(ui, opts.store, opts.rerender),
        closeModal,
      };
    }
    return {
      ...renderWithRedux(ui, {}, storeWithThunk),
      closeModal,
    };
  };

  test('can navigate forward/back, close modal', () => {
    const { getByText, getByTitle, closeModal } = setup();

    expect(getByText('Select the location to retrieve changes')).toBeVisible();

    fireEvent.click(getByText('Save & Next'));

    expect(getByText('Select the changes to retrieve or ignore')).toBeVisible();

    fireEvent.click(getByText('Go Back'));

    expect(getByText('Select the location to retrieve changes')).toBeVisible();

    fireEvent.click(getByTitle('Close'));

    expect(closeModal).toHaveBeenCalledTimes(1);
  });

  test('updates default fields when props change', () => {
    const { getByLabelText, queryByLabelText, store, rerender } = setup({
      org: { ...defaultOrg, valid_target_directories: { source: ['src'] } },
    });

    expect(getByLabelText('src')).toBeChecked();
    expect(queryByLabelText('force-app')).toBeNull();

    setup({
      org: {
        ...defaultOrg,
        valid_target_directories: { source: ['force-app'] },
      },
      store,
      rerender,
    });

    expect(getByLabelText('force-app')).toBeChecked();
    expect(queryByLabelText('src')).toBeNull();
  });

  describe('form submit', () => {
    test('creates a new commit', async () => {
      const { findByText, getByText, getByLabelText } = setup();

      // Click forward to the select-changes modal:
      fireEvent.click(getByText('Save & Next'));

      const selectAll = getByLabelText('All Changes');
      fireEvent.click(selectAll);
      // Click forward to the commit-message modal:
      fireEvent.click(getByText('Save & Next'));

      const commitInput = getByLabelText('*Commit Message', { exact: false });
      const submit = getByText('Retrieve Selected Changes');
      fireEvent.change(commitInput, { target: { value: 'My Commit' } });
      fireEvent.click(submit);

      expect.assertions(2);
      await findByText('Retrieving Selected Changes…');

      expect(createObject).toHaveBeenCalledTimes(1);
      expect(createObject).toHaveBeenCalledWith({
        objectType: 'scratch_org_commit',
        url: window.api_urls.scratch_org_commit('org-id'),
        data: {
          commit_message: 'My Commit',
          changes: defaultChangeset,
          target_directory: 'src',
        },
        hasForm: true,
        shouldSubscribeToObject: false,
      });
    });
  });

  describe('form secondary submit', () => {
    test('updates ignored changes', async () => {
      const { findByText, getByText, getByLabelText } = setup();

      // Click forward to the select-changes modal:
      fireEvent.click(getByText('Save & Next'));

      const selectAll = getByLabelText('All Changes');
      fireEvent.click(selectAll);
      fireEvent.click(getByText('Ignore Selected Changes'));

      expect.assertions(3);
      await findByText('Saving Ignored Changes…');

      expect(createObject).not.toHaveBeenCalled();
      expect(updateObject).toHaveBeenCalledTimes(1);
      expect(updateObject).toHaveBeenCalledWith({
        objectType: 'scratch_org',
        url: window.api_urls.scratch_org_detail('org-id'),
        data: {
          ignored_changes_write: { ...defaultChangeset, ...defaultIgnored },
        },
        hasForm: true,
        patch: true,
      });
    });

    describe('success', () => {
      afterEach(() => {
        jest.useRealTimers();
      });

      test('displays success class for 3 seconds', async () => {
        jest.useFakeTimers('legacy');
        updateObject.mockReturnValueOnce(() => Promise.resolve({}));
        const { findByText, getByText, getByLabelText, baseElement } = setup();

        // Click forward to the select-changes modal:
        fireEvent.click(getByText('Save & Next'));

        const selectAll = getByLabelText('All Ignored Changes');
        fireEvent.click(selectAll);
        fireEvent.click(getByText('Un-ignore Selected Changes'));

        expect.assertions(3);
        await findByText('Saving Ignored Changes…');

        expect(updateObject).toHaveBeenCalledWith({
          objectType: 'scratch_org',
          url: window.api_urls.scratch_org_detail('org-id'),
          data: {
            ignored_changes_write: {},
          },
          hasForm: true,
          patch: true,
        });

        await updateObject;
        await waitFor(() =>
          expect(
            baseElement
              .querySelector('.accordion-no-padding')
              .classList.contains('success-highlight'),
          ).toBe(true),
        );

        jest.runAllTimers();
        await waitFor(() =>
          expect(
            baseElement
              .querySelector('.accordion-no-padding')
              .classList.contains('success-highlight'),
          ).toBe(false),
        );
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
        const selectAll = getByLabelText('All Changes');
        fireEvent.click(selectAll);
        // Click forward to the commit-message modal:
        fireEvent.click(getByText('Save & Next'));
        const commitInput = getByLabelText('*Commit Message', { exact: false });
        const submit = getByText('Retrieve Selected Changes');
        fireEvent.change(commitInput, { target: { value: 'My Commit' } });
        fireEvent.click(submit);

        expect.assertions(showsErr ? 2 : 1);
        await findByText('Retrieving Selected Changes…');
        await findByText(text);

        expect(getByText(text)).toBeVisible();
        if (showsErr) {
          // eslint-disable-next-line jest/no-conditional-expect
          expect(getByText('Do not do that')).toBeVisible();
        }
      },
    );
  });

  describe('select changes', () => {
    let getters, selectAll, selectAllIgnored, group1, group2, inputs;

    beforeEach(() => {
      getters = setup();
      const { getByLabelText, getByText } = getters;
      fireEvent.click(getByText('Save & Next'));
      selectAll = getByLabelText('All Changes');
      selectAllIgnored = getByLabelText('All Ignored Changes');
      group1 = getByLabelText('Buz');
      group2 = getByLabelText('Bang');
      inputs = [
        getByLabelText('Bar'),
        getByLabelText('Baz'),
        getByLabelText('Bing'),
        getByLabelText('Bazinga'),
      ];
    });

    describe('select-all/none', () => {
      test('selects/deselects all items', () => {
        fireEvent.click(selectAll);

        expect(inputs[0].checked).toBe(true);
        expect(inputs[1].checked).toBe(true);
        expect(inputs[2].checked).toBe(true);
        expect(inputs[3].checked).toBe(false);

        fireEvent.click(selectAllIgnored);

        expect(inputs[0].checked).toBe(true);
        expect(inputs[1].checked).toBe(true);
        expect(inputs[2].checked).toBe(true);
        expect(inputs[3].checked).toBe(true);

        fireEvent.click(selectAll);

        expect(inputs[0].checked).toBe(false);
        expect(inputs[1].checked).toBe(false);
        expect(inputs[2].checked).toBe(false);
        expect(inputs[3].checked).toBe(true);

        fireEvent.click(selectAllIgnored);

        expect(inputs[0].checked).toBe(false);
        expect(inputs[1].checked).toBe(false);
        expect(inputs[2].checked).toBe(false);
        expect(inputs[3].checked).toBe(false);
      });
    });

    describe('select/deselect-group', () => {
      test('selects/deselects all items in group', () => {
        fireEvent.click(group1);

        expect(inputs[0].checked).toBe(false);
        expect(inputs[1].checked).toBe(true);
        expect(inputs[2].checked).toBe(true);
        expect(inputs[3].checked).toBe(false);

        fireEvent.click(group2);

        expect(inputs[0].checked).toBe(false);
        expect(inputs[1].checked).toBe(true);
        expect(inputs[2].checked).toBe(true);
        expect(inputs[3].checked).toBe(true);

        fireEvent.click(group1);

        expect(inputs[0].checked).toBe(false);
        expect(inputs[1].checked).toBe(false);
        expect(inputs[2].checked).toBe(false);
        expect(inputs[3].checked).toBe(true);

        fireEvent.click(group2);

        expect(inputs[0].checked).toBe(false);
        expect(inputs[1].checked).toBe(false);
        expect(inputs[2].checked).toBe(false);
        expect(inputs[3].checked).toBe(false);
      });
    });

    describe('select/deselect-item', () => {
      test('selects/deselects item', () => {
        fireEvent.click(inputs[1]);

        expect(inputs[0].checked).toBe(false);
        expect(inputs[1].checked).toBe(true);
        expect(inputs[2].checked).toBe(false);
        expect(inputs[3].checked).toBe(false);

        fireEvent.click(inputs[2]);

        expect(inputs[0].checked).toBe(false);
        expect(inputs[1].checked).toBe(true);
        expect(inputs[2].checked).toBe(true);
        expect(inputs[3].checked).toBe(false);

        fireEvent.click(inputs[3]);

        expect(inputs[0].checked).toBe(false);
        expect(inputs[1].checked).toBe(true);
        expect(inputs[2].checked).toBe(true);
        expect(inputs[3].checked).toBe(true);

        fireEvent.click(inputs[2]);

        expect(inputs[0].checked).toBe(false);
        expect(inputs[1].checked).toBe(true);
        expect(inputs[2].checked).toBe(false);
        expect(inputs[3].checked).toBe(true);

        fireEvent.click(inputs[3]);

        expect(inputs[0].checked).toBe(false);
        expect(inputs[1].checked).toBe(true);
        expect(inputs[2].checked).toBe(false);
        expect(inputs[3].checked).toBe(false);
      });
    });

    describe('accordion panel click', () => {
      test('expands/collapses', () => {
        const { baseElement, getByTitle } = getters;
        const panels = baseElement.querySelectorAll('.slds-accordion__content');

        expect(panels[0]).toHaveAttribute('aria-hidden', 'true');
        expect(panels[1]).toHaveAttribute('aria-hidden', 'true');
        expect(panels[2]).toHaveAttribute('aria-hidden', 'true');
        expect(panels[3]).toHaveAttribute('aria-hidden', 'true');

        fireEvent.click(getByTitle('Buz'));

        expect(panels[0]).toHaveAttribute('aria-hidden', 'false');
        expect(panels[1]).toHaveAttribute('aria-hidden', 'true');
        expect(panels[2]).toHaveAttribute('aria-hidden', 'true');
        expect(panels[3]).toHaveAttribute('aria-hidden', 'true');

        fireEvent.click(getByTitle('Bang'));

        expect(panels[0]).toHaveAttribute('aria-hidden', 'false');
        expect(panels[1]).toHaveAttribute('aria-hidden', 'true');
        expect(panels[2]).toHaveAttribute('aria-hidden', 'true');
        expect(panels[3]).toHaveAttribute('aria-hidden', 'false');

        fireEvent.click(getByTitle('All Ignored Changes'));

        expect(panels[0]).toHaveAttribute('aria-hidden', 'false');
        expect(panels[1]).toHaveAttribute('aria-hidden', 'true');
        expect(panels[2]).toHaveAttribute('aria-hidden', 'false');
        expect(panels[3]).toHaveAttribute('aria-hidden', 'false');
      });
    });
  });

  describe('commit message', () => {
    let getters;

    beforeEach(() => {
      getters = setup();
      const { getByLabelText, getByText } = getters;
      fireEvent.click(getByText('Save & Next'));
      fireEvent.click(getByLabelText('All Changes'));
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
