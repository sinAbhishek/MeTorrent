import { io, Socket } from "socket.io-client";

// Define the socket type explicitly
const socket: Socket = io("http://localhost:4000");

export default socket;
