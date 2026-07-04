import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  email = '';
  loading = false;
  success = false;
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    if (!this.email || !this.email.trim()) {
      this.error = 'Por favor ingresa tu correo electrónico';
      return;
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.error = 'Por favor ingresa un correo electrónico válido';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = false;

    this.authService.forgotPassword(this.email).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = true;
        console.log('✅ Email de recuperación enviado:', response);
      },
      error: (err) => {
        this.loading = false;
        console.error('❌ Error al solicitar recuperación:', err);
        // Mostrar mensaje genérico (por seguridad)
        this.success = true; // Mostrar mensaje de éxito aunque haya error (por seguridad)
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}

