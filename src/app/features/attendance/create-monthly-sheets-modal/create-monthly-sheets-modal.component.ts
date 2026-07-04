import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { 
  Calendar, X, Users, CheckCircle, AlertCircle, FileText,
  LucideAngularModule 
} from 'lucide-angular';
import { ProfesoresService, Profesor } from '../../profesores.service';
import { DepartamentosService } from '../../departamentos/departamentos.service';
import { AttendancesService } from '../attendance.service';

@Component({
  selector: 'app-create-monthly-sheets-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './create-monthly-sheets-modal.component.html',
  styleUrls: ['./create-monthly-sheets-modal.component.scss']
})
export class CreateMonthlySheetsModalComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();

  readonly Calendar = Calendar;
  readonly X = X;
  readonly Users = Users;
  readonly CheckCircle = CheckCircle;
  readonly AlertCircle = AlertCircle;
  readonly FileText = FileText;

  monthlyForm: FormGroup;
  busquedaForm: FormGroup;
  profesores: Profesor[] = [];
  profesoresSeleccionados: Profesor[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';
  mostrarSeleccionProfesores = false;

  // Lista de departamentos
  departamentos: any[] = [];

  meses = [
    { value: 1, nombre: 'Enero' },
    { value: 2, nombre: 'Febrero' },
    { value: 3, nombre: 'Marzo' },
    { value: 4, nombre: 'Abril' },
    { value: 5, nombre: 'Mayo' },
    { value: 6, nombre: 'Junio' },
    { value: 7, nombre: 'Julio' },
    { value: 8, nombre: 'Agosto' },
    { value: 9, nombre: 'Septiembre' },
    { value: 10, nombre: 'Octubre' },
    { value: 11, nombre: 'Noviembre' },
    { value: 12, nombre: 'Diciembre' }
  ];

  constructor(
    private fb: FormBuilder,
    private profesoresService: ProfesoresService,
    private departamentosService: DepartamentosService,
    private attendancesService: AttendancesService
  ) {
    const currentDate = new Date();
    this.monthlyForm = this.fb.group({
      mes: [currentDate.getMonth() + 1, Validators.required],
      año: [currentDate.getFullYear(), [Validators.required, Validators.min(2000), Validators.max(2100)]],
      todosProfesores: [true],
    });
    
    this.busquedaForm = this.fb.group({
      busqueda: ['']
    });
  }

  ngOnInit(): void {
    this.loadDepartamentos();
    this.loadProfesores();
    this.monthlyForm.get('todosProfesores')?.valueChanges.subscribe(value => {
      this.mostrarSeleccionProfesores = !value;
      if (value) {
        this.profesoresSeleccionados = [];
      }
    });
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

  getDepartamentoNombre(departamentoId: number | null | undefined): string {
    if (!departamentoId) return '';
    const dept = this.departamentos.find(d => d.id === departamentoId);
    return dept?.nombre || '';
  }

  loadProfesores(): void {
    this.profesoresService.getProfesores().subscribe({
      next: (profesores) => {
        this.profesores = profesores;
      },
      error: (err) => {
        console.error('Error al cargar profesores:', err);
        this.errorMessage = 'Error al cargar la lista de profesores';
      }
    });
  }

  onBusquedaProfesor(): void {
    // La búsqueda se maneja en el template
  }

  toggleProfesor(profesor: Profesor): void {
    const index = this.profesoresSeleccionados.findIndex(p => p.id === profesor.id);
    if (index > -1) {
      this.profesoresSeleccionados.splice(index, 1);
    } else {
      this.profesoresSeleccionados.push(profesor);
    }
  }

  isProfesorSeleccionado(profesor: Profesor): boolean {
    return this.profesoresSeleccionados.some(p => p.id === profesor.id);
  }

  seleccionarTodos(): void {
    if (this.profesoresSeleccionados.length === this.profesores.length) {
      this.profesoresSeleccionados = [];
    } else {
      this.profesoresSeleccionados = [...this.profesores];
    }
  }

  getProfesoresFiltrados(): Profesor[] {
    const busqueda = this.busquedaForm.get('busqueda')?.value || '';
    if (!busqueda.trim()) {
      return this.profesores;
    }
    const busquedaLower = busqueda.toLowerCase().trim();
    return this.profesores.filter(p => 
      p.name.toLowerCase().includes(busquedaLower) ||
      (p.dni && p.dni.includes(busquedaLower)) ||
      (p.departamentoId && this.getDepartamentoNombre(p.departamentoId).toLowerCase().includes(busquedaLower))
    );
  }

  onSubmit(): void {
    if (this.monthlyForm.invalid) {
      this.errorMessage = 'Por favor completa todos los campos requeridos';
      return;
    }

    if (!this.monthlyForm.get('todosProfesores')?.value && this.profesoresSeleccionados.length === 0) {
      this.errorMessage = 'Debes seleccionar al menos un profesor o seleccionar "Todos los profesores"';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.monthlyForm.value;
    const mes = formValue.mes;
    const año = formValue.año;
    const professorIds: number[] | undefined = formValue.todosProfesores 
      ? undefined 
      : this.profesoresSeleccionados
          .map(p => p.id)
          .filter((id): id is number => id !== undefined && id !== null) as number[];

    this.attendancesService.createMonthlySheets(año, mes, professorIds).subscribe({
      next: (response) => {
        this.loading = false;
        const mesNombre = this.meses.find(m => m.value === mes)?.nombre || '';
        this.successMessage = `¡Hojas de asistencia creadas exitosamente! 
          ${response.created} hojas creadas para ${mesNombre} ${año}
          ${response.skipped > 0 ? `, ${response.skipped} omitidas (ya existían)` : ''}`;
        
        setTimeout(() => {
          this.closeModal();
          this.created.emit();
        }, 3000);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Error al crear las hojas de asistencia';
        console.error('Error:', err);
      }
    });
  }

  closeModal(): void {
    const currentDate = new Date();
    this.monthlyForm.reset({
      mes: currentDate.getMonth() + 1,
      año: currentDate.getFullYear(),
      todosProfesores: true
    });
    this.busquedaForm.reset({ busqueda: '' });
    this.profesoresSeleccionados = [];
    this.mostrarSeleccionProfesores = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.close.emit();
  }

  getMesNombre(): string {
    const mes = this.monthlyForm.get('mes')?.value;
    return this.meses.find(m => m.value === mes)?.nombre || '';
  }

  getFormattedSuccessMessage(): string {
    if (!this.successMessage) return '';
    return this.successMessage.replace(/\n/g, '<br>');
  }
}

