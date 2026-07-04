import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JustificacionesService, Justificacion } from './justificaciones.service';
import { 
  LucideAngularModule, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User,
  Calendar,
  AlertCircle,
  Check,
  X
} from 'lucide-angular';

@Component({
  selector: 'app-justificaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './justificaciones.component.html',
  styleUrls: ['./justificaciones.component.scss'],
})
export class JustificacionesComponent implements OnInit {
  // Íconos
  readonly FileText = FileText;
  readonly CheckCircle = CheckCircle;
  readonly XCircle = XCircle;
  readonly Clock = Clock;
  readonly User = User;
  readonly Calendar = Calendar;
  readonly AlertCircle = AlertCircle;
  readonly Check = Check;
  readonly X = X;

  justificacionesService = inject(JustificacionesService);

  justificaciones: Justificacion[] = [];
  justificacionesPendientes: Justificacion[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';
  
  // Filtros
  filtroEstado: 'todas' | 'pendientes' | 'aprobadas' | 'rechazadas' = 'pendientes';
  
  // Modal de rechazo
  showRechazoModal = false;
  justificacionSeleccionada: Justificacion | null = null;
  motivoRechazo = '';

  // Usuario admin actual (desde localStorage)
  adminActual: any = null;

  ngOnInit() {
    this.loadAdminActual();
    this.loadJustificaciones();
  }

  loadAdminActual() {
    const user = localStorage.getItem('user');
    if (user) {
      this.adminActual = JSON.parse(user);
    }
  }

  loadJustificaciones() {
    this.loading = true;
    this.errorMessage = '';

    const observable = this.filtroEstado === 'pendientes' 
      ? this.justificacionesService.getJustificacionesPendientes()
      : this.justificacionesService.getAllJustificaciones();

    observable.subscribe({
      next: (justificaciones) => {
        if (this.filtroEstado === 'pendientes') {
          this.justificaciones = justificaciones;
        } else if (this.filtroEstado === 'aprobadas') {
          this.justificaciones = justificaciones.filter(j => j.estado === 'aprobada');
        } else if (this.filtroEstado === 'rechazadas') {
          this.justificaciones = justificaciones.filter(j => j.estado === 'rechazada');
        } else {
          // Todas
          this.justificaciones = justificaciones;
        }
        // Mantener siempre el contador de pendientes
        const todasJustificaciones = this.filtroEstado === 'pendientes' 
          ? justificaciones 
          : justificaciones; // Ya tenemos todas
        this.justificacionesPendientes = todasJustificaciones.filter(j => j.estado === 'pendiente');
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar justificaciones:', err);
        this.errorMessage = 'Error al cargar las justificaciones';
        this.loading = false;
      }
    });
  }

  cambiarFiltro(estado: 'todas' | 'pendientes' | 'aprobadas' | 'rechazadas') {
    this.filtroEstado = estado;
    this.loadJustificaciones();
  }

  aprobarJustificacion(justificacion: Justificacion) {
    if (!this.adminActual?.id) {
      this.errorMessage = 'No se encontró información del administrador';
      return;
    }

    if (!confirm(`¿Estás seguro de aprobar la justificación del profesor ${justificacion.profesor?.name}?`)) {
      return;
    }

    this.loading = true;
    this.justificacionesService.aprobarJustificacion(justificacion.id, this.adminActual.id).subscribe({
      next: (justificacionActualizada) => {
        this.successMessage = 'Justificación aprobada correctamente. La tabla de asistencias se actualizará automáticamente.';
        this.loadJustificaciones();
        // La tabla de asistencias debería actualizarse automáticamente vía WebSocket
        // Si no se actualiza, el usuario puede refrescar manualmente
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      },
      error: (err) => {
        console.error('Error al aprobar justificación:', err);
        this.errorMessage = err.error?.message || 'Error al aprobar la justificación';
        this.loading = false;
        setTimeout(() => {
          this.errorMessage = '';
        }, 3000);
      }
    });
  }

  abrirModalRechazo(justificacion: Justificacion) {
    this.justificacionSeleccionada = justificacion;
    this.motivoRechazo = '';
    this.showRechazoModal = true;
  }

  cerrarModalRechazo() {
    this.showRechazoModal = false;
    this.justificacionSeleccionada = null;
    this.motivoRechazo = '';
  }

  rechazarJustificacion() {
    if (!this.justificacionSeleccionada) return;
    
    if (!this.motivoRechazo || this.motivoRechazo.trim().length < 5) {
      this.errorMessage = 'El motivo de rechazo debe tener al menos 5 caracteres';
      return;
    }

    if (!this.adminActual?.id) {
      this.errorMessage = 'No se encontró información del administrador';
      return;
    }

    this.loading = true;
    this.justificacionesService.rechazarJustificacion(
      this.justificacionSeleccionada.id,
      this.adminActual.id,
      this.motivoRechazo.trim()
    ).subscribe({
      next: (justificacionActualizada) => {
        this.successMessage = 'Justificación rechazada correctamente';
        this.cerrarModalRechazo();
        this.loadJustificaciones();
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (err) => {
        console.error('Error al rechazar justificación:', err);
        this.errorMessage = err.error?.message || 'Error al rechazar la justificación';
        this.loading = false;
        setTimeout(() => {
          this.errorMessage = '';
        }, 3000);
      }
    });
  }

  getTipoLabel(tipo: string): string {
    const tipos: { [key: string]: string } = {
      'enfermedad': 'Enfermedad',
      'emergencia': 'Emergencia Personal',
      'permiso': 'Permiso Administrativo',
      'festivo': 'Día Festivo',
      'otro': 'Otro'
    };
    return tipos[tipo] || tipo;
  }

  getEstadoClass(estado: string): string {
    const clases: { [key: string]: string } = {
      'pendiente': 'estado-pendiente',
      'aprobada': 'estado-aprobada',
      'rechazada': 'estado-rechazada'
    };
    return clases[estado] || '';
  }

  formatDate(date: string | Date): string {
    if (!date) return '';
    const fecha = typeof date === 'string' ? new Date(date) : date;
    return fecha.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

