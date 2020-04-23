import { fireEvent } from '@testing-library/react';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import DeleteModal from '@/components/utils/deleteModal';
import { deleteObject } from '@/store/actions';

import { renderWithRedux, storeWithThunk } from './../../utils';

jest.mock('@/store/actions');

deleteObject.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);

afterEach(() => {
  deleteObject.mockClear();
});

const defaultProject = {
  id: 'project-id',
  name: 'Project Name',
  description: 'Description of the project',
};

describe('<DeleteModal />', () => {
  const setup = (options = {}) => {
    const defaults = {
      model: defaultProject,
      modelType: 'project',
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

  test('deletes project and redirects', async () => {
    const { getByText, context } = setup();

    fireEvent.click(getByText('Delete'));

    expect(deleteObject).toHaveBeenCalledTimes(1);
    expect(deleteObject).toHaveBeenCalledWith({
      objectType: 'project',
      object: defaultProject,
    });

    expect.assertions(4);
    await deleteObject;

    expect(context.action).toEqual('PUSH');
    expect(context.url).toEqual('/foo');
  });
});
