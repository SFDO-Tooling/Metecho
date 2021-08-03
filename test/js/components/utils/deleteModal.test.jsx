import { fireEvent } from '@testing-library/react';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import { DeleteModal } from '@/js/components/utils';
import { deleteObject } from '@/js/store/actions';

import { renderWithRedux, storeWithThunk } from './../../utils';

jest.mock('@/js/store/actions');

deleteObject.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);

afterEach(() => {
  deleteObject.mockClear();
});

const defaultEpic = {
  id: 'epic-id',
  name: 'Epic Name',
  description: 'Description of the epic',
};

describe('<DeleteModal />', () => {
  const setup = (options = {}) => {
    const defaults = {
      model: defaultEpic,
      modelType: 'epic',
      redirect: '/foo',
    };
    const opts = Object.assign({}, defaults, options);
    const closeDeleteModal = jest.fn();
    const context = {};
    return {
      ...renderWithRedux(
        <StaticRouter context={context}>
          <DeleteModal {...opts} isOpen handleClose={closeDeleteModal} />
        </StaticRouter>,
        {},
        storeWithThunk,
      ),
      context,
    };
  };

  test('deletes epic and redirects', async () => {
    const { findByText, getByText, context } = setup();

    fireEvent.click(getByText('Delete'));

    expect.assertions(4);
    await findByText('Deleting…');

    expect(deleteObject).toHaveBeenCalledTimes(1);
    expect(deleteObject).toHaveBeenCalledWith({
      objectType: 'epic',
      object: defaultEpic,
    });
    expect(context.action).toEqual('PUSH');
    expect(context.url).toEqual('/foo');
  });
});
