import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DepartamentosService, Departamento } from '../departamentos.service';
import { 
  LucideAngularModule, 
  Edit3, 
  Trash2, 
  Plus,
  X,
  Building2,
  FileText,
  Search,
  CheckCircle,
  AlertCircle
} from 'lucide-angular';

@Component({
  selector: 'app-listar-departamentos',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './listar-departamentos.component.html',
  styleUrls: ['./listar-departamentos.component.scss']
})
export class ListarDepartamentosComponent implements OnInit {
  departamentos: Departamento[] = [];
  filteredDepartamentos: Departamento[] = [];
  searchText: string = '';
  
  // Modal
  modalOpen: boolean = false;
  editingDepartamento: Departamento | null = null;
  formData: { nombre: string; descripcion: string } = {
    nombre: '',
    descripcion: ''
  };
  
  loading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  // Íconos
  readonly Edit3 = Edit3;
  readonly Trash2 = Trash2;
  readonly Plus = Plus;
  readonly X = X;
  readonly Building2 = Building2;
  readonly FileText = FileText;
  readonly Search = Search;
  readonly CheckCircle = CheckCircle;
  readonly AlertCircle = AlertCircle;

  constructor(private departamentosService: DepartamentosService) {}

  ngOnInit(): void {
    this.loadDepartamentos();
  }

  loadDepartamentos(): void {
    this.loading = true;
    this.departamentosService.getDepartamentos().subscribe({
      next: (data) => {
        this.departamentos = data;
        this.filteredDepartamentos = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando departamentos:', err);
        this.errorMessage = 'Error al cargar las especialidades';
        this.loading = false;
      }
    });
  }

  filterDepartamentos(): void {
    const term = this.searchText.toLowerCase().trim();
    if (!term) {
      this.filteredDepartamentos = this.departamentos;
      return;
    }
    this.filteredDepartamentos = this.departamentos.filter(dept =>
      dept.nombre.toLowerCase().includes(term) ||
      (dept.descripcion && dept.descripcion.toLowerCase().includes(term))
    );
  }

  openModal(departamento?: Departamento): void {
    if (departamento) {
      this.editingDepartamento = departamento;
      this.formData = {
        nombre: departamento.nombre,
        descripcion: departamento.descripcion || ''
      };
    } else {
      this.editingDepartamento = null;
      this.formData = {
        nombre: '',
        descripcion: ''
      };
    }
    this.modalOpen = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  closeModal(): void {
    this.modalOpen = false;
    this.editingDepartamento = null;
    this.formData = {
      nombre: '',
      descripcion: ''
    };
    this.errorMessage = '';
    this.successMessage = '';
  }

  saveDepartamento(): void {
    if (!this.formData.nombre.trim()) {
      this.errorMessage = 'El nombre es requerido';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.editingDepartamento) {
      // Actualizar
      this.departamentosService.actualizarDepartamento(
        this.editingDepartamento.id!,
        this.formData
      ).subscribe({
        next: () => {
          this.successMessage = 'Especialidad actualizada exitosamente';
          this.loadDepartamentos();
          setTimeout(() => {
            this.closeModal();
          }, 1500);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Error al actualizar la especialidad';
          this.loading = false;
        }
      });
    } else {
      // Crear
      this.departamentosService.crearDepartamento(this.formData).subscribe({
        next: () => {
          this.successMessage = 'Especialidad creada exitosamente';
          this.loadDepartamentos();
          setTimeout(() => {
            this.closeModal();
          }, 1500);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Error al crear la especialidad';
          this.loading = false;
        }
      });
    }
  }

  deleteDepartamento(id: number): void {
    if (!confirm('¿Está seguro de que desea eliminar esta especialidad?')) {
      return;
    }

    this.loading = true;
    this.departamentosService.eliminarDepartamento(id).subscribe({
      next: () => {
        this.successMessage = 'Especialidad eliminada exitosamente';
        this.loadDepartamentos();
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error al eliminar la especialidad';
        this.loading = false;
        setTimeout(() => {
          this.errorMessage = '';
        }, 3000);
      }
    });
  }
}

