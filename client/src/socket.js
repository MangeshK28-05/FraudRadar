import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.PROD ? window.location.origin : 'http://localhost:3001';

const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  autoConnect: true,
});

export default socket;