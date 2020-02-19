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
      useForm({
        fields: { testing: '', test: true },
        objectType: 'test-type',
      }),
    );
    result.current.handleSubmit({
      preventDefault: jest.fn(),
      target: { type: 'checkbox', checked: true },
    });

    expect(createObject).toHaveBeenCalledWith({
      objectType: 'test-type',
      data: {
        testing: '',
        test: true,
      },
      hasForm: true,
      shouldSubscribeToObject: true,
    });
  });
});
