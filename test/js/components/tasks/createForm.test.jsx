import { fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import TaskForm from '~js/components/tasks/createForm';
import { createObject } from '~js/store/actions';
import { refreshOrgConfigs } from '~js/store/epics/actions';
import { addError } from '~js/store/errors/actions';

import { renderWithRedux, storeWithThunk } from './../../utils';

jest.mock('~js/store/actions');
jest.mock('~js/store/errors/actions');
jest.mock('~js/store/epics/actions');

createObject.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);
addError.mockReturnValue({ type: 'TEST' });
refreshOrgConfigs.mockReturnValue(() => Promise.resolve({ type: 'TEST' }));

afterEach(() => {
  createObject.mockClear();
  addError.mockClear();
  refreshOrgConfigs.mockClear();
});

const defaultEpic = {
  id: 'p1',
  name: 'Epic 1',
  slug: 'epic-1',
  old_slugs: [],
  description: 'This is a test epic.',
  available_task_org_config_names: [
    { key: 'dev' },
    { key: 'qa', label: 'QA', description: 'This is a QA flow' },
    { key: 'release', description: 'This is a Release flow' },
  ],
};

describe('<TaskForm/>', () => {
  const setup = (options) => {
    const defaults = {
      epic: defaultEpic,
      isOpen: true,
      closeCreateModal: jest.fn(),
    };
    const opts = Object.assign({}, defaults, options);
    const { epic, isOpen } = opts;
    const closeCreateModal = jest.fn();
    return renderWithRedux(
      <MemoryRouter>
        <TaskForm
          epic={epic}
          isOpen={isOpen}
          closeCreateModal={closeCreateModal}
        />
      </MemoryRouter>,
      {},
      storeWithThunk,
    );
  };

  describe('refresh org types button click', () => {
    test('triggers refreshOrgConfigs actions', () => {
      const { getByText } = setup();
      const btn = getByText('refresh list of available org types');
      fireEvent.click(btn);

      expect(refreshOrgConfigs).toHaveBeenCalledWith('p1');
    });
  });

  describe('add a single task', () => {
    test('calls createObject with data', () => {
      const { getByText, getByLabelText } = setup();
      const submit = getByText('Add');
      const nameInput = getByLabelText('*Task Name');
      const descriptionInput = getByLabelText('Description');
      const radioInput = getByLabelText('QA - This is a QA flow');
      fireEvent.change(nameInput, { target: { value: 'Name of Task' } });
      fireEvent.change(descriptionInput, {
        target: { value: 'This is the description' },
      });
      fireEvent.click(radioInput);
      fireEvent.click(submit);

      expect(createObject).toHaveBeenCalledWith({
        objectType: 'task',
        data: {
          name: 'Name of Task',
          description: 'This is the description',
          epic: 'p1',
          org_config_name: 'qa',
        },
        hasForm: true,
        shouldSubscribeToObject: true,
      });
    });

    describe('error', () => {
      test('displays errors', async () => {
        createObject.mockReturnValueOnce(() =>
          // eslint-disable-next-line prefer-promise-reject-errors
          Promise.reject({
            body: {
              org_config_name: ['Do not do that'],
            },
            response: {
              status: 400,
            },
          }),
        );
        const { getByText, getByLabelText, findByText } = setup({
          epic: { ...defaultEpic, available_task_org_config_names: [] },
        });

        const submit = getByText('Add');
        const nameInput = getByLabelText('*Task Name');
        fireEvent.change(nameInput, { target: { value: 'Name of Task' } });
        fireEvent.click(submit);

        expect.assertions(1);
        await findByText('Do not do that');

        expect(getByText('Do not do that')).toBeVisible();
      });
    });
  });

  describe('add and create another task', () => {
    describe('success', () => {
      test('displays success message for 3 seconds', async () => {
        jest.useFakeTimers();
        createObject.mockReturnValueOnce(() =>
          Promise.resolve({
            type: 'CREATE_OBJECT_SUCCEEDED',
            payload: {
              objectType: 'task',
              object: {
                id: 'task1',
                slug: 'name-of-task',
                name: 'Name of Task',
                description: '',
                epic: 'p1',
              },
            },
          }),
        );
        const { getByText, getByLabelText, queryByText } = setup();
        const submit = getByText('Add & New');
        const nameInput = getByLabelText('*Task Name');
        fireEvent.change(nameInput, { target: { value: 'Name of Task' } });
        fireEvent.click(submit);

        expect.assertions(2);
        await createObject;

        expect(getByText('A task was successfully added.')).toBeVisible();

        jest.runAllTimers();

        expect(queryByText('A task was successfully added.')).toBeNull();
      });
    });
  });
});
