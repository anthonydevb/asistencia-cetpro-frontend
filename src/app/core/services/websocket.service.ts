import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | null = null;
  private connected$ = new BehaviorSubject<boolean>(false);
  private readonly serverUrl = environment.apiUrl;

  constructor() {
    this.connect();
  }

  // Conectar al servidor WebSocket
  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ Conectado al servidor WebSocket');
      this.connected$.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Desconectado del servidor WebSocket');
      this.connected$.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión WebSocket:', error);
      this.connected$.next(false);
    });
  }

  // Desconectar del servidor
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected$.next(false);
    }
  }

  // Obtener estado de conexión
  isConnected(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  // Escuchar eventos de profesores
  onProfessorCreated(): Observable<any> {
    return new Observable(observer => {
      if (!this.socket) {
        this.connect();
      }
      this.socket!.on('professor:created', (data) => {
        observer.next(data);
      });
      return () => {
        this.socket?.off('professor:created');
      };
    });
  }

  onProfessorUpdated(): Observable<any> {
    return new Observable(observer => {
      if (!this.socket) {
        this.connect();
      }
      this.socket!.on('professor:updated', (data) => {
        observer.next(data);
      });
      return () => {
        this.socket?.off('professor:updated');
      };
    });
  }

  onProfessorDeleted(): Observable<any> {
    return new Observable(observer => {
      if (!this.socket) {
        this.connect();
      }
      this.socket!.on('professor:deleted', (data) => {
        observer.next(data);
      });
      return () => {
        this.socket?.off('professor:deleted');
      };
    });
  }

  onProfessorsListUpdated(): Observable<void> {
    return new Observable(observer => {
      if (!this.socket) {
        this.connect();
      }
      this.socket!.on('professors:list-updated', () => {
        observer.next();
      });
      return () => {
        this.socket?.off('professors:list-updated');
      };
    });
  }

  // Escuchar eventos de asistencias
  onAttendanceCreated(): Observable<any> {
    return new Observable(observer => {
      if (!this.socket) {
        this.connect();
      }
      this.socket!.on('attendance:created', (data) => {
        observer.next(data);
      });
      return () => {
        this.socket?.off('attendance:created');
      };
    });
  }

  onAttendanceUpdated(): Observable<any> {
    return new Observable(observer => {
      if (!this.socket) {
        this.connect();
      }
      this.socket!.on('attendance:updated', (data) => {
        observer.next(data);
      });
      return () => {
        this.socket?.off('attendance:updated');
      };
    });
  }

  onAttendancesListUpdated(): Observable<void> {
    return new Observable(observer => {
      if (!this.socket) {
        this.connect();
      }
      this.socket!.on('attendances:list-updated', () => {
        observer.next();
      });
      return () => {
        this.socket?.off('attendances:list-updated');
      };
    });
  }

  // Escuchar eventos de notificaciones
  onNotificationCreated(): Observable<any> {
    return new Observable(observer => {
      if (!this.socket) {
        this.connect();
      }
      this.socket!.on('notification:created', (data) => {
        observer.next(data);
      });
      return () => {
        this.socket?.off('notification:created');
      };
    });
  }
}

