import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomService } from './room.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  namespace: '/',
  path: '/socket.io'
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private logger = new Logger('RoomGateway');

  constructor(private readonly roomService: RoomService) {}

  // Handle user joining a room
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(client: Socket, payload: { roomId: string; userId: string }) {
    try {
      // Join the socket room
      client.join(payload.roomId);
      
      // Get updated room details with members
      const room = await this.roomService.findOne(+payload.roomId);
      
      // Emit to all clients in the room
      this.server.to(payload.roomId).emit('roomUpdated', {
        type: 'userJoined',
        room: room
      });
      
      this.logger.log(`User ${payload.userId} joined room ${payload.roomId}`);
    } catch (error) {
      this.logger.error(`Error handling join room: ${error.message}`);
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  // Handle user leaving a room
  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(client: Socket, payload: { roomId: string; userId: string }) {
    try {
      // Leave the socket room
      client.leave(payload.roomId);
      
      // Get updated room details with members
      const room = await this.roomService.findOne(+payload.roomId);
      
      // Emit to all clients in the room
      this.server.to(payload.roomId).emit('roomUpdated', {
        type: 'userLeft',
        room: room
      });
      
      this.logger.log(`User ${payload.userId} left room ${payload.roomId}`);
    } catch (error) {
      this.logger.error(`Error handling leave room: ${error.message}`);
      client.emit('error', { message: 'Failed to leave room' });
    }
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
} 