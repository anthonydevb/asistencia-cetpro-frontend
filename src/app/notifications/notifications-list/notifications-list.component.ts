import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  Bell, Check, CheckCheck, Trash2, Filter, Search, X,
  AlertCircle, Info, CheckCircle, AlertTriangle,
  LucideAngularModule
} from 'lucide-angular';
import { NotificationsService, Notification, NotificationType } from '../notifications.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notifications-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './notifications-list.component.html',
  styleUrls: ['./notifications-list.component.scss'],
})
export class NotificationsListComponent implements OnInit, OnDestroy {
  readonly Bell = Bell;
  readonly Check = Check;
  readonly CheckCheck = CheckCheck;
  readonly Trash2 = Trash2;
  readonly Filter = Filter;
  readonly Search = Search;
  readonly X = X;
  readonly AlertCircle = AlertCircle;
  readonly Info = Info;
  readonly CheckCircle = CheckCircle;
  readonly AlertTriangle = AlertTriangle;

  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  
  filterType: string = 'all';
  searchText: string = '';
  showUnreadOnly: boolean = false;

  // Cache para evitar recálculos constantes
  unreadCount: number = 0;
  readCount: number = 0;
  
  // Cache para fechas formateadas
  private timeAgoCache: Map<number, string> = new Map();
  private fullDateCache: Map<number, string> = new Map();

  private subscriptions: Subscription[] = [];

  constructor(
    private notificationsService: NotificationsService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const userId = this.getUserId();
    if (userId) {
      this.notificationsService.loadNotifications(userId);

      this.subscriptions.push(
        this.notificationsService.notifications$.subscribe(notifications => {
          // Asegurar que las fechas sean objetos Date
          this.notifications = this.normalizeNotifications(notifications);
          this.updateCounts();
          this.clearDateCache();
          this.applyFilters();
          // Usar detectChanges para evitar ciclos infinitos
          this.cdr.markForCheck();
        })
      );
    }
  }
  
  // Normalizar notificaciones y convertir fechas
  private normalizeNotifications(notifications: Notification[]): Notification[] {
    return notifications.map(notif => ({
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
  }
  
  // Actualizar contadores sin usar getters
  private updateCounts(): void {
    this.unreadCount = this.notifications.filter(n => !n.leido).length;
    this.readCount = this.notifications.filter(n => n.leido).length;
  }
  
  // Limpiar cache de fechas cuando cambian las notificaciones
  private clearDateCache(): void {
    this.timeAgoCache.clear();
    this.fullDateCache.clear();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  getUserId(): number | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id;
    }
    return null;
  }

  applyFilters(): void {
    let filtered = [...this.notifications];

    // Filtrar por tipo
    if (this.filterType !== 'all') {
      filtered = filtered.filter(n => n.tipo === this.filterType);
    }

    // Filtrar solo no leídas
    if (this.showUnreadOnly) {
      filtered = filtered.filter(n => !n.leido);
    }

    // Filtrar por búsqueda
    if (this.searchText.trim()) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(
        n =>
          n.titulo?.toLowerCase().includes(search) ||
          n.mensaje?.toLowerCase().includes(search) ||
          (n.remitente?.name && n.remitente.name.toLowerCase().includes(search))
      );
    }

    this.filteredNotifications = filtered;
  }
  
  // TrackBy function para mejorar el rendimiento del *ngFor
  trackByNotificationId(index: number, notification: Notification): number {
    return notification.id;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  markAsRead(notification: Notification): void {
    const userId = this.getUserId();
    if (userId && !notification.leido) {
      this.notificationsService.markAsRead(notification.id, userId).subscribe({
        next: () => {
          // Actualizar el estado local inmediatamente
          notification.leido = true;
          this.updateCounts();
          this.applyFilters();
        },
        error: (err) => {
          console.error('Error al marcar como leída:', err);
        }
      });
    }
  }

  markAllAsRead(): void {
    const userId = this.getUserId();
    if (userId) {
      this.notificationsService.markAllAsRead(userId).subscribe({
        next: () => {
          // Actualizar el estado local inmediatamente
          this.notifications.forEach(n => n.leido = true);
          this.updateCounts();
          this.applyFilters();
        },
        error: (err) => {
          console.error('Error al marcar todas como leídas:', err);
        }
      });
    }
  }

  deleteNotification(notification: Notification): void {
    const userId = this.getUserId();
    if (userId) {
      if (confirm('¿Estás seguro de eliminar esta notificación?')) {
        this.notificationsService.remove(notification.id, userId).subscribe({
          next: () => {
            // La suscripción al observable ya actualiza la lista, pero por si acaso
            const index = this.notifications.findIndex(n => n.id === notification.id);
            if (index > -1) {
              this.notifications.splice(index, 1);
              this.updateCounts();
              this.applyFilters();
            }
          },
          error: (err) => {
            console.error('Error al eliminar notificación:', err);
          }
        });
      }
    }
  }

  deleteAllRead(): void {
    const userId = this.getUserId();
    if (userId) {
      if (confirm('¿Estás seguro de eliminar todas las notificaciones leídas?')) {
        this.notificationsService.removeAllRead(userId).subscribe({
          next: () => {
            // La suscripción al observable ya actualiza la lista
            this.notifications = this.notifications.filter(n => !n.leido);
            this.updateCounts();
            this.applyFilters();
          },
          error: (err) => {
            console.error('Error al eliminar notificaciones leídas:', err);
          }
        });
      }
    }
  }

  getNotificationIcon(tipo: NotificationType): any {
    switch (tipo) {
      case NotificationType.SUCCESS:
        return this.CheckCircle;
      case NotificationType.ERROR:
        return this.AlertCircle;
      case NotificationType.WARNING:
        return this.AlertTriangle;
      case NotificationType.INFO:
      default:
        return this.Info;
    }
  }

  getTimeAgo(date: Date | string): string {
    if (!date) return '';
    
    const notificationDate = date instanceof Date ? date : new Date(date);
    if (isNaN(notificationDate.getTime())) return '';
    
    // Usar cache si existe
    const cacheKey = notificationDate.getTime();
    if (this.timeAgoCache.has(cacheKey)) {
      return this.timeAgoCache.get(cacheKey)!;
    }
    
    const now = new Date();
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let result: string;
    if (diffMins < 1) {
      result = 'Ahora';
    } else if (diffMins < 60) {
      result = `Hace ${diffMins} minutos`;
    } else if (diffHours < 24) {
      result = `Hace ${diffHours} horas`;
    } else if (diffDays < 7) {
      result = `Hace ${diffDays} días`;
    } else {
      result = notificationDate.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    
    // Guardar en cache (solo para fechas recientes, limpiar después)
    this.timeAgoCache.set(cacheKey, result);
    return result;
  }

  getFullDate(date: Date | string): string {
    if (!date) return '';
    
    const notificationDate = date instanceof Date ? date : new Date(date);
    if (isNaN(notificationDate.getTime())) return '';
    
    // Usar cache si existe
    const cacheKey = notificationDate.getTime();
    if (this.fullDateCache.has(cacheKey)) {
      return this.fullDateCache.get(cacheKey)!;
    }
    
    const result = notificationDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    
    // Guardar en cache
    this.fullDateCache.set(cacheKey, result);
    return result;
  }
}

