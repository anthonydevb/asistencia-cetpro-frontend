import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  error = '';
  success = false;
  tokenValid = false;
  tokenChecked = false;
  email = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Obtener token de la URL
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      
      if (!this.token) {
        this.error = 'Token de recuperación no válido';
        this.tokenChecked = true;
        return;
      }

      // Verificar token
      this.verifyToken();
    });
  }

  verifyToken() {
    this.authService.verifyResetToken(this.token).subscribe({
      next: (response) => {
        this.tokenChecked = true;
        if (response.valid) {
          this.tokenValid = true;
          this.email = response.email || '';
        } else {
          this.error = 'Este link de recuperación ha expirado o ya fue utilizado. Por favor solicita uno nuevo.';
          this.tokenValid = false;
        }
      },
      error: (err) => {
        this.tokenChecked = true;
        this.tokenValid = false;
        this.error = 'Error al verificar el token. Por favor intenta nuevamente.';
        console.error('Error verificando token:', err);
      }
    });
  }

  validatePassword(): { valid: boolean; message: string } {
    if (!this.newPassword || this.newPassword.length < 8) {
      return { valid: false, message: 'La contraseña debe tener al menos 8 caracteres' };
    }

    if (!/[A-Z]/.test(this.newPassword)) {
      return { valid: false, message: 'La contraseña debe contener al menos una mayúscula' };
    }

    if (!/[0-9]/.test(this.newPassword)) {
      return { valid: false, message: 'La contraseña debe contener al menos un número' };
    }

    if (this.newPassword !== this.confirmPassword) {
      return { valid: false, message: 'Las contraseñas no coinciden' };
    }

    return { valid: true, message: '' };
  }

  getPasswordStrength(): string {
    if (!this.newPassword) return '';
    
    let strength = 0;
    if (this.newPassword.length >= 8) strength++;
    if (/[A-Z]/.test(this.newPassword)) strength++;
    if (/[a-z]/.test(this.newPassword)) strength++;
    if (/[0-9]/.test(this.newPassword)) strength++;
    if (/[^A-Za-z0-9]/.test(this.newPassword)) strength++;

    if (strength <= 2) return 'débil';
    if (strength <= 3) return 'media';
    return 'fuerte';
  }

  // Métodos para validación en el template
  hasMinLength(): boolean {
    return this.newPassword ? this.newPassword.length >= 8 : false;
  }

  hasUpperCase(): boolean {
    return this.newPassword ? /[A-Z]/.test(this.newPassword) : false;
  }

  hasNumber(): boolean {
    return this.newPassword ? /[0-9]/.test(this.newPassword) : false;
  }

  passwordsMatch(): boolean {
    if (!this.newPassword || !this.confirmPassword) {
      return false;
    }
    return this.newPassword === this.confirmPassword;
  }

  onSubmit() {
    if (!this.tokenValid) {
      this.error = 'Token inválido o expirado';
      return;
    }

    const validation = this.validatePassword();
    if (!validation.valid) {
      this.error = validation.message;
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = true;
        console.log('✅ Contraseña restablecida:', response);
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (err) => {
        this.loading = false;
        console.error('❌ Error al restablecer contraseña:', err);
        this.error = err.error?.message || 'Error al restablecer la contraseña. Por favor intenta nuevamente.';
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }
}

