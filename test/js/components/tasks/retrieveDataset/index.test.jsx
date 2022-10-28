import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import RetrieveDatasetModal from '@/js/components/tasks/retrieveDataset';
import { createObject } from '@/js/store/actions';
import { refreshDatasets } from '@/js/store/orgs/actions';

import {
  sampleDatasets,
  sampleDatasetSchema,
} from '../../../../../src/stories/fixtures';
import { renderWithRedux, storeWithThunk } from '../../../utils';

jest.mock('@/js/store/actions');
jest.mock('@/js/store/orgs/actions');

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

const defaultProps = {
  orgId: 'org-id',
  datasets: sampleDatasets,
  datasetErrors: [],
  schema: sampleDatasetSchema,
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
        schema: undefined,
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

  describe('has errors', () => {
    test('displays errors', () => {
      const { getByText } = setup({
        datasetErrors: ['this error', 'that error'],
      });

      expect(getByText('this error')).toBeVisible();
      expect(getByText('that error')).toBeVisible();
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

      const checkbox = getByLabelText('Apex Class');
      fireEvent.click(checkbox);
      // Click forward to the commit-message modal:
      fireEvent.click(getByText('Save & Next'));

      const commitInput = getByLabelText('*Commit Message', { exact: false });
      fireEvent.change(commitInput, { target: { value: 'My Commit' } });
      const submit = getByText('Retrieve Selected Data');
      fireEvent.click(submit);

      expect.assertions(2);
      await findByText('Retrieving Selected Data…');

      expect(createObject).toHaveBeenCalledTimes(1);
      expect(createObject).toHaveBeenCalledWith({
        objectType: 'scratch_org_commit_dataset',
        url: window.api_urls.scratch_org_commit_dataset('org-id'),
        data: {
          dataset_name: 'Default',
          commit_message: 'My Commit',
          dataset_definition: {
            ...sampleDatasets.Default,
            ApexClass: ['ApiVersion'],
          },
        },
        hasForm: true,
        shouldSubscribeToObject: false,
      });
    });
  });

  describe('form error', () => {
    test.each([
      ['dataset_name', 'Select the dataset to create or modify', true],
      ['dataset_definition', 'Select data to retrieve', true],
      ['commit_message', 'Describe the dataset you are retrieving', true],
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
        const checkbox = getByLabelText('Apex Class');
        fireEvent.click(checkbox);
        // Click forward to the commit-message modal:
        fireEvent.click(getByText('Save & Next'));
        const commitInput = getByLabelText('*Commit Message', { exact: false });
        fireEvent.change(commitInput, { target: { value: 'My Commit' } });
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

  describe('select changes', () => {
    let getters, group1, group2, inputs;

    beforeEach(() => {
      getters = setup();
      const { getByLabelText, getByText } = getters;
      fireEvent.click(getByLabelText('Default'));
      fireEvent.click(getByText('Save & Next'));
      group1 = getByLabelText('Account');
      group2 = getByLabelText('Apex Class');
      inputs = [
        getByLabelText('Foo Bar'),
        getByLabelText('Buz Baz'),
        getByLabelText('Api Version'),
        getByLabelText('Parent Account'),
      ];
    });

    describe('no selected items', () => {
      test('displays empty message', () => {
        fireEvent.click(group1);

        expect(getters.getByText('No data selected')).toBeVisible();
      });
    });

    describe('select/deselect-group', () => {
      test('selects/deselects all items in group', () => {
        expect(inputs[0].checked).toBe(true);
        expect(inputs[1].checked).toBe(true);
        expect(inputs[2].checked).toBe(false);

        fireEvent.click(group1);

        expect(inputs[0].checked).toBe(false);
        expect(inputs[1].checked).toBe(false);
        expect(inputs[2].checked).toBe(false);

        fireEvent.click(group2);

        expect(inputs[0].checked).toBe(false);
        expect(inputs[1].checked).toBe(false);
        expect(inputs[2].checked).toBe(true);

        fireEvent.click(group1);

        expect(inputs[0].checked).toBe(true);
        expect(inputs[1].checked).toBe(true);
        expect(inputs[2].checked).toBe(true);
      });
    });
  
    describe('select/lookup', () => {
      test('selects lookup targets', () => {
        expect(inputs[0].checked).toBe(true);
        expect(inputs[1].checked).toBe(true);
        expect(inputs[2].checked).toBe(false);

        fireEvent.click(group1);

        expect(inputs[0].checked).toBe(false);
        expect(inputs[1].checked).toBe(false);
        expect(inputs[2].checked).toBe(false);

        fireEvent.click(inputs[3]);

        expect(inputs[0].checked).toBe(true);
        expect(inputs[1].checked).toBe(true);
        expect(inputs[2].checked).toBe(false);
      });
    });

    describe('select/deselect-item', () => {
      test('selects/deselects item', () => {
        expect(inputs[0].checked).toBe(true);
        expect(inputs[1].checked).toBe(true);
        expect(inputs[2].checked).toBe(false);

        fireEvent.click(inputs[1]);

        expect(inputs[0].checked).toBe(true);
        expect(inputs[1].checked).toBe(false);
        expect(inputs[2].checked).toBe(false);

        fireEvent.click(inputs[2]);

        expect(inputs[0].checked).toBe(true);
        expect(inputs[1].checked).toBe(false);
        expect(inputs[2].checked).toBe(true);
      });
    });

    describe('accordion panel click', () => {
      test('expands/collapses', () => {
        const { baseElement, getByTitle } = getters;
        const panels = baseElement.querySelectorAll('.slds-accordion__content');

        expect(panels[0]).toHaveAttribute('aria-hidden', 'true');
        expect(panels[1]).toHaveAttribute('aria-hidden', 'true');

        fireEvent.click(getByTitle('Apex Class'));

        expect(panels[0]).toHaveAttribute('aria-hidden', 'true');
        expect(panels[1]).toHaveAttribute('aria-hidden', 'false');

        fireEvent.click(getByTitle('Apex Class'));

        expect(panels[0]).toHaveAttribute('aria-hidden', 'true');
        expect(panels[1]).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('has outdated schema items', () => {
    let getters;

    beforeEach(() => {
      getters = setup();
      const { getByLabelText, getByText } = getters;
      fireEvent.click(getByLabelText('Another Dataset'));
      fireEvent.click(getByText('Save & Next'));
    });

    test('displays items to remove', () => {
      const { baseElement, getAllByTitle, getByText } = getters;
      const content = baseElement.querySelector('.slds-accordion__content');

      expect(getByText('Existing Data To Remove')).toBeVisible();
      expect(getByText('Other')).toBeVisible();
      expect(getByText('OpenType')).toBeVisible();
      expect(content).toHaveAttribute('aria-hidden', 'true');

      fireEvent.click(getAllByTitle('Account')[0]);

      expect(content).toHaveAttribute('aria-hidden', 'false');
    });
  });

  describe('has more than 50 objects', () => {
    let getters;

    beforeEach(() => {
      const schema = Object.assign({}, sampleDatasetSchema);
      for (let idx = 1; idx < 55; idx = idx + 1) {
        const label = idx.toString();
        schema[label] = {
          label,
          count: 2,
          fields: {
            [`${label}-field`]: {
              label: `${label}-field`,
            },
          },
        };
      }
      getters = setup({ schema });
      const { getByLabelText, getByText } = getters;
      fireEvent.click(getByLabelText('Default'));
      fireEvent.click(getByText('Save & Next'));
    });

    test('displays truncated list', () => {
      const { getAllByText } = getters;

      expect(
        getAllByText('Only displaying the first 50 objects.', { exact: false }),
      ).toHaveLength(2);
    });
  });

  describe('search form', () => {
    let getters;

    beforeEach(() => {
      getters = setup();
      const { getByLabelText, getByText } = getters;
      fireEvent.click(getByLabelText('Default'));
      fireEvent.click(getByText('Save & Next'));
    });

    test('displays filtered list', async () => {
      const { getByText, getByLabelText, getAllByLabelText, queryByLabelText } =
        getters;

      expect(getByLabelText('Foo Bar')).toBeVisible();
      expect(getByLabelText('Buz Baz')).toBeVisible();
      expect(getByLabelText('Api Version')).toBeVisible();

      fireEvent.input(getAllByLabelText('Search for objects or fields')[0], {
        target: { value: 'ba' },
      });
      jest.runAllTimers();
      await waitFor(() => expect(queryByLabelText('Api Version')).toBeNull());

      expect(getByLabelText('Foo Bar')).toBeVisible();
      expect(getByLabelText('Buz Baz')).toBeVisible();
      expect(queryByLabelText('Api Version')).toBeNull();

      fireEvent.click(getByText('Clear'));

      expect(getByLabelText('Api Version')).toBeVisible();
    });

    test('can filter by entire object', async () => {
      const { getByLabelText, getAllByLabelText, queryByLabelText } = getters;

      expect(getByLabelText('Foo Bar')).toBeVisible();
      expect(getByLabelText('Buz Baz')).toBeVisible();
      expect(getByLabelText('Api Version')).toBeVisible();

      fireEvent.input(getAllByLabelText('Search for objects or fields')[0], {
        target: { value: 'apex' },
      });
      jest.runAllTimers();
      await waitFor(() => expect(queryByLabelText('Foo Bar')).toBeNull());

      expect(queryByLabelText('Foo Bar')).toBeNull();
      expect(queryByLabelText('Buz Baz')).toBeNull();
      expect(getByLabelText('Api Version')).toBeVisible();
    });
  });

  describe('commit message', () => {
    let getters;

    beforeEach(() => {
      getters = setup();
      const { getByLabelText, getByText } = getters;
      fireEvent.click(getByLabelText('Default'));
      fireEvent.click(getByText('Save & Next'));
      fireEvent.click(getByLabelText('Apex Class'));
      fireEvent.click(getByText('Save & Next'));
    });

    describe('accordion panel click', () => {
      test('expands/collapses', () => {
        const { baseElement, getByTitle } = getters;
        const content = baseElement.querySelector('.slds-accordion__content');

        expect(content).toHaveAttribute('aria-hidden', 'true');

        fireEvent.click(getByTitle('Account'));

        expect(content).toHaveAttribute('aria-hidden', 'false');
      });
    });
  });
});
