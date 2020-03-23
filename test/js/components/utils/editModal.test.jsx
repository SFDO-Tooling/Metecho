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
      project: defaultProject,
    };
    const opts = Object.assign({}, defaults, options);
    const closeEditModal = jest.fn();
    return renderWithRedux(
      <EditModal project={opts.project} isOpen handleClose={closeEditModal} />,
      {},
      storeWithThunk,
      opts.rerender,
      opts.store,
    );
  };

  test('updates default fields on input', () => {
    const { store, rerender, getByLabelText } = setup();
    const nameInput = getByLabelText('*Project Name');
    const descriptionInput = getByLabelText('Description');
    setup({
      project: {
        ...defaultProject,
        name: 'New Project Name',
      },
      rerender,
      store,
    });

    expect(nameInput.value).toEqual('New Project Name');

    setup({
      project: {
        ...defaultProject,
        name: 'New Project Name',
        description: 'New description',
      },
      rerender,
      store,
    });

    expect(descriptionInput.value).toEqual('New description');
  });

  test('submit clicked', () => {
    const { getByText, getByLabelText } = setup();
    const nameInput = getByLabelText('*Project Name');
    const descriptionInput = getByLabelText('Description');
    const submit = getByText('Save');

    fireEvent.change(nameInput, { target: { value: 'New Project Name' } });
    fireEvent.change(descriptionInput, {
      target: { value: 'New description' },
    });
    fireEvent.click(submit);

    expect(updateObject).toHaveBeenCalledTimes(1);
    expect(updateObject).toHaveBeenCalledWith({
      objectType: 'project',
      data: {
        name: 'New Project Name',
        description: 'New description',
        id: 'project-id',
      },
      hasForm: true,
    });
  });
});
