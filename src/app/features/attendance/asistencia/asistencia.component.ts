import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendancesService } from '../attendance.service';
import { DepartamentosService } from '../../departamentos/departamentos.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { ManualMarkModalComponent } from '../manual-mark-modal/manual-mark-modal.component';
import { Subscription } from 'rxjs';
import { 
  LucideAngularModule, 
  User, 
  Calendar,
  Clock,
  LogIn,
  LogOut,
  Search,
  RefreshCw,
  FileText,
  BookOpen,
  Briefcase,
  UserCheck,
  Filter,
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  Users,
  Clock3
} from 'lucide-angular';

interface Professor {
  id: number;
  name: string;
  departamentoId?: number | null;
  horarioId?: number | null;
  dni?: string;
  phone?: string;
  address?: string;
}

interface Asistencia {
  id?: number;
  professor?: Professor;
  entryTime: Date | string | null;
  exitTime: Date | string | null;
  activity?: string | null;
  markedBy?: string | null;
  justification?: string | null;
  isLate?: boolean;
  createdAt?: Date | string;
}

@Component({
  selector: 'app-asistencia',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, ManualMarkModalComponent],
  templateUrl: './asistencia.component.html',
  styleUrls: ['./asistencia.component.scss']
})
export class AsistenciaComponent implements OnInit, OnDestroy {
  asistencias: Asistencia[] = [];
  filteredAsistencias: Asistencia[] = [];
  searchText: string = '';
  loading: boolean = false;
  maxRecords: number = 100; // Límite de registros a mostrar
  showAll: boolean = false; // Mostrar todos los registros
  dateFilter: 'all' | 'today' | '7days' | '30days' | '90days' = 'all'; // Filtro de fecha
  private subscriptions: Subscription[] = [];

  // Íconos
  readonly User = User;
  readonly Calendar = Calendar;
  readonly Clock = Clock;
  readonly LogIn = LogIn;
  readonly LogOut = LogOut;
  readonly AlertCircle = AlertCircle;
  readonly CheckCircle2 = CheckCircle2;
  readonly Search = Search;
  readonly RefreshCw = RefreshCw;
  readonly FileText = FileText;
  readonly BookOpen = BookOpen;
  readonly Briefcase = Briefcase;
  readonly UserCheck = UserCheck;
  readonly Filter = Filter;
  readonly CheckSquare = CheckSquare;
  readonly Users = Users;
  readonly Clock3 = Clock3;
  
  // Modal de marcado manual
  showManualMarkModal = false;

  // Lista de departamentos
  departamentos: any[] = [];
  
  // Estadísticas
  totalAsistencias = 0;
  asistenciasHoy = 0;

  constructor(
    private attendancesService: AttendancesService,
    private departamentosService: DepartamentosService,
    private websocketService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.loadDepartamentos();
    this.loadAsistencias();
    this.setupWebSocketListeners();
  }

  loadDepartamentos(): void {
    this.departamentosService.getDepartamentos().subscribe({
      next: (data) => {
        this.departamentos = data;
      },
      error: (err) => {
        console.error('Error cargando departamentos:', err);
      }
    });
  }

  ngOnDestroy(): void {
    // Limpiar todas las suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  setupWebSocketListeners(): void {
    // Escuchar cuando se crea una asistencia
    const createdSub = this.websocketService.onAttendanceCreated().subscribe((attendance) => {
      console.log('🆕 Asistencia creada en tiempo real:', attendance);
      this.loadAsistencias(); // Recargar lista
    });

    // Escuchar cuando se actualiza una asistencia
    const updatedSub = this.websocketService.onAttendanceUpdated().subscribe((attendance) => {
      console.log('🔄 Asistencia actualizada en tiempo real:', attendance);
      // Actualizar la asistencia en la lista sin recargar todo
      const index = this.asistencias.findIndex(a => a.id === attendance.id);
      if (index !== -1) {
        this.asistencias[index] = { ...this.asistencias[index], ...attendance };
        this.filterAsistencias();
      } else {
        this.loadAsistencias(); // Si no está en la lista, recargar
      }
    });

    // Escuchar actualizaciones generales de la lista
    const listUpdatedSub = this.websocketService.onAttendancesListUpdated().subscribe(() => {
      console.log('📋 Lista de asistencias actualizada en tiempo real');
      this.loadAsistencias();
    });

    this.subscriptions.push(createdSub, updatedSub, listUpdatedSub);
  }

