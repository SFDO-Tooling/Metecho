import * as logging from '@/utils/logging';

describe('logError', () => {
  describe('with Sentry', () => {
    let scope;

    beforeEach(() => {
      scope = {
        setExtras: jest.fn(),
      };
      window.Sentry = {
        withScope: cb => cb(scope),
        captureException: jest.fn(),
        captureMessage: jest.fn(),
      };
    });

    afterEach(() => {
      Reflect.deleteProperty(window, 'Sentry');
    });

    test('captures Error', () => {
      const err = new Error('foobar');
      logging.logError(err);

      expect(scope.setExtras).toHaveBeenCalledWith({});
      expect(window.Sentry.captureException).toHaveBeenCalledWith(err);
    });

    test('captures message', () => {
      const extra = { foo: 'bar' };
      logging.logError('foobar', extra);

      expect(scope.setExtras).toHaveBeenCalledWith(extra);
      expect(window.Sentry.captureMessage).toHaveBeenCalledWith('foobar');
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
