import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Send, Users, User, CheckCircle, AlertCircle, Bell, FileText, LucideAngularModule } from 'lucide-angular';
import {
  NotificationsService,
  NotificationType,
  NotificationPriority,
  CreateNotificationDto,
  SendBulkNotificationDto,
} from '../notifications.service';
import { UsersService, User as UserModel } from '../../services/users.service';

@Component({
  selector: 'app-send-notification',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './send-notification.component.html',
  styleUrls: ['./send-notification.component.scss'],
})
export class SendNotificationComponent implements OnInit {
  readonly Send = Send;
  readonly Users = Users;
  readonly User = User;
  readonly CheckCircle = CheckCircle;
  readonly AlertCircle = AlertCircle;
  readonly Bell = Bell;
  readonly FileText = FileText;

  // Formulario
  titulo: string = '';
  mensaje: string = '';
  tipo: NotificationType = NotificationType.INFO;
  prioridad: NotificationPriority = NotificationPriority.MEDIUM;
  destinatarioSeleccionado: string = 'all';
  profesoresSeleccionados: number[] = [];

  // Datos
  profesores: UserModel[] = [];
  loading: boolean = false;
  success: boolean = false;
  error: string = '';

  // Enums para el template
  NotificationType = NotificationType;
  NotificationPriority = NotificationPriority;

  constructor(
    private notificationsService: NotificationsService,
    private usersService: UsersService
  ) {}

  ngOnInit(): void {
    this.cargarProfesores();
  }

  cargarProfesores(): void {
    this.loading = true;
    this.error = '';
    // Cargar todos los usuarios (profesores y admins)
    this.usersService.getAll().subscribe({
      next: (users) => {
        this.profesores = users || [];
        this.profesoresSeleccionados = users ? users.map(u => u.id) : [];
        this.loading = false;
        
        if (this.profesores.length === 0) {
          this.error = 'No hay usuarios disponibles en el sistema';
        }
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        
        if (err.status === 0) {
          this.error = 'No se puede conectar al servidor. Verifica que el backend esté corriendo en http://localhost:3002';
        } else if (err.status === 404) {
          this.error = 'Endpoint de usuarios no encontrado. Verifica la configuración del backend';
        } else {
          this.error = 'Error al cargar los usuarios: ' + (err.error?.message || 'Error desconocido');
        }
        
        this.profesores = [];
        this.profesoresSeleccionados = [];
        this.loading = false;
      },
    });
  }

  onDestinatarioChange(): void {
    if (this.destinatarioSeleccionado === 'all') {
      this.profesoresSeleccionados = this.profesores.map(p => p.id);
    } else if (this.destinatarioSeleccionado === 'none') {
      this.profesoresSeleccionados = [];
    }
  }

  toggleProfesor(profesorId: number): void {
    const index = this.profesoresSeleccionados.indexOf(profesorId);
    if (index > -1) {
      this.profesoresSeleccionados.splice(index, 1);
    } else {
      this.profesoresSeleccionados.push(profesorId);
    }
    this.updateDestinatarioSeleccionado();
  }

  updateDestinatarioSeleccionado(): void {
    if (this.profesoresSeleccionados.length === 0) {
      this.destinatarioSeleccionado = 'none';
    } else if (this.profesoresSeleccionados.length === this.profesores.length) {
      this.destinatarioSeleccionado = 'all';
    } else {
      this.destinatarioSeleccionado = 'custom';
    }
  }

  isProfesorSelected(profesorId: number): boolean {
    return this.profesoresSeleccionados.includes(profesorId);
  }

  enviarNotificacion(): void {
    if (!this.validarFormulario()) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = false;

    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    const remitenteId = currentUser?.id;

    if (this.profesoresSeleccionados.length === 1) {
      // Enviar a un solo destinatario
      const dto: CreateNotificationDto = {
        destinatarioId: this.profesoresSeleccionados[0],
        titulo: this.titulo,
        mensaje: this.mensaje,
        tipo: this.tipo,
        prioridad: this.prioridad,
        remitenteId,
      };

      this.notificationsService.create(dto).subscribe({
        next: () => {
          this.mostrarExito();
        },
        error: (err) => {
          this.mostrarError(err);
        },
      });
    } else {
      // Enviar a múltiples destinatarios
      const dto: SendBulkNotificationDto = {
        destinatariosIds: this.profesoresSeleccionados,
        titulo: this.titulo,
        mensaje: this.mensaje,
        tipo: this.tipo,
        prioridad: this.prioridad,
        remitenteId,
      };

      this.notificationsService.sendBulk(dto).subscribe({
        next: () => {
          this.mostrarExito();
        },
        error: (err) => {
          this.mostrarError(err);
        },
      });
    }
  }

  validarFormulario(): boolean {
    if (!this.titulo.trim()) {
      this.error = 'El título es requerido';
      return false;
    }

    if (!this.mensaje.trim()) {
      this.error = 'El mensaje es requerido';
      return false;
    }

    if (this.profesoresSeleccionados.length === 0) {
      this.error = 'Selecciona al menos un destinatario';
      return false;
    }

    return true;
  }

  mostrarExito(): void {
    this.loading = false;
    this.success = true;
    this.limpiarFormulario();

    setTimeout(() => {
      this.success = false;
    }, 5000);
  }

  mostrarError(err: any): void {
    this.loading = false;
    
    // Mensajes de error más descriptivos
    if (err.status === 0) {
      this.error = 'No se puede conectar al servidor. Verifica que el backend esté corriendo en http://localhost:3002';
    } else if (err.status === 404) {
      this.error = 'Endpoint no encontrado. Verifica la configuración del backend';
    } else if (err.status === 500) {
      this.error = 'Error del servidor: ' + (err.error?.message || 'Error interno');
    } else if (err.error?.message) {
      this.error = err.error.message;
    } else {
      this.error = 'Error al enviar la notificación. Código: ' + (err.status || 'desconocido');
    }

    console.error('Error completo:', err);

    setTimeout(() => {
      this.error = '';
    }, 8000);
  }

  limpiarFormulario(): void {
    this.titulo = '';
    this.mensaje = '';
    this.tipo = NotificationType.INFO;
    this.prioridad = NotificationPriority.MEDIUM;
    this.destinatarioSeleccionado = 'all';
    this.profesoresSeleccionados = this.profesores.map(p => p.id);
  }

  get caracteresRestantes(): number {
    return 500 - this.mensaje.length;
  }
}

