import * as logging from '@/utils/logging';

describe('logError', () => {
  describe('with Raven', () => {
    beforeEach(() => {
      window.Raven = {
        isSetup: () => true,
        captureException: jest.fn(),
        captureMessage: jest.fn(),
      };
    });

    afterEach(() => {
      Reflect.deleteProperty(window, 'Raven');
    });

    test('captures Error', () => {
      const err = new Error('foobar');
      logging.logError(err);

      expect(window.Raven.captureException).toHaveBeenCalledWith(err, {});
    });

    test('captures message', () => {
      const extra = { foo: 'bar' };
      logging.logError('foobar', extra);

      expect(window.Raven.captureMessage).toHaveBeenCalledWith('foobar', extra);
    });
  });

  test('logs error to console', () => {
    const extra = { foo: 'bar' };
    logging.logError('foobar', extra);

    expect(window.console.error).toHaveBeenCalledWith('foobar', extra);
  });
});

describe('log', () => {
  test('logs info to console', () => {
    logging.log('foobar');

    expect(window.console.info).toHaveBeenCalledWith('foobar');
  });
});
