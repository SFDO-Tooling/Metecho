import { fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import TaskForm from '@/components/tasks/createForm';
import { createObject } from '@/store/actions';
import { addError } from '@/store/errors/actions';

import { renderWithRedux, storeWithThunk } from './../../utils';

jest.mock('@/store/actions');
jest.mock('@/store/errors/actions');

createObject.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);
addError.mockReturnValue({ type: 'TEST' });

afterEach(() => {
  createObject.mockClear();
  addError.mockClear();
});

const defaultProject = {
  id: 'r1',
  name: 'Project 1',
  slug: 'project-1',
  old_slugs: [],
  description: 'This is a test project.',
};

describe('<TaskForm/>', () => {
  const setup = (options) => {
    const defaults = {
      project: defaultProject,
      startOpen: true,
    };
    const opts = Object.assign({}, defaults, options);
    const { project, startOpen } = opts;
    const { getByText, getByLabelText, queryByText } = renderWithRedux(
      <MemoryRouter>
        <TaskForm project={project} startOpen={startOpen} />
      </MemoryRouter>,
      {},
      storeWithThunk,
    );
    return { getByText, getByLabelText, queryByText };
  };

  describe('submit/close buttons', () => {
    test('toggle form open/closed', () => {
      const { getByText, queryByText } = setup({ startOpen: undefined });

      expect(queryByText('Close Form')).toBeNull();

      fireEvent.click(getByText('Add a Task'));

      expect(getByText('Close Form')).toBeVisible();
      expect(getByText('Create Task')).toBeVisible();
      expect(queryByText('Add a Task')).toBeNull();

      fireEvent.click(getByText('Close Form'));

      expect(queryByText('Close Form')).toBeNull();
      expect(getByText('Add a Task')).toBeVisible();
    });
  });

  describe('form submit', () => {
    test('creates a new task', () => {
      const { getByText, getByLabelText } = setup();
      const submit = getByText('Create Task');
      const nameInput = getByLabelText('*Task Name');
      const descriptionInput = getByLabelText('Description');
      const radioInput = getByLabelText('Release - ready for production');
      fireEvent.change(nameInput, { target: { value: 'Name of Task' } });
      fireEvent.change(descriptionInput, {
        target: { value: 'This is the description' },
      });
      fireEvent.click(radioInput);
      fireEvent.click(submit);

      expect(radioInput).toBeChecked();
      expect(createObject).toHaveBeenCalledWith({
        objectType: 'task',
        data: {
          name: 'Name of Task',
          description: 'This is the description',
          project: 'r1',
          flow_type: 'Release',
        },
        hasForm: true,
        shouldSubscribeToObject: true,
        url: undefined,
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
                project: 'r1',
              },
            },
          }),
        );
        const { getByText, getByLabelText, queryByText } = setup();
        const submit = getByText('Create Task');
        const nameInput = getByLabelText('*Task Name');
        fireEvent.change(nameInput, { target: { value: 'Name of Task' } });
        fireEvent.click(submit);

        expect.assertions(2);
        await createObject;

        expect(getByText('A task was successfully created.')).toBeVisible();

        jest.runAllTimers();

        expect(queryByText('A task was successfully created.')).toBeNull();
      });
    });
  });
});
