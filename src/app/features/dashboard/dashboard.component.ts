import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { 
  LucideAngularModule,
  Users,
  CheckCircle2,
  Calendar,
  BarChart3,
  TrendingUp,
  Clock,
  FileText,
  RefreshCw,
  UserPen,
  CheckSquare,
  QrCode,
  ShieldUser,
  Inbox,
  Building2,
  Bell
} from 'lucide-angular';
import { ProfesoresService } from '../profesores.service';
import { AttendancesService } from '../attendance/attendance.service';
import { DepartamentosService } from '../departamentos/departamentos.service';
import { HorariosService } from '../horarios/horarios.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { forkJoin } from 'rxjs';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  // Íconos
  readonly Users = Users;
  readonly CheckCircle2 = CheckCircle2;
  readonly Calendar = Calendar;
  readonly BarChart3 = BarChart3;
  readonly TrendingUp = TrendingUp;
  readonly Clock = Clock;
  readonly FileText = FileText;
  readonly RefreshCw = RefreshCw;
  readonly UserPen = UserPen;
  readonly CheckSquare = CheckSquare;
  readonly QrCode = QrCode;
  readonly ShieldUser = ShieldUser;
  readonly Inbox = Inbox;
  readonly Building2 = Building2;
  readonly Bell = Bell;

  stats = {
    totalProfesores: 0,
    totalDepartamentos: 0,
    totalHorarios: 0,
    asistenciaHoy: 0,
    porcentajeHoy: 0,
    registrosMes: 0,
    promedioDiario: 0,
    resumen: {
      presentes: 0,
      justificados: 0,
      tardanzas: 0,
      porcentajePresentes: 0,
      porcentajeJustificados: 0,
      porcentajeTardanzas: 0
    }
  };

  recentActivity: any[] = [];
  loading = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private profesoresService: ProfesoresService,
    private attendancesService: AttendancesService,
    private departamentosService: DepartamentosService,
    private horariosService: HorariosService,
    private notificationsService: NotificationsService,
    private websocketService: WebSocketService
  ) {}

  ngOnInit() {
    this.loadStats();
    this.setupWebSocketListeners();
  }

  ngOnDestroy(): void {
    // Limpiar todas las suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  setupWebSocketListeners(): void {
    // Escuchar actualizaciones de profesores
    const professorsSub = this.websocketService.onProfessorsListUpdated().subscribe(() => {
      console.log('📊 Dashboard: Lista de profesores actualizada');
      this.loadStats(); // Recargar estadísticas
    });

    // Escuchar actualizaciones de asistencias
    const attendancesSub = this.websocketService.onAttendancesListUpdated().subscribe(() => {
      console.log('📊 Dashboard: Lista de asistencias actualizada');
      this.loadStats(); // Recargar estadísticas
    });

    this.subscriptions.push(professorsSub, attendancesSub);
  }

  loadStats() {
    this.loading = true;
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const todayStr = today.toISOString().split('T')[0];
    
    // Obtener fecha de inicio del día de hoy
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    // Cargar todos los datos en paralelo
    forkJoin({
      profesores: this.profesoresService.getProfesores(),
      departamentos: this.departamentosService.getDepartamentos(),
      horarios: this.horariosService.getHorarios(),
      asistenciasHoy: this.attendancesService.getByDateRange(
        startOfToday.toISOString(),
        endOfToday.toISOString()
      ),
      statsMes: this.attendancesService.getMonthlyStats(currentYear, currentMonth),
      notificaciones: this.notificationsService.getAll()
    }).subscribe({
      next: (data) => {
        // Total de profesores
        this.stats.totalProfesores = data.profesores.length;
        
        // Total de departamentos y horarios
        this.stats.totalDepartamentos = data.departamentos.length;
        this.stats.totalHorarios = data.horarios.length;
        
        // Asistencias de hoy
        const asistenciasHoyUnicas = new Set(
          data.asistenciasHoy
            .filter(a => a.entryTime)
            .map(a => {
              const entryDate = new Date(a.entryTime);
              return `${a.professor?.id}-${entryDate.toISOString().split('T')[0]}`;
            })
        );
        this.stats.asistenciaHoy = asistenciasHoyUnicas.size;
        this.stats.porcentajeHoy = this.stats.totalProfesores > 0 
          ? Math.round((this.stats.asistenciaHoy / this.stats.totalProfesores) * 100)
          : 0;
        
        // Estadísticas del mes
        if (data.statsMes) {
          this.stats.registrosMes = data.statsMes.totalAsistencias || 0;
          this.stats.resumen.presentes = data.statsMes.asistenciasCompletas || 0;
          this.stats.resumen.justificados = data.statsMes.justificados || 0;
          this.stats.resumen.tardanzas = data.statsMes.retrasos || 0;
          
          const total = this.stats.resumen.presentes + this.stats.resumen.justificados + this.stats.resumen.tardanzas;
          if (total > 0) {
            this.stats.resumen.porcentajePresentes = Math.round((this.stats.resumen.presentes / total) * 100);
            this.stats.resumen.porcentajeJustificados = Math.round((this.stats.resumen.justificados / total) * 100);
            this.stats.resumen.porcentajeTardanzas = Math.round((this.stats.resumen.tardanzas / total) * 100);
          }
          
          // Promedio diario (asistencias completas / días del mes)
          const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
          this.stats.promedioDiario = daysInMonth > 0 
            ? Math.round((this.stats.resumen.presentes / daysInMonth))
            : 0;
        }
        
        // Actividad reciente (últimas 5 notificaciones y asistencias)
        this.loadRecentActivity(data.notificaciones, data.asistenciasHoy);
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar estadísticas:', err);
        this.loading = false;
      }
    });
  }

  loadRecentActivity(notificaciones: any[], asistenciasHoy: any[]) {
    const activities: any[] = [];
    
    // Agregar notificaciones recientes
    notificaciones
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
      .forEach(notif => {
        activities.push({
          icon: Bell,
          title: notif.message || 'Nueva notificación',
          time: this.getTimeAgo(new Date(notif.createdAt)),
          type: 'notification'
        });
      });
    
    // Agregar asistencias recientes de hoy
    asistenciasHoy
      .filter(a => a.entryTime)
      .sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime())
      .slice(0, 2)
      .forEach(att => {
        activities.push({
          icon: CheckSquare,
          title: `Asistencia registrada: ${att.professor?.name || 'Profesor'}`,
          time: this.getTimeAgo(new Date(att.entryTime)),
          type: 'attendance'
        });
      });
    
    // Ordenar por fecha y tomar las 5 más recientes
    this.recentActivity = activities
      .sort((a, b) => {
        const timeA = this.getTimeFromAgo(a.time);
        const timeB = this.getTimeFromAgo(b.time);
        return timeB - timeA;
      })
      .slice(0, 5);
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    return date.toLocaleDateString('es-ES');
  }

  getTimeFromAgo(timeAgo: string): number {
    // Convertir "Hace X minutos/horas" a timestamp aproximado
    const now = Date.now();
    const match = timeAgo.match(/(\d+)/);
    if (!match) return now;
    
    const num = parseInt(match[1]);
    if (timeAgo.includes('minuto')) return now - (num * 60000);
    if (timeAgo.includes('hora')) return now - (num * 3600000);
    if (timeAgo.includes('día')) return now - (num * 86400000);
    return now;
  }

  refreshStats() {
    this.loadStats();
  }
}
