import { fireEvent } from '@testing-library/react';
import React from 'react';

import { EditModal } from '@/js/components/utils';
import { updateObject } from '@/js/store/actions';

import {
  renderWithRedux,
  reRenderWithRedux,
  storeWithThunk,
} from './../../utils';

jest.mock('@/js/store/actions');

updateObject.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);

afterEach(() => {
  updateObject.mockClear();
});

const defaultEpic = {
  id: 'epic-id',
  name: 'Epic Name',
  description: 'Description of the epic',
};

describe('<EditModal />', () => {
  const setup = (options = {}) => {
    const defaults = {
      model: defaultEpic,
      modelType: 'epic',
    };
    const opts = Object.assign({}, defaults, options);
    const closeEditModal = jest.fn();
    const ui = <EditModal {...opts} isOpen handleClose={closeEditModal} />;
    if (opts.rerender) {
      return reRenderWithRedux(ui, opts.store, opts.rerender);
    }
    return renderWithRedux(ui, {}, storeWithThunk);
  };

  test('updates default fields on input', () => {
    const { store, rerender, getByLabelText } = setup();
    const nameInput = getByLabelText('*Epic Name');
    const descriptionInput = getByLabelText('Description');
    setup({
      model: {
        ...defaultEpic,
        name: 'New Epic Name',
      },
      rerender,
      store,
    });

    expect(nameInput.value).toEqual('New Epic Name');

    setup({
      model: {
        ...defaultEpic,
        name: 'New Epic Name',
        description: 'New description',
      },
      rerender,
      store,
    });

    expect(descriptionInput.value).toEqual('New description');
  });

  test('submit clicked', async () => {
    const { findByText, getByText, getByLabelText } = setup();
    const nameInput = getByLabelText('*Epic Name');
    const descriptionInput = getByLabelText('Description');
    const submit = getByText('Save');

    fireEvent.change(nameInput, { target: { value: 'New Epic Name' } });
    fireEvent.change(descriptionInput, {
      target: { value: 'New description' },
    });
    fireEvent.click(submit);

    expect.assertions(2);
    await findByText('Saving…');

    expect(updateObject).toHaveBeenCalledTimes(1);
    expect(updateObject).toHaveBeenCalledWith({
      objectType: 'epic',
      data: {
        name: 'New Epic Name',
        description: 'New description',
        id: 'epic-id',
      },
      hasForm: true,
    });
  });
});
