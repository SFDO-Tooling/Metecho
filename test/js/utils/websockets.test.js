import Sockette from 'sockette';

import { connectSocket, disconnectSocket } from '@/store/socket/actions';
import * as sockets from '@/utils/websockets';

const mockJson = jest.fn();
const mockClose = jest.fn();
const mockOpen = jest.fn();
const dispatch = jest.fn();
jest.mock('sockette', () =>
  jest.fn().mockImplementation(() => ({
    json: mockJson,
    close: mockClose,
    open: mockOpen,
  })),
);

const opts = { url: '/my/url', dispatch };

afterEach(() => {
  Sockette.mockClear();
  mockJson.mockClear();
  mockClose.mockClear();
  mockOpen.mockClear();
  dispatch.mockClear();
});

describe('getAction', () => {
  // test('handles MY_ACTION_TYPE event', () => {
  //   const event = { type: 'MY_ACTION_TYPE', payload: 'foobar' };
  //   const expected = myActionCreator('foobar');
  //   const actual = sockets.getAction(event);

  //   expect(actual).toEqual(expected);
  // });

  test('handles unknown event', () => {
    const event = { type: 'UNKNOWN' };
    const expected = null;
    const actual = sockets.getAction(event);

    expect(actual).toEqual(expected);
  });

  test('handles unknown event without type', () => {
    const event = { foo: 'bar' };
    const expected = null;
    const actual = sockets.getAction(event);

    expect(actual).toEqual(expected);
  });
});

describe('createSocket', () => {
  test('creates socket with url', () => {
    sockets.createSocket(opts);

    expect(Sockette).toHaveBeenCalledTimes(1);
    expect(Sockette.mock.calls[0][0]).toEqual('/my/url');
  });

  describe('events', () => {
    let socket, socketInstance;

    beforeEach(() => {
      socket = sockets.createSocket(opts);
      socketInstance = Sockette.mock.calls[0][1];
    });

    describe('onopen', () => {
      test('logs', () => {
        socketInstance.onopen();

        expect(window.console.info).toHaveBeenCalledWith(
          '[WebSocket] connected',
        );
      });

      test('subscribes to pending objects', () => {
        const payload = { model: 'foo', id: 'bar' };
        socket.subscribe(payload);
        socketInstance.onopen();

        expect(mockJson).toHaveBeenCalledWith(payload);
      });

      test('dispatches connectSocket action', () => {
        socketInstance.onopen();
        const expected = connectSocket();

        expect(dispatch).toHaveBeenCalledWith(expected);
      });
    });

    describe('after reconnect', () => {
      test('logs', () => {
        socketInstance.onreconnect();
        socketInstance.onreconnect();
        socketInstance.onopen();

        expect(window.console.info).toHaveBeenCalledWith(
          '[WebSocket] reconnected',
        );
      });
    });

    describe('onmessage', () => {
      test('logs', () => {
        socketInstance.onmessage({});

        expect(window.console.info).toHaveBeenCalledWith(
          '[WebSocket] received:',
          undefined,
        );
      });

      // test('dispatches action', () => {
      //   socketInstance.onmessage({
      //     data: { type: 'MY_ACTION_TYPE' },
      //   });
      //   const expected = myActionCreator();

      //   expect(dispatch).toHaveBeenCalledWith(expected);
      // });
    });

    describe('onreconnect', () => {
      test('logs', () => {
        socketInstance.onreconnect();

        expect(window.console.info).toHaveBeenCalledWith(
          '[WebSocket] attempting to reconnect…',
        );
      });
    });

    describe('onmaximum', () => {
      test('logs', () => {
        socketInstance.onmaximum();

        expect(window.console.info).toHaveBeenCalledWith(
          '[WebSocket] ending reconnect after Infinity attempts',
        );
      });
    });

    describe('onclose', () => {
      test('logs', () => {
        socketInstance.onclose();

        expect(window.console.info).toHaveBeenCalledWith('[WebSocket] closed');
      });

      test('dispatches disconnectSocket action after 5 seconds', () => {
        jest.useFakeTimers();
        socketInstance.onopen();
        socketInstance.onclose();

        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 5000);

        jest.runAllTimers();
        const expected = disconnectSocket();

        expect(dispatch).toHaveBeenCalledWith(expected);

        setTimeout.mockClear();
        socketInstance.onclose();

        expect(setTimeout).not.toHaveBeenCalled();
      });

      test('does not dispatch disconnectSocket action if reconnected', () => {
        jest.useFakeTimers();
        socketInstance.onopen();
        socketInstance.onclose();
        socketInstance.onopen();
        jest.runAllTimers();
        const expected = disconnectSocket();

        expect(dispatch).not.toHaveBeenCalledWith(expected);
      });
    });

    describe('onerror', () => {
      test('logs', () => {
        socketInstance.onerror();

        expect(window.console.info).toHaveBeenCalledWith('[WebSocket] error');
      });
    });
  });

  describe('subscribe', () => {
    let socket;

    beforeEach(() => {
      socket = sockets.createSocket(opts);
    });

    describe('ws open', () => {
      test('subscribes to object', () => {
        const payload = { model: 'foo', id: 'bar' };
        Sockette.mock.calls[0][1].onopen();
        socket.subscribe(payload);

        expect(mockJson).toHaveBeenCalledWith(payload);
      });
    });
  });

  describe('reconnect', () => {
    let socket;

    beforeEach(() => {
      socket = sockets.createSocket(opts);
      jest.useFakeTimers();
    });

    test('closes and reopens ws connection', () => {
      Sockette.mock.calls[0][1].onopen();
      mockOpen.mockClear();
      socket.reconnect();

      expect(mockClose).toHaveBeenCalledWith(1000, 'user logged out');
      expect(mockOpen).not.toHaveBeenCalled();

      jest.advanceTimersByTime(750);

      expect(mockOpen).not.toHaveBeenCalled();

      Sockette.mock.calls[0][1].onclose();
      jest.advanceTimersByTime(500);

      expect(mockOpen).toHaveBeenCalledTimes(1);
    });
  });
});
