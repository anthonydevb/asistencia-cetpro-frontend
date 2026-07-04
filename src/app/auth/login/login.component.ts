import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  loading = false;
  companyLogo = 'assets/images/logo-empresa.png'; // Ruta de la imagen de la empresa

  constructor(private router: Router, private authService: AuthService) {}

  onImageError(event: any) {
    // Si la imagen no se encuentra, usar un placeholder o logo por defecto
    event.target.style.display = 'none';
  }

login() {
  this.error = '';
  this.loading = true;

  this.authService.login(this.email, this.password).subscribe({
    next: (user) => {
      console.log('✅ Login exitoso:', user);
      this.loading = false;

      // 🚀 Redirige al dashboard solo si es admin
      if (user.role === 'admin') {
        this.router.navigate(['/dashboard']);
      } else {
        this.error = 'El acceso web es solo para administradores';
      }
    },
    error: (err) => {
      console.error('❌ Error al iniciar sesión:', err);
      this.loading = false;

      // 🔹 Muestra mensaje claro según el backend
      if (err.error?.message === 'El acceso web es solo para administradores') {
        this.error = 'El acceso web es solo para administradores';
      } else if (err.error?.message) {
        this.error = err.error.message;
      } else {
        this.error = 'Correo o contraseña incorrectos';
      }
    },
  });
}


}
