# 📬 Sistema de Notificaciones

Sistema completo de notificaciones en tiempo real para la aplicación de asistencia de profesores.

## 🎯 Características

- ✅ Notificaciones en tiempo real con polling automático
- ✅ Badge visual con contador de notificaciones no leídas
- ✅ Dropdown interactivo con notificaciones recientes
- ✅ Página completa para gestionar todas las notificaciones
- ✅ Panel administrativo para enviar notificaciones
- ✅ Envío individual o masivo a múltiples profesores
- ✅ Tipos: Info, Success, Warning, Error, Message, Reminder
- ✅ Niveles de prioridad: Low, Medium, High, Urgent
- ✅ Filtros y búsqueda avanzada
- ✅ Diseño moderno y responsive

## 📁 Estructura de Archivos

```
notifications/
├── notification-bell/
│   ├── notification-bell.component.ts
│   ├── notification-bell.component.html
│   └── notification-bell.component.scss
├── notifications-list/
│   ├── notifications-list.component.ts
│   ├── notifications-list.component.html
│   └── notifications-list.component.scss
├── send-notification/
│   ├── send-notification.component.ts
│   ├── send-notification.component.html
│   └── send-notification.component.scss
├── notifications.service.ts
└── README.md
```

## 🚀 Instalación y Configuración

### 1. Backend (NestJS)

El backend ya está configurado con:
- Entidad `Notification`
- Módulo `NotificationsModule`
- Controller y Service completos
- Endpoints REST API

**La tabla se creará automáticamente** cuando inicies el servidor (TypeORM synchronize: true).

### 2. Frontend (Angular)

#### Agregar rutas en `app.routes.ts`:

```typescript
import { Routes } from '@angular/router';
import { NotificationsListComponent } from './notifications/notifications-list/notifications-list.component';
import { SendNotificationComponent } from './notifications/send-notification/send-notification.component';

export const routes: Routes = [
  // ... otras rutas
  {
    path: 'notifications',
    component: NotificationsListComponent,
  },
  {
    path: 'send-notification',
    component: SendNotificationComponent,
  },
];
```

#### Integrar la campana en el Header/Navbar:

En tu componente de layout (ejemplo: `sidebar.component.html` o `header.component.html`):

```html
<app-notification-bell></app-notification-bell>
```

En el archivo TypeScript correspondiente:

```typescript
import { NotificationBellComponent } from '../notifications/notification-bell/notification-bell.component';

@Component({
  // ...
  imports: [/* otros imports */, NotificationBellComponent],
})
```

## 📡 API Endpoints

### Notificaciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/notifications` | Crear notificación individual |
| `POST` | `/notifications/bulk` | Enviar a múltiples usuarios |
| `GET` | `/notifications` | Obtener todas (admin) |
| `GET` | `/notifications/user/:userId` | Notificaciones de un usuario |
| `GET` | `/notifications/user/:userId/unread-count` | Contar no leídas |
| `PATCH` | `/notifications/:id/read/:userId` | Marcar como leída |
| `PATCH` | `/notifications/user/:userId/read-all` | Marcar todas como leídas |
| `DELETE` | `/notifications/:id/user/:userId` | Eliminar una notificación |
| `DELETE` | `/notifications/user/:userId/read` | Eliminar todas las leídas |

### Ejemplos de Uso

#### Crear una notificación:

```typescript
POST /notifications
{
  "destinatarioId": 1,
  "titulo": "Reunión importante",
  "mensaje": "Mañana a las 10:00 AM en la sala de profesores",
  "tipo": "reminder",
  "prioridad": "high",
  "remitenteId": 2
}
```

#### Envío masivo:

```typescript
POST /notifications/bulk
{
  "destinatariosIds": [1, 2, 3, 4],
  "titulo": "Cambio de horario",
  "mensaje": "Se ha modificado el horario de clases",
  "tipo": "warning",
  "prioridad": "urgent"
}
```

## 💡 Uso en el Frontend

### Componente Bell (Campana)

Se actualiza automáticamente cada 30 segundos:

```typescript
// Configuración del polling (opcional)
ngOnInit(): void {
  const userId = this.getUserId();
  if (userId) {
    this.notificationsService.startPolling(userId, 30000); // 30 segundos
  }
}
```

### Servicio de Notificaciones

```typescript
import { NotificationsService } from './notifications/notifications.service';

constructor(private notificationsService: NotificationsService) {}

// Cargar notificaciones
this.notificationsService.loadNotifications(userId);

// Observar cambios
this.notificationsService.notifications$.subscribe(notifications => {
  console.log('Notificaciones:', notifications);
});

// Observar contador
this.notificationsService.unreadCount$.subscribe(count => {
  console.log('No leídas:', count);
});
```

## 🎨 Personalización

### Tipos de Notificación

```typescript
export enum NotificationType {
  INFO = 'info',        // ℹ️ Azul
  WARNING = 'warning',  // ⚠️ Amarillo
  ERROR = 'error',      // ❌ Rojo
  SUCCESS = 'success',  // ✅ Verde
  MESSAGE = 'message',  // 💬 Púrpura
  REMINDER = 'reminder', // 🔔 Naranja
}
```

### Niveles de Prioridad

```typescript
export enum NotificationPriority {
  LOW = 'low',          // Gris claro
  MEDIUM = 'medium',    // Azul
  HIGH = 'high',        // Naranja
  URGENT = 'urgent',    // Rojo
}
```

## 🔒 Seguridad y Autenticación

El sistema utiliza el `userId` almacenado en `localStorage`:

```typescript
getUserId(): number | null {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    return user.id;
  }
  return null;
}
```

**Recomendación:** Implementa guards en las rutas para proteger el acceso:

```typescript
{
  path: 'send-notification',
  component: SendNotificationComponent,
  canActivate: [AdminGuard], // Solo admins pueden enviar
}
```

## 📱 Responsive Design

Todos los componentes son completamente responsive:
- Desktop: Vista completa con sidebar
- Tablet: Layout adaptado
- Mobile: Vista optimizada, dropdown ajustado

## ⚡ Performance

- **Polling inteligente**: Actualización cada 30 segundos (configurable)
- **Observables**: Uso de BehaviorSubjects para reactividad
- **Lazy loading**: Los componentes pueden cargarse bajo demanda
- **Optimización CSS**: Uso de transformaciones GPU-accelerated

## 🐛 Troubleshooting

### Las notificaciones no se actualizan

1. Verifica que el backend esté corriendo
2. Revisa la consola del navegador
3. Confirma que el userId sea correcto
4. Verifica la URL del API en `notifications.service.ts`

### Error CORS

Agrega en tu backend (NestJS):

```typescript
// main.ts
app.enableCors({
  origin: 'http://localhost:4200',
  credentials: true,
});
```

### La campana no aparece

1. Verifica que el componente esté importado
2. Revisa que HttpClient esté configurado en `app.config.ts`

## 📚 Próximas Mejoras

- [ ] WebSockets para notificaciones en tiempo real
- [ ] Push notifications del navegador
- [ ] Sonidos personalizables
- [ ] Plantillas de notificaciones
- [ ] Programación de envíos
- [ ] Estadísticas de lectura
- [ ] Notificaciones por email/SMS
- [ ] Categorías personalizadas

## 🤝 Contribución

Para agregar nuevas características:

1. Actualiza la entidad en el backend
2. Modifica los DTOs según sea necesario
3. Actualiza el servicio en Angular
4. Ajusta los componentes visuales

---

**Desarrollado con ❤️ para el Sistema de Asistencia CETPRE**

