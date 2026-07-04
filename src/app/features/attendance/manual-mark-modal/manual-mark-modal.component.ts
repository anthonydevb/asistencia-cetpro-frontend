import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { 
  UserCheck, X, Clock, Calendar, User, FileText, AlertCircle, CheckCircle,
  Briefcase, LucideAngularModule 
} from 'lucide-angular';
import { ProfesoresService, Profesor } from '../../profesores.service';
import { DepartamentosService } from '../../departamentos/departamentos.service';
import { HorariosService } from '../../horarios/horarios.service';
import { AttendancesService } from '../attendance.service';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-manual-mark-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './manual-mark-modal.component.html',
  styleUrls: ['./manual-mark-modal.component.scss']
})
export class ManualMarkModalComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() marked = new EventEmitter<void>();

  readonly UserCheck = UserCheck;
  readonly X = X;
  readonly Clock = Clock;
  readonly Calendar = Calendar;
  readonly User = User;
  readonly FileText = FileText;
  readonly AlertCircle = AlertCircle;
  readonly CheckCircle = CheckCircle;
  readonly Briefcase = Briefcase;

  manualForm: FormGroup;
  profesores: Profesor[] = [];
  profesoresFiltrados: Profesor[] = [];
  profesorSeleccionado: Profesor | null = null;
  busquedaProfesor: string = '';
  loading = false;
  errorMessage = '';
  successMessage = '';
  currentUser: any = null;
  checkingAttendance = false;
  hasRealAttendance = false;

  // Listas de departamentos y horarios
  departamentos: any[] = [];
  horarios: any[] = [];

  constructor(
    private fb: FormBuilder,
    private profesoresService: ProfesoresService,
    private departamentosService: DepartamentosService,
    private horariosService: HorariosService,
    private attendancesService: AttendancesService,
    private authService: AuthService
  ) {
    this.manualForm = this.fb.group({
      profesorId: ['', Validators.required],
      accion: ['mark', Validators.required], // 'mark' para marcar asistencia, 'justify' para justificar ausencia
      tipo: ['entry', Validators.required],
      tipoJustificacion: ['absence'], // Para cuando accion es 'justify'
      fecha: ['', Validators.required],
      hora: ['', Validators.required],
      dni: [''],
      justificacion: [''], // Obligatorio si es justificación, opcional si es marcado
      actividad: [''] // Opcional - para cuando se marca salida
    });
  }

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadDepartamentos();
    this.loadHorarios();
    this.loadProfesores();
    this.setDefaultDateTime();
    
    // Cambiar validaciones según la acción seleccionada
    this.manualForm.get('accion')?.valueChanges.subscribe(accion => {
      const justificacionControl = this.manualForm.get('justificacion');
      if (accion === 'justify') {
        // Si es justificación, la justificación es obligatoria
        justificacionControl?.setValidators([Validators.required, Validators.minLength(10)]);
        // No se necesita hora para justificar
        this.manualForm.get('hora')?.clearValidators();
      } else {
        // Si es marcado, la justificación es opcional
        justificacionControl?.clearValidators();
        // La hora es obligatoria para marcar
        this.manualForm.get('hora')?.setValidators([Validators.required]);
      }
      justificacionControl?.updateValueAndValidity();
      this.manualForm.get('hora')?.updateValueAndValidity();
      // Verificar asistencia cuando cambia la acción
      this.checkAttendanceForDate();
    });

    // Verificar asistencia cuando cambia el tipo (entry/exit)
    this.manualForm.get('tipo')?.valueChanges.subscribe(() => {
      this.checkAttendanceForDate();
    });

    // Verificar asistencia cuando cambia la fecha
    this.manualForm.get('fecha')?.valueChanges.subscribe(() => {
      this.checkAttendanceForDate();
    });
  }

  loadUserInfo(): void {
    this.currentUser = this.authService.getUser();
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

  loadHorarios(): void {
    this.horariosService.getHorarios().subscribe({
      next: (data) => {
        this.horarios = data;
      },
      error: (err) => {
        console.error('Error cargando horarios:', err);
      }
    });
  }

  getDepartamentoNombre(departamentoId: number | null | undefined): string {
    if (!departamentoId) return '';
    const dept = this.departamentos.find(d => d.id === departamentoId);
    return dept?.nombre || '';
  }

  getHorarioTexto(horarioId: number | null | undefined): string {
    if (!horarioId) return '';
    const horario = this.horarios.find(h => h.id === horarioId);
    if (!horario) return '';
    return `${horario.hora_entrada} - ${horario.hora_salida}`;
  }

  loadProfesores(): void {
    this.profesoresService.getProfesores().subscribe({
      next: (profesores) => {
        this.profesores = profesores;
        this.profesoresFiltrados = profesores;
      },
      error: (err) => {
        console.error('Error al cargar profesores:', err);
        this.errorMessage = 'Error al cargar la lista de profesores';
      }
    });
  }

  setDefaultDateTime(): void {
    const now = new Date();
    const fecha = now.toISOString().split('T')[0];
    const hora = now.toTimeString().slice(0, 5);
    
    this.manualForm.patchValue({
      fecha,
      hora
    });
  }

  onBusquedaProfesor(): void {
    const busqueda = this.busquedaProfesor.toLowerCase().trim();
    if (!busqueda) {
      this.profesoresFiltrados = this.profesores;
      return;
    }

    this.profesoresFiltrados = this.profesores.filter(p => {
      const departamentoNombre = this.getDepartamentoNombre(p.departamentoId).toLowerCase();
      return p.name.toLowerCase().includes(busqueda) ||
        (p.dni && p.dni.includes(busqueda)) ||
        departamentoNombre.includes(busqueda);
    });
  }

  selectProfesor(profesor: Profesor): void {
    this.profesorSeleccionado = profesor;
    this.manualForm.patchValue({
      profesorId: profesor.id
    });
    this.busquedaProfesor = profesor.name;
    this.profesoresFiltrados = [];
    // Verificar asistencia cuando se selecciona un profesor
    this.checkAttendanceForDate();
  }

  clearProfesorSelection(): void {
    this.profesorSeleccionado = null;
    this.manualForm.patchValue({ profesorId: '' });
    this.busquedaProfesor = '';
    this.profesoresFiltrados = this.profesores;
  }

  verificarDNI(): void {
    const dni = this.manualForm.get('dni')?.value;
    if (!dni || !this.profesorSeleccionado) return;

    if (this.profesorSeleccionado.dni && dni !== this.profesorSeleccionado.dni) {
      this.errorMessage = 'El DNI no coincide con el profesor seleccionado';
    } else {
      this.errorMessage = '';
    }
  }

  checkAttendanceForDate(): void {
    const profesorId = this.manualForm.get('profesorId')?.value;
    const fecha = this.manualForm.get('fecha')?.value;
    const tipo = this.manualForm.get('tipo')?.value;
    const accion = this.manualForm.get('accion')?.value;

    if (!profesorId || !fecha) {
      this.hasRealAttendance = false;
      return;
    }

    // Si es justificación, verificar normalmente
    if (accion === 'justify') {
      this.checkingAttendance = true;
      this.attendancesService.checkRealAttendance(profesorId, fecha).subscribe({
        next: (response) => {
          this.hasRealAttendance = response.hasRealAttendance;
          this.checkingAttendance = false;
          if (this.hasRealAttendance) {
            this.errorMessage = 'Este profesor ya marcó su asistencia para esta fecha. No se puede marcar manualmente ni justificar.';
          } else {
            // Limpiar el mensaje de error si no hay asistencia real
            if (this.errorMessage.includes('ya marcó su asistencia')) {
              this.errorMessage = '';
            }
          }
        },
        error: (err) => {
          console.error('Error al verificar asistencia:', err);
          this.checkingAttendance = false;
        }
      });
    } else if (accion === 'mark' && tipo === 'exit') {
      // Si es marcado de salida, permitir incluso si hay entrada por QR
      // Solo bloquear si ya hay salida registrada
      this.hasRealAttendance = false;
      this.checkingAttendance = false;
      // Limpiar mensaje de error para salida
      if (this.errorMessage.includes('ya marcó su asistencia')) {
        this.errorMessage = '';
      }
    } else {
      // Para entrada, verificar normalmente
      this.checkingAttendance = true;
      this.attendancesService.checkRealAttendance(profesorId, fecha).subscribe({
        next: (response) => {
          this.hasRealAttendance = response.hasRealAttendance;
          this.checkingAttendance = false;
          if (this.hasRealAttendance) {
            this.errorMessage = 'Este profesor ya marcó su asistencia para esta fecha. No se puede marcar manualmente.';
          } else {
            // Limpiar el mensaje de error si no hay asistencia real
            if (this.errorMessage.includes('ya marcó su asistencia')) {
              this.errorMessage = '';
            }
          }
        },
        error: (err) => {
          console.error('Error al verificar asistencia:', err);
          this.checkingAttendance = false;
        }
      });
    }
  }

  onSubmit(): void {
    if (this.manualForm.invalid) {
      this.errorMessage = 'Por favor completa todos los campos requeridos';
      return;
    }

    if (!this.currentUser) {
      this.errorMessage = 'No se pudo obtener la información del usuario';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.manualForm.value;
    const tipo = formValue.tipo;
    const accion = formValue.accion;

    // Verificar nuevamente antes de enviar (solo para entrada o justificación)
    if (this.hasRealAttendance && (accion === 'justify' || tipo === 'entry')) {
      this.errorMessage = 'Este profesor ya marcó su asistencia para esta fecha. No se puede marcar manualmente ni justificar.';
      this.loading = false;
      return;
    }

    if (accion === 'justify') {
      // Justificar ausencia - se guarda como si el profesor hubiera justificado
      const fechaISO = `${formValue.fecha}T00:00:00`;
      const fechaSeleccionada = new Date(fechaISO);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      fechaSeleccionada.setHours(0, 0, 0, 0);

      if (fechaSeleccionada > hoy) {
        this.errorMessage = 'No se puede justificar una fecha futura';
        this.loading = false;
        return;
      }

      const justifyData = {
        professorId: formValue.profesorId,
        date: formValue.fecha, // Formato YYYY-MM-DD
        type: formValue.tipoJustificacion,
        justification: formValue.justificacion.trim(),
        markedBy: this.currentUser.name || 'Administrador' // Enviar nombre del admin
      };

      this.attendancesService.justifyAttendance(justifyData).subscribe({
        next: (response) => {
          this.successMessage = `Ausencia justificada correctamente para ${this.profesorSeleccionado?.name}. Aparecerá como si el profesor hubiera justificado.`;
          this.loading = false;
          
          setTimeout(() => {
            this.closeModal();
            this.marked.emit();
          }, 2000);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.error?.message || 'Error al justificar la ausencia';
          console.error('Error:', err);
        }
      });
    } else {
      // Marcar asistencia manualmente
      const fecha = formValue.fecha;
      const hora = formValue.hora;
      const dateTime = new Date(`${fecha}T${hora}`);

      const data = {
        professorId: formValue.profesorId,
        type: formValue.tipo,
        dateTime: dateTime.toISOString(),
        justification: formValue.justificacion || 'Marcado manual por administrador',
        markedBy: this.currentUser.name || 'Administrador',
        dni: formValue.dni || undefined,
        activity: formValue.actividad || undefined
      };

      this.attendancesService.markManual(data).subscribe({
        next: (response) => {
          const tipoTexto = formValue.tipo === 'entry' ? 'entrada' : 'salida';
          this.successMessage = `${tipoTexto.charAt(0).toUpperCase() + tipoTexto.slice(1)} marcada correctamente para ${this.profesorSeleccionado?.name}`;
          this.loading = false;
          
          setTimeout(() => {
            this.closeModal();
            this.marked.emit();
          }, 2000);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.error?.message || 'Error al marcar la asistencia';
          console.error('Error:', err);
        }
      });
    }
  }

  closeModal(): void {
    this.manualForm.reset({
      accion: 'mark',
      tipo: 'entry',
      tipoJustificacion: 'absence'
    });
    this.profesorSeleccionado = null;
    this.busquedaProfesor = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.setDefaultDateTime();
    this.close.emit();
  }

  getProfesorInfo(): Profesor | null {
    return this.profesorSeleccionado;
  }

  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
}

