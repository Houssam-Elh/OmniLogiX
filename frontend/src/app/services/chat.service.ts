import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';

export interface ChatMessage {
  sender: string;
  message: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private socket: Socket;
  private messageSubject = new Subject<ChatMessage>();

  constructor() {
    this.socket = io('http://localhost:5000', { transports: ['websocket', 'polling'] });

    this.socket.on('receive_message', (data: ChatMessage) => {
      this.messageSubject.next(data);
    });
  }

  joinRoom(roomId: string): void {
    this.socket.emit('join_room', roomId);
  }

  sendMessage(roomId: string, sender: string, message: string): void {
    this.socket.emit('send_message', {
      roomId, sender, message,
      timestamp: new Date().toISOString()
    });
  }

  getMessages(): Observable<ChatMessage> {
    return this.messageSubject.asObservable();
  }

  ngOnDestroy(): void {
    this.socket.disconnect();
  }
}