  loadAsistencias(): void {
    this.loading = true;
    this.attendancesService.getAll().subscribe({
      next: (data: any[]) => {
        console.log('Datos recibidos del backend:', data);
        this.updateStats(data);
        
        // El backend ya filtra correctamente, solo procesar y ordenar
        let processed = data
          .filter((item: any) => {
            // Asegurar que siempre tenga profesor (el backend ya lo filtra, pero por seguridad)
            return item.professor && item.professor.name;
          })
          .map((item: any) => {
            // Determinar la fecha: usar entryTime, exitTime o createdAt
            let fecha: Date | null = null;
            if (item.entryTime) {
              fecha = new Date(item.entryTime);
            } else if (item.exitTime) {
              fecha = new Date(item.exitTime);
            } else if (item.createdAt) {
              fecha = new Date(item.createdAt);
            }
            
            // Asegurar que todos los campos estén presentes
            return {
              ...item,
              entryTime: item.entryTime || null,
              exitTime: item.exitTime || null,
              activity: item.activity || null,
              justification: item.justification || null,
              markedBy: item.markedBy || null,
              fecha: fecha, // Fecha calculada para ordenamiento
            };
          })
          // Ordenar por fecha más reciente primero
          .sort((a: any, b: any) => {
            const dateA = a.fecha ? a.fecha.getTime() : 0;
            const dateB = b.fecha ? b.fecha.getTime() : 0;
            return dateB - dateA; // Más reciente primero
          });
        
        this.asistencias = processed;
        this.updateStats(processed);
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando asistencias', err);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.asistencias];
    
    // Aplicar filtro de fecha
    if (this.dateFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter((asistencia) => {
        // Obtener la fecha de la asistencia
        let fechaAsistencia: Date | null = null;
        if (asistencia.entryTime) {
          fechaAsistencia = new Date(asistencia.entryTime);
        } else if (asistencia.exitTime) {
          fechaAsistencia = new Date(asistencia.exitTime);
        } else if ((asistencia as any).createdAt) {
          fechaAsistencia = new Date((asistencia as any).createdAt);
        } else if ((asistencia as any).fecha) {
          fechaAsistencia = (asistencia as any).fecha;
        }
        
        if (!fechaAsistencia) return false;
        
        // Normalizar la fecha (solo día, sin hora)
        const fechaAsistenciaNormalizada = new Date(fechaAsistencia);
        fechaAsistenciaNormalizada.setHours(0, 0, 0, 0);
        
        const diffTime = today.getTime() - fechaAsistenciaNormalizada.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        switch (this.dateFilter) {
          case 'today':
            return diffDays === 0;
          case '7days':
            return diffDays >= 0 && diffDays <= 7;
          case '30days':
            return diffDays >= 0 && diffDays <= 30;
          case '90days':
            return diffDays >= 0 && diffDays <= 90;
          default:
            return true;
        }
      });
    }
    
    // Aplicar búsqueda si existe
    if (this.searchText && this.searchText.trim()) {
      const term = this.searchText.toLowerCase().trim();
      filtered = filtered.filter((asistencia) => {
        const departamentoNombre = this.getProfessorSpecialty(asistencia.professor)?.toLowerCase() || '';
        return asistencia.professor?.name?.toLowerCase().includes(term) ||
          departamentoNombre.includes(term) ||
          asistencia.professor?.dni?.toLowerCase().includes(term) ||
          asistencia.markedBy?.toLowerCase().includes(term) ||
          asistencia.justification?.toLowerCase().includes(term) ||
          asistencia.activity?.toLowerCase().includes(term) ||
          (asistencia.entryTime && this.formatDate(asistencia.entryTime.toString()).toLowerCase().includes(term)) ||
          (asistencia.exitTime && this.formatDate(asistencia.exitTime.toString()).toLowerCase().includes(term)) ||
          (asistencia.entryTime && this.formatTime(asistencia.entryTime.toString()).toLowerCase().includes(term)) ||
          (asistencia.exitTime && this.formatTime(asistencia.exitTime.toString()).toLowerCase().includes(term));
      });
    }
    
    // Limitar registros si no se muestran todos
    if (!this.showAll && filtered.length > this.maxRecords) {
      filtered = filtered.slice(0, this.maxRecords);
    }
    
    this.filteredAsistencias = filtered;
  }
  
  // Método para cambiar el filtro de fecha
  setDateFilter(filter: 'all' | 'today' | '7days' | '30days' | '90days'): void {
    this.dateFilter = filter;
    this.applyFilters();
  }
  
  // Método para obtener el texto del filtro activo
  getDateFilterText(): string {
    switch (this.dateFilter) {
      case 'today':
        return 'Hoy';
      case '7days':
        return 'Últimos 7 días';
      case '30days':
        return 'Últimos 30 días';
      case '90days':
        return 'Últimos 90 días';
      default:
        return 'Todas las fechas';
    }
  }

  filterAsistencias(): void {
    this.applyFilters();
  }

  toggleShowAll(): void {
    this.showAll = !this.showAll;
    this.applyFilters();
  }

  shouldShowTotal(): boolean {
    return !this.showAll && this.asistencias && this.asistencias.length > this.maxRecords;
  }

  shouldShowMoreButton(): boolean {
    return this.asistencias && this.asistencias.length > this.maxRecords;
  }

  getShowAllButtonText(): string {
    if (this.showAll) {
      return 'Mostrar menos';
    }
    const total = this.asistencias?.length || 0;
    return `Mostrar todos (${total})`;
  }

  getProfessorName(professor: any): string {
    return professor?.name || 'Desconocido';
  }

  getProfessorSpecialty(professor: any): string | null {
    if (!professor?.departamentoId) return null;
    const dept = this.departamentos.find(d => d.id === professor.departamentoId);
    return dept?.nombre || null;
  }

  getProfessorDni(professor: any): string | null {
    return professor?.dni || null;
  }

  getActivity(activity: string | null | undefined): string {
    return activity || '—';
  }

  getMarkedBy(markedBy: string | null | undefined): string {
    // Si es null o undefined, puede ser un registro por QR antiguo
    if (!markedBy) {
      return 'QR';
    }
    return markedBy;
  }

  getJustification(justification: string | null | undefined, asistencia: Asistencia): string {
    // Verificar si tiene entrada o salida real (con horas distintas de 00:00)
    const hasRealEntry = asistencia.entryTime && 
      (new Date(asistencia.entryTime).getHours() !== 0 || 
       new Date(asistencia.entryTime).getMinutes() !== 0);
    
    const hasRealExit = asistencia.exitTime && 
      (new Date(asistencia.exitTime).getHours() !== 0 || 
       new Date(asistencia.exitTime).getMinutes() !== 0);
    
    // Si tiene asistencia real (entrada o salida con horas reales), no es justificación
    // Filtrar las justificaciones del sistema o de marcado manual
    if (hasRealEntry || hasRealExit) {
      // Si tiene asistencia real, no mostrar justificación del sistema o marcado manual
      if (justification && justification.trim().length > 0) {
        if (justification.includes('Hoja de asistencia creada automáticamente') ||
            justification === 'Marcado manual por administrador') {
          return '—';
        }
        // Si es una justificación personalizada pero hay asistencia real, podría ser una nota
        // En este caso, no la mostramos como justificación sino como nota interna
        return '—';
      }
      return '—';
    }
    
    // Si tiene justificación, mostrarla (solo si no tiene asistencia real)
    if (justification && justification.trim().length > 0) {
      // Filtrar justificaciones del sistema
      if (justification.includes('Hoja de asistencia creada automáticamente')) {
        // Si no tiene entrada ni salida, es una falta sin justificar
        if (!asistencia.entryTime && !asistencia.exitTime) {
          return 'No asistió';
        }
        return '—';
      }
      // Filtrar justificaciones de marcado manual (solo si no hay asistencia real)
      if (justification === 'Marcado manual por administrador') {
        return '—';
      }
      return justification;
    }
    
    // Si no tiene justificación, verificar si es una falta
    // Es falta si: no tiene entrada ni salida, o tiene entrada a las 00:00 del sistema
    if (!asistencia.entryTime && !asistencia.exitTime) {
      return 'No asistió';
    }
    
    // Si tiene entrada a las 00:00 y es del sistema, es falta
    if (asistencia.entryTime && asistencia.markedBy === 'Sistema') {
      const entryDate = new Date(asistencia.entryTime);
      if (entryDate.getHours() === 0 && entryDate.getMinutes() === 0) {
        return 'No asistió';
      }
    }
    
    return '—';
  }
  
  // Método para determinar si es una falta
  isAbsence(asistencia: Asistencia): boolean {
    // Si tiene asistencia real (entrada o salida con horas reales), NO es falta
    const hasRealEntry = asistencia.entryTime && 
      (new Date(asistencia.entryTime).getHours() !== 0 || 
       new Date(asistencia.entryTime).getMinutes() !== 0);
    
    const hasRealExit = asistencia.exitTime && 
      (new Date(asistencia.exitTime).getHours() !== 0 || 
       new Date(asistencia.exitTime).getMinutes() !== 0);
    
    if (hasRealEntry || hasRealExit) {
      return false;
    }
    
    // Tiene justificación válida (que no sea del sistema), no es falta
    if (asistencia.justification && 
        asistencia.justification.trim().length > 0 &&
        !asistencia.justification.includes('Hoja de asistencia creada automáticamente') &&
        asistencia.justification !== 'Marcado manual por administrador') {
      return false;
    }
    
    // No tiene entrada ni salida, es falta
    if (!asistencia.entryTime && !asistencia.exitTime) {
      return true;
    }
    
    // Tiene entrada a las 00:00 del sistema, es falta
    if (asistencia.entryTime && asistencia.markedBy === 'Sistema') {
      const entryDate = new Date(asistencia.entryTime);
      if (entryDate.getHours() === 0 && entryDate.getMinutes() === 0) {
        return true;
      }
    }
    
    return false;
  }

  formatDate(dateString: string | Date | null | undefined): string {
    if (!dateString) return '—';
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) return '—';
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return '—';
    }
  }

  formatTime(dateString: string | Date | null | undefined): string {
    if (!dateString) return '—';
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) return '—';
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return '—';
    }
  }

  getDateFromEntryOrExit(asistencia: Asistencia): string {
    // Si es una justificación de ausencia (sin entrada ni salida), mostrar la fecha de la justificación
    if (this.isJustifiedAbsence(asistencia)) {
      // Si tiene createdAt, usarlo
      if ((asistencia as any).createdAt) {
        return this.formatDate((asistencia as any).createdAt);
      }
      // Si tiene fecha calculada, usarla
      if ((asistencia as any).fecha) {
        return this.formatDate((asistencia as any).fecha);
      }
      // Si no, intentar usar entryTime aunque sea null (puede tener fecha en el día)
      if (asistencia.entryTime) {
        return this.formatDate(asistencia.entryTime);
      }
    }
    
    // Prioridad: entryTime > exitTime > createdAt
    if (asistencia.entryTime) {
      return this.formatDate(asistencia.entryTime);
    }
    if (asistencia.exitTime) {
      return this.formatDate(asistencia.exitTime);
    }
    // Si no tiene entrada ni salida, usar createdAt (para justificaciones)
    if ((asistencia as any).createdAt) {
      return this.formatDate((asistencia as any).createdAt);
    }
    // Si tampoco tiene createdAt, usar la fecha calculada
    if ((asistencia as any).fecha) {
      return this.formatDate((asistencia as any).fecha);
    }
    return '—';
  }
  
  // Método para determinar si es una justificación de ausencia (tiene justificación pero no entrada ni salida)
  isJustifiedAbsence(asistencia: Asistencia): boolean {
    // PRIORIDAD: Si tiene asistencia real (entrada o salida con horas reales), NO es justificación
    // Verificar si tiene entrada real (no a las 00:00)
    const hasRealEntry = asistencia.entryTime && 
      (new Date(asistencia.entryTime).getHours() !== 0 || 
       new Date(asistencia.entryTime).getMinutes() !== 0);
    
    // Verificar si tiene salida real (no a las 00:00)
    const hasRealExit = asistencia.exitTime && 
      (new Date(asistencia.exitTime).getHours() !== 0 || 
       new Date(asistencia.exitTime).getMinutes() !== 0);
    
    // Si tiene asistencia real (entrada o salida con horas reales), NO es justificación
    // Esto incluye cuando se marca manualmente con horas reales
    if (hasRealEntry || hasRealExit) {
      return false;
    }
    
    // Tiene justificación válida y no tiene entrada ni salida real
    if (asistencia.justification && 
        asistencia.justification.trim().length > 0 &&
        !asistencia.justification.includes('Hoja de asistencia creada automáticamente') &&
        !asistencia.justification.includes('Marcado manual por administrador')) {
      // Si no tiene entrada ni salida, es justificación de ausencia
      if (!asistencia.entryTime && !asistencia.exitTime) {
        return true;
      }
      // Si tiene entrada a las 00:00, también es justificación de ausencia
      if (asistencia.entryTime) {
        const entryDate = new Date(asistencia.entryTime);
        if (entryDate.getHours() === 0 && entryDate.getMinutes() === 0) {
          return true;
        }
      }
    }
    return false;
  }
  
  // Método para determinar si debe mostrar hora de entrada
  shouldShowEntryTime(asistencia: Asistencia): boolean {
    // Si es justificación de ausencia, no mostrar hora de entrada
    if (this.isJustifiedAbsence(asistencia)) {
      return false;
    }
    return true;
  }
  
  // Método para determinar si debe mostrar hora de salida
  shouldShowExitTime(asistencia: Asistencia): boolean {
    // Si es justificación de ausencia, no mostrar hora de salida
    if (this.isJustifiedAbsence(asistencia)) {
      return false;
    }
    return true;
  }
  
  // Método para determinar si debe mostrar actividad
  shouldShowActivity(asistencia: Asistencia): boolean {
    // Si es justificación de ausencia, no mostrar actividad
    if (this.isJustifiedAbsence(asistencia)) {
      return false;
    }
    return true;
  }

  refresh(): void {
    this.loadAsistencias();
  }
  
  updateStats(data: any[]): void {
    this.totalAsistencias = data.length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.asistenciasHoy = data.filter((item: any) => {
      let fecha: Date | null = null;
      if (item.entryTime) {
        fecha = new Date(item.entryTime);
      } else if (item.exitTime) {
        fecha = new Date(item.exitTime);
      } else if (item.createdAt) {
        fecha = new Date(item.createdAt);
      } else if (item.fecha) {
        fecha = item.fecha;
      }
      
      if (!fecha) return false;
      const fechaNormalizada = new Date(fecha);
      fechaNormalizada.setHours(0, 0, 0, 0);
      return fechaNormalizada.getTime() === today.getTime();
    }).length;
  }

  openManualMarkModal(): void {
    this.showManualMarkModal = true;
  }

  closeManualMarkModal(): void {
    this.showManualMarkModal = false;
  }

  onManualMarked(): void {
    // Recargar asistencias después de marcar manualmente
    this.loadAsistencias();
  }


  // Método para obtener el texto del estado de la asistencia
  getStatusText(asistencia: Asistencia): string {
    // Ausencia justificada
    if (this.isJustifiedAbsence(asistencia)) {
      return 'Justificada';
    }
    
    // Ausencia sin justificar
    if (this.isAbsence(asistencia)) {
      return 'Ausente';
    }
    
    // Tiene entrada y salida
    if (asistencia.entryTime && asistencia.exitTime) {
      // Si es tardanza, mostrar "Completa (Tardanza)"
      if (asistencia.isLate) {
        return 'Completa (Tardanza)';
      }
      return 'Completa';
    }
    
    // Solo tiene entrada (pendiente de salida)
    if (asistencia.entryTime && !asistencia.exitTime) {
      // Si es tardanza, mostrar "En curso (Tardanza)"
      if (asistencia.isLate) {
        return 'En curso (Tardanza)';
      }
      return 'En curso';
    }
    
    // Solo tiene salida (caso raro)
    if (!asistencia.entryTime && asistencia.exitTime) {
      return 'Incompleta';
    }
    
    return 'Sin estado';
  }

  // Método para obtener la clase CSS del badge según el estado
  getStatusBadgeClass(asistencia: Asistencia): string {
    // Ausencia justificada
    if (this.isJustifiedAbsence(asistencia)) {
      return 'status-justified';
    }
    
    // Ausencia sin justificar
    if (this.isAbsence(asistencia)) {
      return 'status-absent';
    }
    
    // Si es tardanza, usar clase especial
    if (asistencia.isLate) {
      return 'status-late';
    }
    
    // Tiene entrada y salida
    if (asistencia.entryTime && asistencia.exitTime) {
      return 'status-complete';
    }
    
    // Solo tiene entrada (pendiente de salida)
    if (asistencia.entryTime && !asistencia.exitTime) {
      return 'status-in-progress';
    }
    
    // Solo tiene salida (caso raro)
    if (!asistencia.entryTime && asistencia.exitTime) {
      return 'status-incomplete';
    }
    
    return 'status-unknown';
  }

}
