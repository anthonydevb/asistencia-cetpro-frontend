import { Component, HostListener, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { 
  LucideAngularModule,
  GraduationCap,
  Menu,
  LayoutDashboard,
  UserPen,
  CheckSquare,
  QrCode,
  BarChart3,
  LogOut,
  ShieldUser,
  Bell,
  Send,
  FileText,
  Building2,
  Calendar,
  Clock
} from 'lucide-angular';
import { AuthService } from '../../auth/auth.service';
import { NotificationBellComponent } from '../../notifications/notification-bell/notification-bell.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, NotificationBellComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  isCollapsed = false;
  isFullscreen = false;
  currentUser: any = null;

  // Íconos
  readonly GraduationCap = GraduationCap;
  readonly Menu = Menu;
  readonly LayoutDashboard = LayoutDashboard;
  readonly UserPen = UserPen ;
  readonly CheckSquare = CheckSquare;
  readonly QrCode = QrCode;
  readonly BarChart3 = BarChart3;
  readonly LogOut = LogOut;
  readonly ShieldUser = ShieldUser;
  readonly Bell = Bell;
  readonly Send = Send;
  readonly FileText = FileText;
  readonly Building2 = Building2;
  readonly Calendar = Calendar;
  readonly Clock = Clock;

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.loadUserInfo();
  }

  loadUserInfo() {
    this.currentUser = this.authService.getUser();
  }

  toggleSidebar() {
    if (isPlatformBrowser(this.platformId) && window.innerWidth <= 768) {
      this.isFullscreen = !this.isFullscreen;
    } else {
      this.isCollapsed = !this.isCollapsed;
    }
  }

  closeSidebar() {
    this.isFullscreen = false;
  }

  @HostListener('window:resize')
  onResize() {
    if (isPlatformBrowser(this.platformId) && window.innerWidth > 768) {
      this.isFullscreen = false;
    }
  }

  toggleTheme() {
    console.log("Aquí pones tu lógica de tema oscuro/claro");
  }

  logout() {
    // Confirmar antes de cerrar sesión
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      // Cerrar sesión en el servicio
      this.authService.logout();
      
      // Limpiar información del usuario en el componente
      this.currentUser = null;
      
      // Redirigir al login
      this.router.navigate(['/login']).then(() => {
        console.log('✅ Sesión cerrada correctamente');
      });
    }
  }

  getUserInitial(): string {
    if (this.currentUser?.name) {
      return this.currentUser.name.charAt(0).toUpperCase();
    }
    return 'A';
  }

  getUserName(): string {
    return this.currentUser?.name || 'Administrador';
  }

  getUserEmail(): string {
    return this.currentUser?.email || 'admin@cetpre.edu';
  }
}
