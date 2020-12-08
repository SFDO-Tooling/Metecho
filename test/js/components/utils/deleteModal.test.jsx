import { fireEvent } from '@testing-library/react';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import { DeleteModal } from '@/components/utils';
import { deleteObject } from '@/store/actions';

import { renderWithRedux, storeWithThunk } from './../../utils';

jest.mock('@/store/actions');

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
    const { getByText, context } = setup();

    fireEvent.click(getByText('Delete'));

    expect(deleteObject).toHaveBeenCalledTimes(1);
    expect(deleteObject).toHaveBeenCalledWith({
      objectType: 'epic',
      object: defaultEpic,
    });

    expect.assertions(4);
    await deleteObject;

    expect(context.action).toEqual('PUSH');
    expect(context.url).toEqual('/foo');
  });
});
