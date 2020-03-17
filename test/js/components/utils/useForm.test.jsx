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
  describe('handleSubmit', () => {
    test('creates a new object', () => {
      const { result } = renderHookWithRedux(() =>
        useForm({
          fields: { testing: '' },
          objectType: 'test-type',
        }),
      );
      result.current.handleSubmit({
        preventDefault: jest.fn(),
      });

      expect(createObject).toHaveBeenCalledWith({
        objectType: 'test-type',
        data: {
          testing: '',
        },
        hasForm: true,
        shouldSubscribeToObject: true,
      });
    });
  });

  describe('handleInputChange', () => {
    test('updates input values', () => {
      const { result } = renderHookWithRedux(() =>
        useForm({
          fields: { test_input: '', test_checkbox: false },
          objectType: 'test-type',
        }),
      );
      result.current.handleInputChange({
        target: {
          name: 'test_input',
          value: 'foobar',
        },
      });
      result.current.handleInputChange({
        target: {
          name: 'test_checkbox',
          value: 'buzbaz',
          type: 'checkbox',
          checked: true,
        },
      });

      expect(result.current.inputs).toEqual({
        test_input: 'foobar',
        test_checkbox: true,
      });
    });
  });
});
