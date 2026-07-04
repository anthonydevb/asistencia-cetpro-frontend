import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HorariosService, Horario } from '../horarios.service';
import { 
  LucideAngularModule, 
  Edit3, 
  Trash2, 
  Plus,
  X,
  Clock,
  FileText,
  Search,
  CheckCircle,
  AlertCircle
} from 'lucide-angular';

@Component({
  selector: 'app-listar-horarios',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './listar-horarios.component.html',
  styleUrls: ['./listar-horarios.component.scss']
})
export class ListarHorariosComponent implements OnInit {
  horarios: Horario[] = [];
  filteredHorarios: Horario[] = [];
  searchText: string = '';
  
  // Modal
  modalOpen: boolean = false;
  editingHorario: Horario | null = null;
  formData: { 
    hora_entrada: string; 
    hora_salida: string;
    tolerancia_entrada: number;
  } = {
    hora_entrada: '',
    hora_salida: '',
    tolerancia_entrada: 30
  };
  
  loading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  // Íconos
  readonly Edit3 = Edit3;
  readonly Trash2 = Trash2;
  readonly Plus = Plus;
  readonly X = X;
  readonly Clock = Clock;
  readonly FileText = FileText;
  readonly Search = Search;
  readonly CheckCircle = CheckCircle;
  readonly AlertCircle = AlertCircle;

  constructor(private horariosService: HorariosService) {}

  ngOnInit(): void {
    this.loadHorarios();
  }

  loadHorarios(): void {
    this.loading = true;
    this.horariosService.getHorarios().subscribe({
      next: (data) => {
        this.horarios = data;
        this.filteredHorarios = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando horarios:', err);
        this.errorMessage = 'Error al cargar los horarios';
        this.loading = false;
      }
    });
  }

  filterHorarios(): void {
    const term = this.searchText.toLowerCase().trim();
    if (!term) {
      this.filteredHorarios = this.horarios;
      return;
    }
    this.filteredHorarios = this.horarios.filter(horario =>
      horario.hora_entrada.includes(term) ||
      horario.hora_salida.includes(term)
    );
  }

  openModal(horario?: Horario): void {
    if (horario) {
      this.editingHorario = horario;
      this.formData = {
        hora_entrada: horario.hora_entrada,
        hora_salida: horario.hora_salida,
        tolerancia_entrada: horario.tolerancia_entrada ?? 30
      };
    } else {
      this.editingHorario = null;
      this.formData = {
        hora_entrada: '',
        hora_salida: '',
        tolerancia_entrada: 30
      };
    }
    this.modalOpen = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeModal(): void {
    this.modalOpen = false;
    this.editingHorario = null;
    this.formData = {
      hora_entrada: '',
      hora_salida: '',
      tolerancia_entrada: 30
    };
    this.errorMessage = '';
    this.successMessage = '';
  }

  validateTimeFormat(time: string): boolean {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  validateTimeRange(): boolean {
    if (!this.formData.hora_entrada || !this.formData.hora_salida) {
      return false;
    }

    const [entradaH, entradaM] = this.formData.hora_entrada.split(':').map(Number);
    const [salidaH, salidaM] = this.formData.hora_salida.split(':').map(Number);
    
    const entradaMinutos = entradaH * 60 + entradaM;
    const salidaMinutos = salidaH * 60 + salidaM;
    
    return entradaMinutos < salidaMinutos;
  }

  saveHorario(): void {
    // Validar formato de hora
    if (!this.formData.hora_entrada.trim() || !this.formData.hora_salida.trim()) {
      this.errorMessage = 'Ambas horas son requeridas';
      return;
    }

    if (!this.validateTimeFormat(this.formData.hora_entrada)) {
      this.errorMessage = 'El formato de hora de entrada debe ser HH:mm (ej: 08:00)';
      return;
    }

    if (!this.validateTimeFormat(this.formData.hora_salida)) {
      this.errorMessage = 'El formato de hora de salida debe ser HH:mm (ej: 17:00)';
      return;
    }

    if (!this.validateTimeRange()) {
      this.errorMessage = 'La hora de entrada debe ser menor que la hora de salida';
      return;
    }

    // Validar tolerancia de entrada
    if (this.formData.tolerancia_entrada < 0 || this.formData.tolerancia_entrada > 120) {
      this.errorMessage = 'La tolerancia de entrada debe estar entre 0 y 120 minutos';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.editingHorario) {
      // Actualizar
      this.horariosService.actualizarHorario(
        this.editingHorario.id!,
        this.formData
      ).subscribe({
        next: () => {
          this.successMessage = 'Horario actualizado exitosamente';
          this.loadHorarios();
          setTimeout(() => {
            this.closeModal();
          }, 1500);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Error al actualizar el horario';
          this.loading = false;
        }
      });
    } else {
      // Crear
      this.horariosService.crearHorario(this.formData).subscribe({
        next: () => {
          this.successMessage = 'Horario creado exitosamente';
          this.loadHorarios();
          setTimeout(() => {
            this.closeModal();
          }, 1500);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Error al crear el horario';
          this.loading = false;
        }
      });
    }
  }

  deleteHorario(id: number): void {
    if (!confirm('¿Está seguro de que desea eliminar este horario?')) {
      return;
    }

    this.loading = true;
    this.horariosService.eliminarHorario(id).subscribe({
      next: () => {
        this.successMessage = 'Horario eliminado exitosamente';
        this.loadHorarios();
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error al eliminar el horario';
        this.loading = false;
        setTimeout(() => {
          this.errorMessage = '';
        }, 3000);
      }
    });
  }

  formatTime(time: string): string {
    return time || '—';
  }
}

