import { fireEvent } from '@testing-library/react';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

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
  'product-1': {
    id: 'p1',
    name: 'Product 1',
    slug: 'product-1',
    old_slugs: [],
    description: 'This is a test product.',
    repo_url: 'https://www.github.com/test/test-repo',
  },
};

describe('<TaskForm/>', () => {
  const setup = options => {
    const defaults = {
      project: defaultProject,
      startOpen: false,
    };
    const opts = Object.assign({}, defaults, options);
    const { product, startOpen } = opts;
    const context = {};
    const { debug, getByText, getByLabelText, queryByText } = renderWithRedux(
      <StaticRouter context={context}>
        <TaskForm product={product} startOpen={startOpen} />
      </StaticRouter>,
      {},
      storeWithThunk,
    );
    return { debug, getByText, getByLabelText, queryByText, context };
  };
  describe('submit and close buttons', () => {
    test('toggle form open/closed', () => {
      const { getByText, queryByText } = setup({ startOpen: undefined });

      expect(queryByText('Close Form')).toBeNull();

      fireEvent.click(getByText('Add a Task'));

      expect(getByText('Close Form')).toBeVisible();
      expect(getByText('Create Task')).toBeVisible();
      expect(queryByText('Create a Project')).toBeNull();

      fireEvent.click(getByText('Close Form'));

      expect(queryByText('Close Form')).toBeNull();
      expect(getByText('Add a Task')).toBeVisible();
    });
  });

  describe('form submit', () => {
    describe('success', () => {
      test('creates a new task', () => {
        const { getByText, getByLabelText } = setup({ startOpen: true });
        const submit = getByText('Create Task');
        const nameInput = getByLabelText('*Task Name');
        const descriptionInput = getByLabelText('Description');
        const assigneeInput = getByLabelText('Assign Team Member');
        fireEvent.change(nameInput, { target: { value: 'Name of Task' } });
        fireEvent.change(descriptionInput, {
          target: { value: 'This is the description' },
        });
        fireEvent.change(assigneeInput, { target: { value: '' } });
        fireEvent.click(submit);

        expect(createObject).toHaveBeenCalledWith({
          objectType: 'task',
          data: {
            name: 'Name of Task',
            description: 'This is the description',
            project: 'p1',
            assignee: '',
            product: 'product-1',
          },
        });
        expect(getByText('A task was successfully created')).toBeVisible();
      });

      test('resets field forms on success', () => {});
    });

    describe('error', () => {
      test('displays inline field errors', () => {});
    });
  });
});
