import { fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import TaskForm from '@/components/tasks/createForm';
import { createObject } from '@/store/actions';
import { addError } from '@/store/errors/actions';
import { refreshOrgConfigs } from '@/store/projects/actions';

import { renderWithRedux, storeWithThunk } from './../../utils';

jest.mock('@/store/actions');
jest.mock('@/store/errors/actions');
jest.mock('@/store/projects/actions');

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

const defaultProject = {
  id: 'p1',
  name: 'Project 1',
  slug: 'project-1',
  old_slugs: [],
  description: 'This is a test project.',
  available_task_org_config_names: [
    { key: 'dev' },
    { key: 'qa', label: 'QA', description: 'This is a QA flow' },
    { key: 'release', description: 'This is a Release flow' },
  ],
};

describe('<TaskForm/>', () => {
  const setup = (options) => {
    const defaults = {
      project: defaultProject,
      startOpen: true,
    };
    const opts = Object.assign({}, defaults, options);
    const { project, startOpen } = opts;
    return renderWithRedux(
      <MemoryRouter>
        <TaskForm project={project} startOpen={startOpen} />
      </MemoryRouter>,
      {},
      storeWithThunk,
    );
  };

  describe('submit/close buttons', () => {
    test('toggle form open/closed', () => {
      const { getByText, queryByText } = setup({
        startOpen: undefined,
        project: {
          ...defaultProject,
          currently_fetching_org_config_names: true,
        },
      });

      expect(queryByText('Close Form')).toBeNull();

      fireEvent.click(getByText('Add a Task'));

      expect(getByText('Close Form')).toBeVisible();
      expect(getByText('Add Task')).toBeVisible();
      expect(queryByText('Add a Task')).toBeNull();

      fireEvent.click(getByText('Close Form'));

      expect(queryByText('Close Form')).toBeNull();
      expect(getByText('Add a Task')).toBeVisible();
    });
  });

  describe('refresh org types button click', () => {
    test('triggers refreshOrgConfigs actions', () => {
      const { getByText } = setup();
      const btn = getByText('refresh list of available org types');
      fireEvent.click(btn);

      expect(refreshOrgConfigs).toHaveBeenCalledWith('p1');
    });
  });

  describe('form submit', () => {
    test('creates a new task', () => {
      const { getByText, getByLabelText } = setup();
      const submit = getByText('Add Task');
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
          project: 'p1',
          org_config_name: 'qa',
        },
        hasForm: true,
        shouldSubscribeToObject: true,
      });
    });

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
                project: 'p1',
              },
            },
          }),
        );
        const { getByText, getByLabelText, queryByText } = setup();
        const submit = getByText('Add Task');
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
          project: { ...defaultProject, available_task_org_config_names: [] },
        });
        const submit = getByText('Add Task');
        const nameInput = getByLabelText('*Task Name');
        fireEvent.change(nameInput, { target: { value: 'Name of Task' } });
        fireEvent.click(submit);

        expect.assertions(1);
        await findByText('Do not do that');

        expect(getByText('Do not do that')).toBeVisible();
      });
    });
  });
});
