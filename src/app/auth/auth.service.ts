import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environment/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;// Tu backend
  private currentUser: any = null;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // 🚀 Login
  login(email: string, password: string): Observable<{ id: number; name: string; role: string }> {
    return this.http
      .post<{ id: number; name: string; role: string }>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap((user) => {
          console.log(' Login correcto:', user);
          this.currentUser = user;
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('user', JSON.stringify(user));
          }
        }),
        catchError((error) => {
          console.error('❌ Error en login:', error);
          return throwError(() => error);
        })
      );
  }

  // Obtener usuario actual
  getUser() {
    if (!this.currentUser && isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('user');
      this.currentUser = stored ? JSON.parse(stored) : null;
    }
    return this.currentUser;
  }

  logout() {
    this.currentUser = null;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('user');
    }
  }

  // 🔹 Solicitar recuperación de contraseña
  forgotPassword(email: string, frontendUrl?: string): Observable<{ message: string }> {
    const url = frontendUrl || (isPlatformBrowser(this.platformId) ? window.location.origin : 'http://localhost:4200');
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/forgot-password`, {
      email,
      frontendUrl: url
    });
  }

  // 🔹 Verificar token de recuperación
  verifyResetToken(token: string): Observable<{ valid: boolean; email?: string }> {
    return this.http.get<{ valid: boolean; email?: string }>(`${this.apiUrl}/auth/verify-reset-token/${token}`);
  }

  // 🔹 Resetear contraseña
  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/reset-password`, {
      token,
      newPassword
    });
  }

  // 🔹 Verificar si un email está disponible
  checkEmail(email: string, excludeId?: number): Observable<{ available: boolean }> {
    let url = `${this.apiUrl}/users/check-email?email=${encodeURIComponent(email)}`;
    if (excludeId) {
      url += `&excludeId=${excludeId}`;
    }
    return this.http.get<{ available: boolean }>(url);
  }
}
