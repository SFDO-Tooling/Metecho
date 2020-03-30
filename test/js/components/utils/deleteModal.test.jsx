import { fireEvent } from '@testing-library/react';
import React from 'react';

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
    };
    const opts = Object.assign({}, defaults, options);
    const closeDeleteModal = jest.fn();
    return renderWithRedux(
      <DeleteModal {...opts} isOpen handleClose={closeDeleteModal} />,
      {},
      storeWithThunk,
      opts.rerender,
      opts.store,
    );
  };
  test('deletes project', () => {
    const { getByText } = setup();

    fireEvent.click(getByText('Delete'));

    expect(deleteObject).toHaveBeenCalledTimes(1);
    expect(deleteObject).toHaveBeenCalledWith({
      objectType: 'project',
      object: defaultProject,
    });
  });
});
