import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomService } from './room.service';
import { QueueService } from '../queue/queue.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  namespace: '/',
  path: '/socket.io',
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private logger = new Logger('RoomGateway');

  constructor(
    private readonly roomService: RoomService,
    private readonly queueService: QueueService,
  ) {}

  // Handle user joining a room
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    client: Socket,
    payload: { roomId: string; userId: string },
  ) {
    try {
      // Join the socket room
      client.join(payload.roomId);

      // Get updated room details with members
      const room = await this.roomService.findOne(+payload.roomId);

      // Emit to all clients in the room
      this.server.to(payload.roomId).emit('roomUpdated', {
        type: 'userJoined',
        room: room,
      });

      this.logger.log(`User ${payload.userId} joined room ${payload.roomId}`);
    } catch (error) {
      this.logger.error(`Error handling join room: ${error.message}`);
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  // Handle user leaving a room
  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    client: Socket,
    payload: { roomId: string; userId: string },
  ) {
    try {
      // Leave the socket room
      client.leave(payload.roomId);

      // Get updated room details with members
      const room = await this.roomService.findOne(+payload.roomId);

      // Emit to all clients in the room
      this.server.to(payload.roomId).emit('roomUpdated', {
        type: 'userLeft',
        room: room,
      });

      this.logger.log(`User ${payload.userId} left room ${payload.roomId}`);
    } catch (error) {
      this.logger.error(`Error handling leave room: ${error.message}`);
      client.emit('error', { message: 'Failed to leave room' });
    }
  }

  // Queue-related WebSocket events
  @SubscribeMessage('addToQueue')
  async handleAddToQueue(
    client: Socket,
    payload: { roomId: string; songId: number; userId: number },
  ) {
    try {
      const queueItem = await this.queueService.addToQueue(
        +payload.roomId,
        payload.songId,
        payload.userId,
      );

      // Broadcast to all clients in the room
      this.server.to(payload.roomId).emit('queueUpdated', {
        type: 'songAdded',
        queueItem,
      });

      this.logger.log(
        `Song ${payload.songId} added to queue in room ${payload.roomId}`,
      );
    } catch (error) {
      this.logger.error(`Error adding to queue: ${error.message}`);
      client.emit('error', { message: 'Failed to add song to queue' });
    }
  }

  @SubscribeMessage('removeFromQueue')
  async handleRemoveFromQueue(
    client: Socket,
    payload: { roomId: string; queueId: number; userId: number },
  ) {
    try {
      await this.queueService.removeFromQueue(
        +payload.roomId,
        payload.queueId,
        payload.userId,
      );

      // Broadcast to all clients in the room
      this.server.to(payload.roomId).emit('queueUpdated', {
        type: 'songRemoved',
        queueId: payload.queueId,
      });

      this.logger.log(
        `Song ${payload.queueId} removed from queue in room ${payload.roomId}`,
      );
    } catch (error) {
      this.logger.error(`Error removing from queue: ${error.message}`);
      client.emit('error', { message: 'Failed to remove song from queue' });
    }
  }

  @SubscribeMessage('moveInQueue')
  async handleMoveInQueue(
    client: Socket,
    payload: {
      roomId: string;
      queueId: number;
      newPosition: number;
      userId: number;
    },
  ) {
    try {
      const queue = await this.queueService.moveInQueue(
        +payload.roomId,
        payload.queueId,
        payload.newPosition,
        payload.userId,
      );

      // Broadcast to all clients in the room
      this.server.to(payload.roomId).emit('queueUpdated', {
        type: 'queueReordered',
        queue,
      });

      this.logger.log(
        `Queue reordered in room ${payload.roomId}`,
      );
    } catch (error) {
      this.logger.error(`Error moving in queue: ${error.message}`);
      client.emit('error', { message: 'Failed to move song in queue' });
    }
  }

  @SubscribeMessage('clearQueue')
  async handleClearQueue(
    client: Socket,
    payload: { roomId: string; userId: number },
  ) {
    try {
      await this.queueService.clearQueue(+payload.roomId, payload.userId);

      // Broadcast to all clients in the room
      this.server.to(payload.roomId).emit('queueUpdated', {
        type: 'queueCleared',
      });

      this.logger.log(`Queue cleared in room ${payload.roomId}`);
    } catch (error) {
      this.logger.error(`Error clearing queue: ${error.message}`);
      client.emit('error', { message: 'Failed to clear queue' });
    }
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
} 