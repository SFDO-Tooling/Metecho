export interface SocketConnected {
  type: 'SOCKET_CONNECTED';
}
export interface SocketDisconnected {
  type: 'SOCKET_DISCONNECTED';
}
export type SocketAction = SocketConnected | SocketDisconnected;

export const connectSocket = (): SocketConnected => ({
  type: 'SOCKET_CONNECTED',
});

export const disconnectSocket = (): SocketDisconnected => ({
  type: 'SOCKET_DISCONNECTED',
});
