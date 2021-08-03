import { SocketAction } from '@/js/store/socket/actions';

export type Socket = boolean;

const reducer = (socket: Socket = false, action: SocketAction): Socket => {
  switch (action.type) {
    case 'SOCKET_DISCONNECTED':
      return false;
    case 'SOCKET_CONNECTED':
      return true;
  }
  return socket;
};

export default reducer;
