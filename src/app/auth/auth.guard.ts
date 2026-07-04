import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getUser();
  
  if (!user) {
    // Usuario no autenticado, redirigir al login
    router.navigate(['/login']);
    return false;
  }

  // Usuario autenticado, permitir acceso
  return true;
};

