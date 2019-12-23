import { fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import SubmitModal from '@/components/tasks/submit';
import { createObject } from '@/store/actions';

import { renderWithRedux, storeWithThunk } from './../../utils';

jest.mock('@/store/actions');

createObject.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);

afterEach(() => {
  createObject.mockClear();
});

describe('<SubmitModal/>', () => {
  const setup = (options) => {
    const defaults = {
      instanceId: 'task-id',
      instanceName: 'My Task',
      instanceDiffUrl: 'my-diff-url',
      instanceType: 'task',
    };
    const opts = Object.assign({}, defaults, options);
    const toggleModal = jest.fn();
    const result = renderWithRedux(
      <MemoryRouter>
        <SubmitModal {...opts} isOpen toggleModal={toggleModal} />
      </MemoryRouter>,
      {},
      storeWithThunk,
    );
    return { ...result, toggleModal };
  };

  describe('cancel button', () => {
    test('closes modal', () => {
      const { getByText, toggleModal } = setup();

      expect(getByText('Submit Task for Review')).toBeVisible();
      expect(getByText('Cancel')).toBeVisible();

      fireEvent.click(getByText('Cancel'));

      expect(toggleModal).toHaveBeenCalledTimes(1);
    });
  });

  describe('form submit', () => {
    test('creates a new task pr', () => {
      const { getByText } = setup();
      const submit = getByText('Submit Task for Review');
      fireEvent.click(submit);

      expect(getByText('Submitting Task for Review…')).toBeVisible();
      expect(createObject).toHaveBeenCalledTimes(1);
      expect(createObject).toHaveBeenCalledWith({
        objectType: 'task_pr',
        url: window.api_urls.task_create_pr('task-id'),
        data: {
          title: 'My Task',
          critical_changes: '',
          additional_changes: '',
          issues: '',
          notes: '',
        },
        hasForm: true,
      });
    });
  });
});
