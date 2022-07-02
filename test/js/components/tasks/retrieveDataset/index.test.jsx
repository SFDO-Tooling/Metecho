import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import RetrieveDatasetModal from '@/js/components/tasks/retrieveDataset';
import { createObject } from '@/js/store/actions';
import { refreshDatasets } from '@/js/store/tasks/actions';

import { renderWithRedux, storeWithThunk } from '../../../utils';

jest.mock('@/js/store/actions');
jest.mock('@/js/store/tasks/actions');

createObject.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);
refreshDatasets.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);

afterEach(() => {
  createObject.mockClear();
  refreshDatasets.mockClear();
});

// const defaultChangeset = {
//   Foo: ['Bar'],
//   Buz: ['Baz', 'Bing'],
// };

const defaultDatasets = { Default: [], 'Another Dataset': [] };

const defaultProps = {
  projectId: 'project-id',
  taskId: 'task-id',
  orgId: 'org-id',
  datasets: defaultDatasets,
  fetchingDatasets: false,
};

describe('<RetrieveDatasetModal/>', () => {
  const setup = (options = {}) => {
    const props = Object.assign({}, defaultProps, options);
    const closeModal = jest.fn();
    const ui = (
      <MemoryRouter>
        <RetrieveDatasetModal isOpen closeModal={closeModal} {...props} />
      </MemoryRouter>
    );
    return {
      ...renderWithRedux(ui, {}, storeWithThunk),
      closeModal,
    };
  };

  test('can navigate forward/back, close modal', () => {
    const { getByText, getByLabelText, getByTitle, closeModal } = setup();

    expect(getByText('Select the dataset to create or modify')).toBeVisible();

    fireEvent.click(getByLabelText('Default'));
    fireEvent.click(getByText('Save & Next'));

    expect(getByText('Select data to retrieve')).toBeVisible();

    fireEvent.click(getByText('Go Back'));

    expect(getByText('Select the dataset to create or modify')).toBeVisible();

    fireEvent.click(getByTitle('Close'));

    expect(closeModal).toHaveBeenCalledTimes(1);
  });

  describe('no datasets', () => {
    beforeEach(() => {
      setup({
        datasets: {},
      });
    });

    test('fetches datasets', async () => {
      await waitFor(() => expect(refreshDatasets).toHaveBeenCalledTimes(1));
    });
  });

  describe('fetching datasets', () => {
    test('displays loading indicator', () => {
      const { getByText } = setup({
        fetchingDatasets: true,
      });

      expect(getByText('Syncing Datasets…')).toBeVisible();
    });
  });

  describe('custom dataset', () => {
    test('cannot enter name of existing dataset', async () => {
      const { getByText, getByLabelText, findByPlaceholderText } = setup();
      fireEvent.click(getByLabelText('Create New Dataset'));
      const input = await findByPlaceholderText('Dataset name');

      expect(input).toHaveFocus();

      fireEvent.change(input, { target: { value: 'Default' } });

      expect(
        getByText('Dataset name cannot match existing dataset.'),
      ).toBeVisible();
    });
  });

  describe('form submit', () => {
    test('creates a new commit', async () => {
      const { findByText, getByText, getByLabelText } = setup();

      // Click forward to the select-changes modal:
      fireEvent.click(getByLabelText('Default'));
      fireEvent.click(getByText('Save & Next'));

      // const selectAll = getByLabelText('All Changes');
      // fireEvent.click(selectAll);
      // Click forward to the commit-message modal:
      fireEvent.click(getByText('Save & Next'));

      // const commitInput = getByLabelText('*Commit Message', { exact: false });
      // fireEvent.change(commitInput, { target: { value: 'My Commit' } });
      const submit = getByText('Retrieve Selected Data');
      fireEvent.click(submit);

      expect.assertions(2);
      await findByText('Retrieving Selected Data…');

      expect(createObject).toHaveBeenCalledTimes(1);
      expect(createObject).toHaveBeenCalledWith({
        objectType: 'scratch_org_commit',
        url: window.api_urls.scratch_org_commit('org-id'),
        data: {
          dataset: 'Default',
          commit_message: '',
          changes: {},
        },
        hasForm: true,
        shouldSubscribeToObject: false,
      });
    });
  });

  describe('form error', () => {
    test.each([
      ['dataset', 'Select the dataset to create or modify', true],
      ['changes', 'Select data to retrieve', false],
      ['commit_message', 'Describe the dataset you are retrieving', false],
      ['foobar', 'Describe the dataset you are retrieving', false],
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
        fireEvent.click(getByLabelText('Default'));
        fireEvent.click(getByText('Save & Next'));
        // const selectAll = getByLabelText('All Changes');
        // fireEvent.click(selectAll);
        // Click forward to the commit-message modal:
        fireEvent.click(getByText('Save & Next'));
        // const commitInput = getByLabelText('*Commit Message', { exact: false });
        // fireEvent.change(commitInput, { target: { value: 'My Commit' } });
        const submit = getByText('Retrieve Selected Data');
        fireEvent.click(submit);

        expect.assertions(showsErr ? 2 : 1);
        await findByText('Retrieving Selected Data…');
        await findByText(text);

        expect(getByText(text)).toBeVisible();
        if (showsErr) {
          await findByText('Do not do that');
          // eslint-disable-next-line jest/no-conditional-expect
          expect(getByText('Do not do that')).toBeVisible();
        }
      },
    );
  });

  // describe('select changes', () => {
  //   let getters, selectAll, selectAllIgnored, group1, group2, inputs;

  //   beforeEach(() => {
  //     getters = setup();
  //     const { getByLabelText, getByText } = getters;
  //     fireEvent.click(getByText('Save & Next'));
  //     selectAll = getByLabelText('All Changes');
  //     selectAllIgnored = getByLabelText('All Ignored Changes');
  //     group1 = getByLabelText('Buz');
  //     group2 = getByLabelText('Bang');
  //     inputs = [
  //       getByLabelText('Bar'),
  //       getByLabelText('Baz'),
  //       getByLabelText('Bing'),
  //       getByLabelText('Bazinga'),
  //     ];
  //   });

  //   describe('select-all/none', () => {
  //     test('selects/deselects all items', () => {
  //       fireEvent.click(selectAll);

  //       expect(inputs[0].checked).toBe(true);
  //       expect(inputs[1].checked).toBe(true);
  //       expect(inputs[2].checked).toBe(true);
  //       expect(inputs[3].checked).toBe(false);

  //       fireEvent.click(selectAllIgnored);

  //       expect(inputs[0].checked).toBe(true);
  //       expect(inputs[1].checked).toBe(true);
  //       expect(inputs[2].checked).toBe(true);
  //       expect(inputs[3].checked).toBe(true);

  //       fireEvent.click(selectAll);

  //       expect(inputs[0].checked).toBe(false);
  //       expect(inputs[1].checked).toBe(false);
  //       expect(inputs[2].checked).toBe(false);
  //       expect(inputs[3].checked).toBe(true);

  //       fireEvent.click(selectAllIgnored);

  //       expect(inputs[0].checked).toBe(false);
  //       expect(inputs[1].checked).toBe(false);
  //       expect(inputs[2].checked).toBe(false);
  //       expect(inputs[3].checked).toBe(false);
  //     });
  //   });

  //   describe('select/deselect-group', () => {
  //     test('selects/deselects all items in group', () => {
  //       fireEvent.click(group1);

  //       expect(inputs[0].checked).toBe(false);
  //       expect(inputs[1].checked).toBe(true);
  //       expect(inputs[2].checked).toBe(true);
  //       expect(inputs[3].checked).toBe(false);

  //       fireEvent.click(group2);

  //       expect(inputs[0].checked).toBe(false);
  //       expect(inputs[1].checked).toBe(true);
  //       expect(inputs[2].checked).toBe(true);
  //       expect(inputs[3].checked).toBe(true);

  //       fireEvent.click(group1);

  //       expect(inputs[0].checked).toBe(false);
  //       expect(inputs[1].checked).toBe(false);
  //       expect(inputs[2].checked).toBe(false);
  //       expect(inputs[3].checked).toBe(true);

  //       fireEvent.click(group2);

  //       expect(inputs[0].checked).toBe(false);
  //       expect(inputs[1].checked).toBe(false);
  //       expect(inputs[2].checked).toBe(false);
  //       expect(inputs[3].checked).toBe(false);
  //     });
  //   });

  //   describe('select/deselect-item', () => {
  //     test('selects/deselects item', () => {
  //       fireEvent.click(inputs[1]);

  //       expect(inputs[0].checked).toBe(false);
  //       expect(inputs[1].checked).toBe(true);
  //       expect(inputs[2].checked).toBe(false);
  //       expect(inputs[3].checked).toBe(false);

  //       fireEvent.click(inputs[2]);

  //       expect(inputs[0].checked).toBe(false);
  //       expect(inputs[1].checked).toBe(true);
  //       expect(inputs[2].checked).toBe(true);
  //       expect(inputs[3].checked).toBe(false);

  //       fireEvent.click(inputs[3]);

  //       expect(inputs[0].checked).toBe(false);
  //       expect(inputs[1].checked).toBe(true);
  //       expect(inputs[2].checked).toBe(true);
  //       expect(inputs[3].checked).toBe(true);

  //       fireEvent.click(inputs[2]);

  //       expect(inputs[0].checked).toBe(false);
  //       expect(inputs[1].checked).toBe(true);
  //       expect(inputs[2].checked).toBe(false);
  //       expect(inputs[3].checked).toBe(true);

  //       fireEvent.click(inputs[3]);

  //       expect(inputs[0].checked).toBe(false);
  //       expect(inputs[1].checked).toBe(true);
  //       expect(inputs[2].checked).toBe(false);
  //       expect(inputs[3].checked).toBe(false);
  //     });
  //   });

  //   describe('accordion panel click', () => {
  //     test('expands/collapses', () => {
  //       const { baseElement, getByTitle } = getters;
  //       const panels = baseElement.querySelectorAll('.slds-accordion__content');

  //       expect(panels[0]).toHaveAttribute('aria-hidden', 'true');
  //       expect(panels[1]).toHaveAttribute('aria-hidden', 'true');
  //       expect(panels[2]).toHaveAttribute('aria-hidden', 'true');
  //       expect(panels[3]).toHaveAttribute('aria-hidden', 'true');

  //       fireEvent.click(getByTitle('Buz'));

  //       expect(panels[0]).toHaveAttribute('aria-hidden', 'false');
  //       expect(panels[1]).toHaveAttribute('aria-hidden', 'true');
  //       expect(panels[2]).toHaveAttribute('aria-hidden', 'true');
  //       expect(panels[3]).toHaveAttribute('aria-hidden', 'true');

  //       fireEvent.click(getByTitle('Bang'));

  //       expect(panels[0]).toHaveAttribute('aria-hidden', 'false');
  //       expect(panels[1]).toHaveAttribute('aria-hidden', 'true');
  //       expect(panels[2]).toHaveAttribute('aria-hidden', 'true');
  //       expect(panels[3]).toHaveAttribute('aria-hidden', 'false');

  //       fireEvent.click(getByTitle('All Ignored Changes'));

  //       expect(panels[0]).toHaveAttribute('aria-hidden', 'false');
  //       expect(panels[1]).toHaveAttribute('aria-hidden', 'true');
  //       expect(panels[2]).toHaveAttribute('aria-hidden', 'false');
  //       expect(panels[3]).toHaveAttribute('aria-hidden', 'false');
  //     });
  //   });
  // });

  // describe('commit message', () => {
  //   let getters;

  //   beforeEach(() => {
  //     getters = setup();
  //     const { getByLabelText, getByText } = getters;
  //     fireEvent.click(getByText('Save & Next'));
  //     fireEvent.click(getByLabelText('All Changes'));
  //     fireEvent.click(getByText('Save & Next'));
  //   });

  //   describe('accordion panel click', () => {
  //     test('expands/collapses', () => {
  //       const { baseElement, getByTitle } = getters;
  //       const content = baseElement.querySelector('.slds-accordion__content');

  //       expect(content).toHaveAttribute('aria-hidden', 'true');

  //       fireEvent.click(getByTitle('Buz'));

  //       expect(content).toHaveAttribute('aria-hidden', 'false');
  //     });
  //   });
  // });
});
