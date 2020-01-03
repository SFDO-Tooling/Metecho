import { useForm } from '@/components/utils';
import { createObject } from '@/store/actions';

import { renderHookWithRedux } from './../../utils';

jest.mock('@/store/actions');

createObject.mockReturnValue(() =>
  Promise.resolve({ type: 'TEST', payload: {} }),
);

afterEach(() => {
  createObject.mockClear();
});

describe('useForm', () => {
  test('creates a new object', () => {
    const { result } = renderHookWithRedux(() =>
      useForm({ fields: { testing: '' }, objectType: 'test-type' }),
    );
    result.current.handleSubmit({ preventDefault: jest.fn() });

    expect(createObject).toHaveBeenCalledWith({
      objectType: 'test-type',
      data: {
        testing: '',
      },
      hasForm: true,
    });
  });
});
