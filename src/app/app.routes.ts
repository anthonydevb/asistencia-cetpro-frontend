import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { AdministradorComponent } from './features/administrador/administrador.component';
import { RegistrarProfesorComponent } from './features/profesores/registrar-profesor/registrar-profesor.component';
import { QrComponent } from './features/attendance/qr/qr.component';

import { NotificationsListComponent } from './notifications/notifications-list/notifications-list.component';
import { SendNotificationComponent } from './notifications/send-notification/send-notification.component';
import { AsistenciaComponent } from './features/attendance/asistencia/asistencia.component';
import { ReportesComponent } from './features/attendance/reportes/reportes.component';
import { ListarDepartamentosComponent } from './features/departamentos/listar-departamentos/listar-departamentos.component';
import { ListarHorariosComponent } from './features/horarios/listar-horarios/listar-horarios.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { JustificacionesComponent } from './features/justificaciones/justificaciones.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  {
    path: '',
    component: SidebarComponent, // layout con sidebar
    canActivate: [authGuard], // Proteger todas las rutas hijas
    children: [
      {path:'dashboard',component:DashboardComponent},
      {path:'administrador',component:AdministradorComponent},
      {path:'profesores',component:RegistrarProfesorComponent},
      {path:'qr',component:QrComponent},
      {path:'asistencia',component:AsistenciaComponent},
      {path:'reportes',component:ReportesComponent},
      {path:'departamentos',component:ListarDepartamentosComponent},
      {path:'horarios',component:ListarHorariosComponent},
      {path:'notifications',component:NotificationsListComponent},
      {path:'send-notification',component:SendNotificationComponent},
      {path:'justificaciones',component:JustificacionesComponent},

      // aquí puedes agregar otras páginas, como dashboard, alumnos, etc.
    ]
  }
];
