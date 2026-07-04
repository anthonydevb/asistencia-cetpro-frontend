import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProfesoresService, Profesor } from '../../profesores.service';
import { DepartamentosService, Departamento } from '../../departamentos/departamentos.service';
import { HorariosService, Horario } from '../../horarios/horarios.service';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  UserRoundPlus,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  X,
  UserPen,
  Users,
  BookOpen
} from 'lucide-angular';
import { ListarProfesoresComponent } from '../listar-profesores/listar-profesores.component';

@Component({
  selector: 'app-registrar-profesor',
  templateUrl: './registrar-profesor.component.html',
  styleUrls: ['./registrar-profesor.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, ListarProfesoresComponent],
  standalone: true
})
export class RegistrarProfesorComponent implements OnInit {
  // Íconos
  readonly UserRoundPlus = UserRoundPlus;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly CheckCircle = CheckCircle;
  readonly AlertCircle = AlertCircle;
  readonly X = X;
  readonly UserPen = UserPen;
  readonly Users = Users;
  readonly BookOpen = BookOpen;
  
  // Estadísticas
  totalProfesores = 0;

  profesorForm: FormGroup;
  modalProfesorOpen = false;
  showPassword = false;
  showNewPassword = false;
  showCurrentPassword = false;
  successMessage = '';
  errorMessage = '';
  editingProfesorId: number | null = null;
  currentPassword: string = ''; // Contraseña actual del profesor
  consultandoDni = false; // Estado de carga al consultar DNI

  // Listas de departamentos y horarios
  departamentos: Departamento[] = [];
  horarios: Horario[] = [];
  loadingDepartamentos = false;
  loadingHorarios = false;

  constructor(
    private fb: FormBuilder,
    private profesoresService: ProfesoresService,
    private departamentosService: DepartamentosService,
    private horariosService: HorariosService,
    private cdr: ChangeDetectorRef
  ) {
    this.profesorForm = this.fb.group({
      name: ['', Validators.required],
      apellidos: [''], // Apellidos (opcional)
      dni: ['', Validators.required],
      phone: ['', Validators.required],
      address: ['', Validators.required],
      departamentoId: [null, Validators.required],
      horarioId: [null, Validators.required],
      email: ['', [Validators.required, Validators.email]],
      currentPassword: [''], // Contraseña actual (solo lectura en edición)
      newPassword: [''] // Nueva contraseña (opcional en edición, obligatoria en creación)
    });

    // Validación condicional: nueva contraseña es obligatoria solo al crear
    this.profesorForm.get('newPassword')?.setValidators([Validators.required]);
  }

  ngOnInit(): void {
    this.loadDepartamentos();
    this.loadHorarios();
    this.loadTotalProfesores();
  }
  
  loadTotalProfesores(): void {
    this.profesoresService.getProfesores().subscribe({
      next: (profesores) => {
        this.totalProfesores = profesores.length;
      },
      error: (err) => {
        console.error('Error cargando profesores:', err);
      }
    });
  }

  loadDepartamentos(): void {
    this.loadingDepartamentos = true;
    this.departamentosService.getDepartamentos().subscribe({
      next: (data) => {
        this.departamentos = data;
        this.loadingDepartamentos = false;
      },
      error: (err) => {
        console.error('Error cargando departamentos:', err);
        this.loadingDepartamentos = false;
      }
    });
  }

  loadHorarios(): void {
    this.loadingHorarios = true;
    this.horariosService.getHorarios().subscribe({
      next: (data) => {
        this.horarios = data;
        this.loadingHorarios = false;
      },
      error: (err) => {
        console.error('Error cargando horarios:', err);
        this.loadingHorarios = false;
      }
    });
  }

  // Abrir modal vacío (modo crear)
  openProfesorModal() {
    this.modalProfesorOpen = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.editingProfesorId = null;
    this.currentPassword = '';
    this.profesorForm.reset();
    // En modo crear, nueva contraseña es obligatoria
    this.profesorForm.get('newPassword')?.setValidators([Validators.required]);
    this.profesorForm.get('newPassword')?.updateValueAndValidity();
    this.profesorForm.get('currentPassword')?.clearValidators();
    this.profesorForm.get('currentPassword')?.updateValueAndValidity();
  }

  // Abrir modal en modo edición (desde el listado)
  onEditarProfesor(profesor: Profesor) {
    this.editingProfesorId = profesor.id || null;
    this.modalProfesorOpen = true;
    this.successMessage = '';
    this.errorMessage = '';

    // Obtener datos completos del profesor incluyendo contraseña
    if (profesor.id) {
      this.profesoresService.getProfesorById(profesor.id).subscribe({
        next: (profesorCompleto) => {
          this.currentPassword = profesorCompleto.password || '';
          this.profesorForm.patchValue({
            name: profesorCompleto.name,
            apellidos: profesorCompleto.apellidos || '',
            dni: profesorCompleto.dni,
            phone: profesorCompleto.phone,
            address: profesorCompleto.address,
            departamentoId: profesorCompleto.departamentoId || null,
            horarioId: profesorCompleto.horarioId || null,
            email: profesorCompleto.email,
            currentPassword: profesorCompleto.password || '', // Mostrar contraseña actual
            newPassword: '' // Nueva contraseña vacía
          });
          // En modo edición, nueva contraseña es opcional
          this.profesorForm.get('newPassword')?.clearValidators();
          this.profesorForm.get('newPassword')?.updateValueAndValidity();
          this.profesorForm.get('currentPassword')?.clearValidators();
          this.profesorForm.get('currentPassword')?.updateValueAndValidity();
        },
        error: (err) => {
          console.error('Error al cargar profesor:', err);
          // Si falla, usar los datos básicos que ya tenemos
          this.profesorForm.patchValue({
            name: profesor.name,
            apellidos: profesor.apellidos || '',
            dni: profesor.dni,
            phone: profesor.phone,
            address: profesor.address,
            departamentoId: profesor.departamentoId || null,
            horarioId: profesor.horarioId || null,
            email: profesor.email,
            currentPassword: '',
            newPassword: ''
          });
        }
      });
    }
  }

  // Cerrar modal
  closeProfesorModal() {
    this.modalProfesorOpen = false;
  }

  // Consultar datos por DNI cuando se ingresa o pierde el foco
  onDniBlur() {
    // Solo consultar si estamos en modo crear (no edición) y el DNI tiene 8 dígitos
    if (this.editingProfesorId === null) {
      const dni = this.profesorForm.get('dni')?.value;
      if (dni && dni.length === 8 && /^\d+$/.test(dni)) {
        console.log('Consultando DNI:', dni);
        this.consultarDni(dni);
      } else if (dni && dni.length > 0) {
        console.log('DNI inválido o incompleto:', dni);
      }
    }
  }

  // Consultar cuando se ingresa el DNI (al completar 8 dígitos)
  onDniInput() {
    if (this.editingProfesorId === null) {
      const dni = this.profesorForm.get('dni')?.value;
      if (dni && dni.length === 8 && /^\d+$/.test(dni)) {
        // Esperar un momento para que el usuario termine de escribir
        setTimeout(() => {
          const currentDni = this.profesorForm.get('dni')?.value;
          if (currentDni === dni && currentDni.length === 8) {
            console.log('Consultando DNI automáticamente:', currentDni);
            this.consultarDni(currentDni);
          }
        }, 500);
      }
    }
  }

  // Consultar DNI en la API externa
  consultarDni(dni: string) {
    // Solo consultar si el campo nombre está vacío (para no sobrescribir si ya tiene datos)
    const nombreActual = this.profesorForm.get('name')?.value;
    if (nombreActual && nombreActual.trim()) {
      console.log('El nombre ya tiene datos, no se consultará el DNI');
      return; // Ya tiene nombre, no consultar
    }

    // Evitar consultas duplicadas
    if (this.consultandoDni) {
      console.log('Ya hay una consulta en curso');
      return;
    }

    this.consultandoDni = true;
    this.errorMessage = ''; // Limpiar errores anteriores
    console.log('Iniciando consulta de DNI:', dni);

    this.profesoresService.consultarPorDni(dni).subscribe({
      next: (data) => {
        console.log('Datos recibidos de la API:', data);
        // Autocompletar el campo nombre y apellidos con los datos recibidos
        // El backend ya devuelve nombre y apellidos separados
        if (data && data.name) {
          this.profesorForm.patchValue({
            name: data.name,
            apellidos: data.apellidos || ''
          });
          // Forzar detección de cambios para asegurar que se actualice la vista
          this.cdr.detectChanges();
          console.log('Nombre autocompletado:', data.name);
          console.log('Apellidos autocompletados:', data.apellidos);
          console.log('Valor del formulario después de patchValue:', {
            name: this.profesorForm.get('name')?.value,
            apellidos: this.profesorForm.get('apellidos')?.value
          });
        } else {
          console.warn('La API no devolvió un nombre válido. Datos recibidos:', data);
        }
        this.consultandoDni = false;
      },
      error: (err) => {
        this.consultandoDni = false;
        console.error('Error completo al consultar DNI:', err);
        // Mostrar mensaje de error al usuario
        if (err.status === 404 || err.error?.statusCode === 404) {
          // DNI no encontrado
          this.errorMessage = 'DNI no encontrado en RENIEC. Puede llenar los datos manualmente.';
          console.log('DNI no encontrado, puede llenar los datos manualmente');
        } else if (err.status === 0) {
          // Error de conexión
          this.errorMessage = 'Error de conexión. Verifique que el backend esté corriendo.';
          console.error('Error de conexión con el backend');
        } else {
          // Otro tipo de error
          this.errorMessage = `Error al consultar DNI: ${err.error?.message || err.message || 'Error desconocido'}`;
          console.error('Error al consultar DNI:', err);
        }
      }
    });
  }

  // Mostrar/ocultar contraseña actual
  toggleCurrentPasswordVisibility() {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  // Mostrar/ocultar nueva contraseña
  toggleNewPasswordVisibility() {
    this.showNewPassword = !this.showNewPassword;
  }

  // Crear o actualizar profesor
  registrarProfesor() {
    // Validación: verificar campos requeridos
    const formValue = this.profesorForm.value;
    
    // En modo edición, nueva contraseña es opcional, así que validamos manualmente
    if (this.editingProfesorId) {
      if (!formValue.name || !formValue.dni || !formValue.phone || 
          !formValue.address || !formValue.departamentoId || 
          !formValue.horarioId || !formValue.email) {
        this.errorMessage = 'Por favor completa todos los campos requeridos.';
        return;
      }
    } else {
      // En modo crear, todos los campos son obligatorios incluyendo nueva contraseña
      if (this.profesorForm.invalid) {
        this.errorMessage = 'Por favor completa todos los campos correctamente.';
        return;
      }
    }

    if (this.editingProfesorId) {
      // 🔄 Actualizar profesor
      const profesorData: Partial<Profesor> = {
        name: formValue.name,
        apellidos: formValue.apellidos || '',
        dni: formValue.dni,
        phone: formValue.phone,
        address: formValue.address,
        departamentoId: formValue.departamentoId,
        horarioId: formValue.horarioId,
        email: formValue.email
      };

      // Solo actualizar contraseña si se proporciona una nueva
      if (formValue.newPassword && formValue.newPassword.trim()) {
        profesorData.password = formValue.newPassword;
      }

      this.profesoresService.actualizarProfesor(this.editingProfesorId, profesorData).subscribe({
        next: (res) => {
          this.successMessage = `Profesor ${res.name} actualizado correctamente.`;
          this.loadTotalProfesores(); // Actualizar contador
          this.closeProfesorModal();
          this.profesorForm.reset();
          this.editingProfesorId = null;
          this.currentPassword = '';
        },
        error: (err) => {
          this.errorMessage = `Error al actualizar: ${err.error?.message || err.message}`;
        }
      });
    } else {
      // 🆕 Crear profesor
      const profesorData: Profesor = {
        name: formValue.name,
        apellidos: formValue.apellidos || '',
        dni: formValue.dni,
        phone: formValue.phone,
        address: formValue.address,
        departamentoId: formValue.departamentoId,
        horarioId: formValue.horarioId,
        email: formValue.email,
        password: formValue.newPassword // Usar newPassword para crear
      };

      this.profesoresService.crearProfesor(profesorData).subscribe({
        next: (res) => {
          this.successMessage = `Profesor ${res.name} registrado correctamente.`;
          this.loadTotalProfesores(); // Actualizar contador
          this.profesorForm.reset();
          this.closeProfesorModal();
        },
        error: (err) => {
          this.errorMessage = `Error al crear profesor: ${err.error?.message || err.message}`;
        }
      });
    }
  }
}
