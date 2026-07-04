import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Bell, X, Check, CheckCheck, Trash2, LucideAngularModule } from 'lucide-angular';
import { NotificationsService, Notification } from '../notifications.service';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss'],
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  readonly Bell = Bell;
  readonly X = X;
  readonly Check = Check;
  readonly CheckCheck = CheckCheck;
  readonly Trash2 = Trash2;

  showDrawer = false;
  unreadCount = 0;
  notifications: Notification[] = [];
  recentNotifications: Notification[] = [];
  
  private subscriptions: Subscription[] = [];

  constructor(
    private notificationsService: NotificationsService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Obtener el userId del usuario logueado (ajustar según tu implementación)
    const userId = this.getUserId();
    
    if (userId) {
      // Iniciar polling
      this.notificationsService.startPolling(userId, 30000);

      // Suscribirse a notificaciones
      this.subscriptions.push(
        this.notificationsService.notifications$.subscribe(notifications => {
          this.notifications = notifications;
          this.recentNotifications = notifications.slice(0, 5);
        })
      );

      // Suscribirse al conteo
      this.subscriptions.push(
        this.notificationsService.unreadCount$.subscribe(count => {
          this.unreadCount = count;
        })
      );
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    // Detener el polling cuando se destruye el componente
    this.notificationsService.stopPolling();
  }

  getUserId(): number | null {
    // Obtener del localStorage o del servicio de autenticación
    if (isPlatformBrowser(this.platformId)) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id;
      }
    }
    return null;
  }

  toggleDrawer(): void {
    this.showDrawer = !this.showDrawer;
    // Prevenir scroll del body cuando el drawer está abierto
    if (isPlatformBrowser(this.platformId)) {
      if (this.showDrawer) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  }

  closeDrawer(): void {
    this.showDrawer = false;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = '';
    }
  }

  markAsRead(notification: Notification, event: Event): void {
    event.stopPropagation();
    const userId = this.getUserId();
    if (userId) {
      this.notificationsService.markAsRead(notification.id, userId).subscribe();
    }
  }

  markAllAsRead(): void {
    const userId = this.getUserId();
    if (userId) {
      this.notificationsService.markAllAsRead(userId).subscribe();
    }
  }

  deleteNotification(notification: Notification, event: Event): void {
    event.stopPropagation();
    const userId = this.getUserId();
    if (userId) {
      this.notificationsService.remove(notification.id, userId).subscribe();
    }
  }

  viewAll(): void {
    this.closeDrawer();
    this.router.navigate(['/notifications']);
  }

  getNotificationIcon(tipo: string): any {
    return Bell; // Puedes personalizar por tipo
  }

  getNotificationClass(notification: Notification): string {
    return `notification-${notification.tipo} ${notification.leido ? 'read' : 'unread'}`;
  }

  getTimeAgo(date: Date | string): string {
    if (!date) return '';
    
    const notificationDate = date instanceof Date ? date : new Date(date);
    if (isNaN(notificationDate.getTime())) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return notificationDate.toLocaleDateString('es-ES');
  }
  
  // TrackBy function para mejorar el rendimiento del *ngFor
  trackByNotificationId(index: number, notification: Notification): number {
    return notification.id;
  }
}

