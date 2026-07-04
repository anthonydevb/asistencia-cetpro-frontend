import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdministradorService, Admin } from './administrador.service';
import { 
  LucideAngularModule, 
  UserPen, UserPlus, Trash2, X, Eye, EyeOff, CheckCircle, AlertCircle, Users 
} from 'lucide-angular';

@Component({
  selector: 'app-administrador',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './administrador.component.html',
  styleUrls: ['./administrador.component.scss'],
})
export class AdministradorComponent implements OnInit {

  // íconos
  readonly UserPen = UserPen;
  readonly UserPlus = UserPlus;
  readonly Trash2 = Trash2;
  readonly X = X;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly CheckCircle = CheckCircle;
  readonly AlertCircle = AlertCircle;
  readonly Users = Users;

  fb = inject(FormBuilder);
  adminService = inject(AdministradorService);

  adminForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  admins: Admin[] = [];
  modalAdminOpen = false;
  editingAdminId: number | null = null;
  successMessage = '';
  errorMessage = '';
  showPassword = false; // para toggle de contraseña

  ngOnInit() {
    this.loadAdmins();
  }

  loadAdmins() {
    this.adminService.getAdmins().subscribe({
      next: data => this.admins = data,
      error: err => this.errorMessage = 'Error cargando administradores: ' + (err.error?.message || err.message)
    });
  }

  openAdminModal(admin?: Admin) {
    if (admin) {
      this.editingAdminId = admin.id!;
      this.adminForm.setValue({
        name: admin.name,
        email: admin.email,
        password: ''
      });
    } else {
      this.editingAdminId = null;
      this.adminForm.reset();
    }
    this.modalAdminOpen = true;
    this.successMessage = '';
    this.errorMessage = '';
  }

  closeAdminModal() {
    this.modalAdminOpen = false;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  registerAdmin() {
    if (this.adminForm.invalid) return;

    const admin: Admin = {
      ...this.adminForm.value,
      role: 'admin'
    };

    if (this.editingAdminId) {
      this.adminService.updateAdmin(this.editingAdminId, admin).subscribe({
        next: () => {
          this.successMessage = 'Administrador actualizado correctamente';
          this.loadAdmins();
          this.adminForm.reset();
          this.modalAdminOpen = false;
        },
        error: err => this.errorMessage = err.error?.message || err.message
      });
    } else {
      this.adminService.createAdmin(admin).subscribe({
        next: () => {
          this.successMessage = 'Administrador registrado correctamente';
          this.loadAdmins();
          this.adminForm.reset();
          this.modalAdminOpen = false;
        },
        error: err => this.errorMessage = err.error?.message || err.message
      });
    }
  }

  deleteAdmin(id: number) {
    if (!confirm('¿Deseas eliminar este administrador?')) return;
    this.adminService.deleteAdmin(id).subscribe({
      next: () => this.loadAdmins(),
      error: err => this.errorMessage = err.error?.message || err.message
    });
  }
}
