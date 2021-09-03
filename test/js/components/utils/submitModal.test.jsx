import { fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { SubmitModal } from '@/js/components/utils';
import { createObject } from '@/js/store/actions';

import { renderWithRedux, storeWithThunk } from './../../utils';

jest.mock('@/js/store/actions');

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
      assignee: {
        id: 'user-id',
        login: 'userlogin',
        avatar_url: 'https://url.com',
      },
      originatingUser: 'anotherUser',
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
      const { getByText, getByTitle, toggleModal } = setup();

      expect(getByText('Submit this Task for testing')).toBeVisible();
      expect(getByTitle('Cancel')).toBeVisible();

      fireEvent.click(getByTitle('Cancel'));

      expect(toggleModal).toHaveBeenCalledTimes(1);
    });
  });

  describe('alert_assigned_qa avatar click', () => {
    test('toggles checkbox', () => {
      const { getByLabelText, getByTitle } = setup();

      expect(getByLabelText('Notify userlogin by email')).toBeChecked();

      fireEvent.click(getByTitle('userlogin'));

      expect(getByLabelText('Notify userlogin by email')).not.toBeChecked();
    });
  });

  describe('form submit', () => {
    test('creates a new task pr', async () => {
      const { findByText, getByText } = setup();
      const submit = getByText('Submit Task for Testing');
      fireEvent.click(submit);

      expect.assertions(2);
      await findByText('Submitting Task for Testing…');

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
          alert_assigned_qa: true,
        },
        hasForm: true,
        shouldSubscribeToObject: false,
      });
    });
  });
});
