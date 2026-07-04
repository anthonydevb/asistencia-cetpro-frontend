import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, Subscription } from 'rxjs';
import { switchMap, tap, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../environment/environment';
export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
  MESSAGE = 'message',
  REMINDER = 'reminder',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface Notification {
  id: number;
  destinatario: {
    id: number;
    name: string;
    email: string;
  };
  tipo: NotificationType;
  titulo: string;
  mensaje: string;
  leido: boolean;
  fecha_envio: Date;
  prioridad: NotificationPriority;
  remitente?: {
    id: number;
    name: string;
    email: string;
  };
  fecha_leido?: Date;
}

export interface CreateNotificationDto {
  destinatarioId: number;
  tipo?: NotificationType;
  titulo: string;
  mensaje: string;
  prioridad?: NotificationPriority;
  remitenteId?: number;
}

export interface SendBulkNotificationDto {
  destinatariosIds: number[];
  tipo?: NotificationType;
  titulo: string;
  mensaje: string;
  prioridad?: NotificationPriority;
  remitenteId?: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private apiUrl = `${environment.apiUrl}/notifications`;
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private pollingSubscription: Subscription | null = null;

  unreadCount$ = this.unreadCountSubject.asObservable();
  notifications$ = this.notificationsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Iniciar polling de notificaciones
  startPolling(userId: number, intervalMs: number = 30000): void {
    // Detener polling anterior si existe
    this.stopPolling();

    // Cargar inmediatamente
    this.loadNotifications(userId);

    // Iniciar polling
    this.pollingSubscription = interval(intervalMs)
      .pipe(
        switchMap(() => this.getNotificationsByUser(userId))
      )
      .subscribe(notifications => {
        this.updateNotifications(notifications);
      });
  }

  // Detener polling
  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  // Cargar notificaciones
  loadNotifications(userId: number): void {
    this.getNotificationsByUser(userId).subscribe(notifications => {
      this.updateNotifications(notifications);
    });
  }

  // Actualizar notificaciones solo si han cambiado
  private updateNotifications(notifications: Notification[]): void {
    const currentNotifications = this.notificationsSubject.value;
    
    // Normalizar fechas
    const normalizedNotifications = notifications.map(notif => ({
      ...notif,
      fecha_envio: notif.fecha_envio instanceof Date 
        ? notif.fecha_envio 
        : new Date(notif.fecha_envio),
      fecha_leido: notif.fecha_leido 
        ? (notif.fecha_leido instanceof Date 
          ? notif.fecha_leido 
          : new Date(notif.fecha_leido))
        : undefined
    }));

    // Comparar si realmente cambiaron (por IDs y estado leído)
    const hasChanged = 
      currentNotifications.length !== normalizedNotifications.length ||
      normalizedNotifications.some((notif, index) => {
        const current = currentNotifications[index];
        return !current || 
               current.id !== notif.id || 
               current.leido !== notif.leido;
      });

    // Solo actualizar si hay cambios
    if (hasChanged || currentNotifications.length === 0) {
      this.notificationsSubject.next(normalizedNotifications);
      const unreadCount = normalizedNotifications.filter(n => !n.leido).length;
      const currentUnreadCount = this.unreadCountSubject.value;
      
      // Solo actualizar el contador si cambió
      if (unreadCount !== currentUnreadCount) {
        this.unreadCountSubject.next(unreadCount);
      }
    }
  }

  // Crear una notificación individual
  create(dto: CreateNotificationDto): Observable<Notification> {
    return this.http.post<Notification>(this.apiUrl, dto);
  }

  // Enviar notificación a múltiples usuarios
  sendBulk(dto: SendBulkNotificationDto): Observable<Notification[]> {
    return this.http.post<Notification[]>(`${this.apiUrl}/bulk`, dto);
  }

  // Obtener todas las notificaciones (admin)
  getAll(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.apiUrl);
  }

  // Obtener notificaciones de un usuario
  getNotificationsByUser(
    userId: number,
    unreadOnly: boolean = false
  ): Observable<Notification[]> {
    const options = unreadOnly ? { params: { unreadOnly: 'true' } } : {};
    return this.http.get<Notification[]>(
      `${this.apiUrl}/user/${userId}`,
      options
    );
  }

  // Obtener conteo de no leídas
  getUnreadCount(userId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/user/${userId}/unread-count`);
  }

  // Marcar como leída
  markAsRead(notificationId: number, userId: number): Observable<Notification> {
    return this.http.patch<Notification>(
      `${this.apiUrl}/${notificationId}/read/${userId}`,
      {}
    ).pipe(
      tap(() => {
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.map(n =>
          n.id === notificationId ? { ...n, leido: true } : n
        );
        this.notificationsSubject.next(updatedNotifications);
        this.unreadCountSubject.next(
          updatedNotifications.filter(n => !n.leido).length
        );
      })
    );
  }

  // Marcar todas como leídas
  markAllAsRead(userId: number): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/user/${userId}/read-all`,
      {}
    ).pipe(
      tap(() => {
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.map(n => ({
          ...n,
          leido: true,
        }));
        this.notificationsSubject.next(updatedNotifications);
        this.unreadCountSubject.next(0);
      })
    );
  }

  // Eliminar una notificación
  remove(notificationId: number, userId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${notificationId}/user/${userId}`
    ).pipe(
      tap(() => {
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.filter(
          n => n.id !== notificationId
        );
        this.notificationsSubject.next(updatedNotifications);
        this.unreadCountSubject.next(
          updatedNotifications.filter(n => !n.leido).length
        );
      })
    );
  }

  // Eliminar todas las leídas
  removeAllRead(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/user/${userId}/read`).pipe(
      tap(() => {
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.filter(n => !n.leido);
        this.notificationsSubject.next(updatedNotifications);
      })
    );
  }
}

