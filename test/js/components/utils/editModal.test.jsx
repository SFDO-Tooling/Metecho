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

describe('<EditModal />', () => {
  const project = {
    id: 'project-id',
    name: 'Project Name',
    description: 'Description of the project',
  };
  const setup = (options) => {
    const defaults = {
      project,
      rerender: false,
    };
    const opts = Object.assign({}, defaults, options);
    const closeEditModal = jest.fn();
    const result = renderWithRedux(
      <EditModal {...opts} isOpen handleClose={closeEditModal} />,
      {},
      storeWithThunk,
      opts.rerender,
      opts.store,
    );
    return { ...result, closeEditModal };
  };

  test('updates default fields on input', () => {
    const { store, rerender, getByLabelText } = setup();

    const nameInput = getByLabelText('*Project Name');
    const descriptionInput = getByLabelText('Description');

    fireEvent.change(nameInput, { target: { value: 'New Project Name' } });
    fireEvent.change(descriptionInput, {
      target: { value: 'New description' },
    });

    setup({
      project: { name: 'New Project Name', description: 'New description' },
      rerender,
      store,
    });

    expect(nameInput.value).toBe('New Project Name');
    expect(descriptionInput.value).toBe('New description');
  });

  test('submit clicked', () => {
    const { getByText } = setup();
    const submit = getByText('Save');

    fireEvent.click(submit);

    expect(updateObject).toHaveBeenCalledTimes(1);
    // expect(updateObject).toHaveBeenCalledWith({
    //   objectType: 'project',
    //   url: undefined,
    //   data: {
    //     name: 'Project Name',
    //     description: 'Description of the project',
    //     project: { id: 'project-id' },
    //   },
    //   hasForm: true,
    // });
  });
});
