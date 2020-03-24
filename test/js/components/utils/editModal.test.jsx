import { fireEvent } from '@testing-library/react';
import React from 'react';

import EditModal from '@/components/utils/editModal';
import { updateObject } from '@/store/actions';

import { renderWithRedux, storeWithThunk } from './../../utils';

jest.mock('@/store/actions');

updateObject.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);

afterEach(() => {
  updateObject.mockClear();
});

const defaultProject = {
  id: 'project-id',
  name: 'Project Name',
  description: 'Description of the project',
};

describe('<EditModal />', () => {
  const setup = (options = {}) => {
    const defaults = {
      model: defaultProject,
      instanceType: 'project',
    };
    const opts = Object.assign({}, defaults, options);
    const closeEditModal = jest.fn();
    return renderWithRedux(
      <EditModal {...opts} isOpen handleClose={closeEditModal} />,
      {},
      storeWithThunk,
      opts.rerender,
      opts.store,
    );
  };

  test('submit clicked', () => {
    const { getByText } = setup();
    const submit = getByText('Save');

    fireEvent.click(submit);

    expect(updateObject).toHaveBeenCalledTimes(1);
    expect(updateObject).toHaveBeenCalledWith({
      objectType: 'project',
      data: {
        name: 'Project Name',
        description: 'Description of the project',
        id: 'project-id',
      },
      hasForm: true,
      url: undefined,
    });
  });
});
