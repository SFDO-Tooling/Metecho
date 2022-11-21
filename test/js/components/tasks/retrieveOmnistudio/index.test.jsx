import { fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import RetrieveOmnistudioModal from '@/js/components/tasks/retrieveOmnistudio';
import { createObject } from '@/js/store/actions';

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

afterEach(() => {
  createObject.mockClear();
});

const defaultProps = {
  orgId: 'org-id',
  datasets: sampleDatasets,
  datasetErrors: [],
  schema: sampleDatasetSchema,
  fetchingDatasets: false,
};

describe('<RetrieveOmnistudioModal/>', () => {
  const setup = (options = {}) => {
    const props = Object.assign({}, defaultProps, options);
    const closeModal = jest.fn();
    const ui = (
      <MemoryRouter>
        <RetrieveOmnistudioModal isOpen closeModal={closeModal} {...props} />
      </MemoryRouter>
    );
    return {
      ...renderWithRedux(ui, {}, storeWithThunk),
      closeModal,
    };
  };

  describe('form submit', () => {
    test('creates a new commit', async () => {
      const { getByText, getByLabelText, findByText } = setup();

      expect(
        getByText('Describe the Omnistudio configuration you are retrieving.'),
      ).toBeVisible();

      const commitInput = getByLabelText('*Commit Message', { exact: false });
      fireEvent.change(commitInput, { target: { value: 'My Commit' } });

      const yamlInput = getByLabelText('*Jobfile YAML Path', { exact: false });
      fireEvent.change(yamlInput, { target: { value: 'jobfile.yaml' } });

      const submit = getByText('Retrieve Omnistudio Configuration');
      fireEvent.click(submit);

      await findByText('Retrieving Omnistudio Configuration…');

      expect(createObject).toHaveBeenCalledTimes(1);
      expect(createObject).toHaveBeenCalledWith({
        objectType: 'scratch_org_commit_omnistudio',
        url: window.api_urls.scratch_org_commit_omnistudio('org-id'),
        data: {
          yaml_path: 'jobfile.yaml',
          commit_message: 'My Commit',
        },
        hasForm: true,
        shouldSubscribeToObject: false,
      });
    });
  });
  describe('form close', () => {
    test('can close the form', () => {
      const { getByText, getByTitle, closeModal } = setup();

      expect(
        getByText('Describe the Omnistudio configuration you are retrieving.'),
      ).toBeVisible();

      fireEvent.click(getByTitle('Close'));

      expect(closeModal).toHaveBeenCalledTimes(1);
    });
  });

  describe('form error', () => {
    test.each([
      ['yaml_path', true],
      ['commit_message', true],
      ['foobar', false],
    ])('shows error: %s', async (field, showsErr) => {
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

      const commitInput = getByLabelText('*Commit Message', { exact: false });
      fireEvent.change(commitInput, { target: { value: 'My Commit' } });

      const yamlInput = getByLabelText('*Jobfile YAML Path', { exact: false });
      fireEvent.change(yamlInput, { target: { value: 'jobfile.yaml' } });

      const submit = getByText('Retrieve Omnistudio Configuration');
      fireEvent.click(submit);

      await findByText('Retrieving Omnistudio Configuration…');

      if (showsErr) {
        await findByText('Do not do that');
        // eslint-disable-next-line jest/no-conditional-expect
        expect(getByText('Do not do that')).toBeVisible();
      }
    });
  });
});
