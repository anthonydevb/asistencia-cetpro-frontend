import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { ProfesoresService, Profesor } from '../../profesores.service';
import { DepartamentosService, Departamento } from '../../departamentos/departamentos.service';
import { HorariosService, Horario } from '../../horarios/horarios.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, forkJoin } from 'rxjs';
import { 
  LucideAngularModule, 
  Edit3, 
  Trash2,
  UserRound,
  IdCard,
  Phone,
  Home,
  BookOpen,
  Lock,
  KeyRound,
  Settings2,
  LogIn,
  LogOut,
  Eye,
  X,
  Download,
  UserPen,
  Plus
} from 'lucide-angular';
import { Workbook } from 'exceljs';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

@Component({
  selector: 'app-listar-profesores',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './listar-profesores.component.html',
  styleUrls: ['./listar-profesores.component.scss']
})
export class ListarProfesoresComponent implements OnInit, OnDestroy {
  profesores: Profesor[] = [];
  filteredProfesores: Profesor[] = [];
  searchText: string = '';
  private subscriptions: Subscription[] = [];

  @Output() editarProfesor = new EventEmitter<Profesor>(); // 🔹

  // Íconos
  readonly Edit3 = Edit3;
  readonly Trash2 = Trash2;
  readonly UserRound = UserRound;
  readonly IdCard = IdCard;
  readonly UserPen = UserPen;
  readonly Plus = Plus;
  readonly Phone = Phone;
  readonly Home = Home;
  readonly BookOpen = BookOpen;
  readonly Lock = Lock;
  readonly KeyRound = KeyRound;
  readonly Settings2 = Settings2;
  readonly LogIn = LogIn;
  readonly LogOut = LogOut;
  readonly Eye = Eye;
  readonly X = X;
  readonly Download = Download;

  // Modal de detalles
  selectedProfessor: Profesor | null = null;
  showDetailsModal: boolean = false;
  loadingDetails: boolean = false;

  // Listas de departamentos y horarios
  departamentos: Departamento[] = [];
  horarios: Horario[] = [];

  // Filtro de exportación por especialidad
  exportFilterDepartamentoId: number | null = null;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private profesoresService: ProfesoresService,
    private departamentosService: DepartamentosService,
    private horariosService: HorariosService,
    private websocketService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.loadDepartamentosAndHorarios();
    this.loadProfesores();
    this.setupWebSocketListeners();
  }

  loadDepartamentosAndHorarios(): void {
    forkJoin({
      departamentos: this.departamentosService.getDepartamentos(),
      horarios: this.horariosService.getHorarios()
    }).subscribe({
      next: (data) => {
        this.departamentos = data.departamentos || [];
        this.horarios = data.horarios || [];
      },
      error: (err) => {
        console.error('Error cargando departamentos y horarios:', err);
        this.departamentos = [];
        this.horarios = [];
        this.errorMessage = 'Error al cargar las especialidades. Por favor, recarga la página.';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  getDepartamentoNombre(departamentoId: number | null | undefined): string {
    if (!departamentoId) return '—';
    const dept = this.departamentos.find(d => d.id === departamentoId);
    return dept?.nombre || '—';
  }

  getHorarioTexto(horarioId: number | null | undefined): string {
    if (!horarioId) return '—';
    const horario = this.horarios.find(h => h.id === horarioId);
    if (!horario) return '—';
    return `${horario.hora_entrada} - ${horario.hora_salida}`;
  }

  ngOnDestroy(): void {
    // Limpiar todas las suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  setupWebSocketListeners(): void {
    // Escuchar cuando se crea un profesor
    const createdSub = this.websocketService.onProfessorCreated().subscribe((professor) => {
      console.log('🆕 Profesor creado en tiempo real:', professor);
      this.loadProfesores(); // Recargar lista
    });

    // Escuchar cuando se actualiza un profesor
    const updatedSub = this.websocketService.onProfessorUpdated().subscribe((professor) => {
      console.log('🔄 Profesor actualizado en tiempo real:', professor);
      // Actualizar el profesor en la lista sin recargar todo
      const index = this.profesores.findIndex(p => p.id === professor.id);
      if (index !== -1) {
        this.profesores[index] = { ...this.profesores[index], ...professor };
        this.filterProfesores();
      } else {
        this.loadProfesores(); // Si no está en la lista, recargar
      }
    });

    // Escuchar cuando se elimina un profesor
    const deletedSub = this.websocketService.onProfessorDeleted().subscribe((data) => {
      console.log('🗑️ Profesor eliminado en tiempo real:', data);
      this.profesores = this.profesores.filter(p => p.id !== data.id);
      this.filterProfesores();
    });

    // Escuchar actualizaciones generales de la lista
    const listUpdatedSub = this.websocketService.onProfessorsListUpdated().subscribe(() => {
      console.log('📋 Lista de profesores actualizada en tiempo real');
      this.loadProfesores();
    });

    this.subscriptions.push(createdSub, updatedSub, deletedSub, listUpdatedSub);
  }

  loadProfesores(): void {
    this.profesoresService.getProfesores().subscribe({
      next: (data: Profesor[]) => {
        this.profesores = data;
        this.filteredProfesores = data;
      },
      error: (err) => console.error('Error cargando profesores', err)
    });
  }

  filterProfesores(): void {
    const term = this.searchText.toLowerCase().trim();
    if (!term) {
      this.filteredProfesores = this.profesores;
      return;
    }
    
    this.filteredProfesores = this.profesores.filter((prof) => {
      const departamentoNombre = this.getDepartamentoNombre(prof.departamentoId).toLowerCase();
      const horarioTexto = this.getHorarioTexto(prof.horarioId).toLowerCase();
      
      return prof.name.toLowerCase().includes(term) ||
        prof.dni?.toLowerCase().includes(term) ||
        prof.phone?.toLowerCase().includes(term) ||
        prof.address?.toLowerCase().includes(term) ||
        departamentoNombre.includes(term) ||
        horarioTexto.includes(term) ||
        prof.email.toLowerCase().includes(term);
    });
  }

  onEdit(prof: Profesor) {
    this.editarProfesor.emit(prof); // 🔹 Emitimos al padre
  }

  deleteProfesor(profesor: Profesor) {
    if (!confirm(`¿Deseas eliminar al profesor ${profesor.name}?`)) return;
    if (profesor.id) {
      this.profesoresService.eliminarProfesor(profesor.id).subscribe({
        next: () => {
          this.profesores = this.profesores.filter((p) => p.id !== profesor.id);
          this.filterProfesores();
        },
        error: (err) => console.error('Error eliminando profesor', err)
      });
    }
  }

  formatTime(time: string | null | undefined): string {
    if (!time) return '—';
    try {
      // Si viene en formato HH:mm:ss, solo tomar HH:mm
      if (time.includes(':')) {
        const parts = time.split(':');
        if (parts.length >= 2) {
          return `${parts[0]}:${parts[1]}`;
        }
      }
      return time;
    } catch {
      return '—';
    }
  }

  // Ver detalles completos del profesor
  viewProfessorDetails(prof: Profesor): void {
    if (!prof.id) {
      console.error('El profesor no tiene ID');
      return;
    }

    this.loadingDetails = true;
    this.showDetailsModal = true;

    // Obtener todos los datos del profesor desde el backend
    this.profesoresService.getProfesorById(prof.id).subscribe({
      next: (professorData: Profesor) => {
        this.selectedProfessor = professorData;
        this.loadingDetails = false;
      },
      error: (err) => {
        console.error('Error cargando detalles del profesor', err);
        this.loadingDetails = false;
        // Si falla, usar los datos que ya tenemos
        this.selectedProfessor = prof;
      }
    });
  }

  // Cerrar modal de detalles
  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedProfessor = null;
    this.loadingDetails = false;
  }

  // Obtener profesores filtrados para exportación
  getFilteredProfesoresForExport(): Profesor[] {
    if (this.exportFilterDepartamentoId === null) {
      return this.profesores;
    }
    return this.profesores.filter(p => p.departamentoId === this.exportFilterDepartamentoId);
  }

  // Obtener contador de profesores por especialidad
  getDepartamentoCount(deptId: number | undefined): number {
    if (!deptId) return 0;
    return this.profesores.filter(p => p.departamentoId === deptId).length;
  }

  // Exportar a CSV
  exportToCSV(): void {
    const filteredData = this.getFilteredProfesoresForExport();
    
    if (!filteredData.length) {
      this.errorMessage = 'No hay profesores que coincidan con el filtro seleccionado';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    const headers = ['Nombre', 'Apellidos', 'DNI', 'Teléfono', 'Dirección', 'Especialidad'];
    const rows = filteredData.map((prof: Profesor) => [
      prof.name || '—',
      prof.apellidos || '—',
      prof.dni || '—',
      prof.phone || '—',
      prof.address || '—',
      this.getDepartamentoNombre(prof.departamentoId)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const filterSuffix = this.exportFilterDepartamentoId !== null 
      ? `_${this.departamentos.find(d => d.id === this.exportFilterDepartamentoId)?.nombre.toLowerCase().replace(/\s+/g, '-') || 'departamento'}`
      : '';
    link.setAttribute('download', `profesores${filterSuffix}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    this.successMessage = `CSV exportado: ${filteredData.length} profesores`;
    setTimeout(() => this.successMessage = '', 3000);
  }

  // Exportar a Excel
  async exportToExcel(): Promise<void> {
    const filteredData = this.getFilteredProfesoresForExport();
    
    if (!filteredData.length) {
      this.errorMessage = 'No hay profesores que coincidan con el filtro seleccionado';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    try {
      const workbook = new Workbook();
      workbook.creator = 'Sistema de Asistencia CETPRE';
      workbook.created = new Date();
      workbook.modified = new Date();

      const worksheet = workbook.addWorksheet('Profesores');

      // Estilos
      const headerStyle = {
        font: { 
          bold: true, 
          size: 12, 
          color: { argb: 'FFFFFFFF' },
          name: 'Arial'
        },
        fill: {
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: 'FF667EEA' }
        },
        alignment: { 
          horizontal: 'center' as const, 
          vertical: 'middle' as const,
          wrapText: true
        },
        border: {
          top: { style: 'thin' as const, color: { argb: 'FF000000' } },
          left: { style: 'thin' as const, color: { argb: 'FF000000' } },
          bottom: { style: 'thin' as const, color: { argb: 'FF000000' } },
          right: { style: 'thin' as const, color: { argb: 'FF000000' } }
        }
      };

      const titleStyle = {
        font: { 
          bold: true, 
          size: 16, 
          color: { argb: 'FF1F2937' },
          name: 'Arial'
        },
        alignment: { 
          horizontal: 'center' as const, 
          vertical: 'middle' as const
        }
      };

      const infoStyle = {
        font: { 
          size: 10, 
          color: { argb: 'FF6B7280' },
          name: 'Arial'
        },
        alignment: { 
          horizontal: 'center' as const, 
          vertical: 'middle' as const
        }
      };

      // Título
      worksheet.mergeCells('A1:F2');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'REPORTE DE PROFESORES';
      titleCell.style = titleStyle;

      // Información
      worksheet.mergeCells('A3:F3');
      const infoCell = worksheet.getCell('A3');
      const deptName = this.exportFilterDepartamentoId !== null 
        ? this.departamentos.find(d => d.id === this.exportFilterDepartamentoId)?.nombre || 'Todos'
        : 'Todos';
      infoCell.value = `Generado el ${new Date().toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })} | Total: ${filteredData.length} profesores | Especialidad: ${deptName}`;
      infoCell.style = infoStyle;

      // Encabezados
      const headers = ['Nombre', 'Apellidos', 'DNI', 'Teléfono', 'Dirección', 'Especialidad'];
      worksheet.addRow(headers);
      const headerRow = worksheet.getRow(4);
      headerRow.eachCell((cell) => {
        cell.style = headerStyle;
      });

      // Datos
      filteredData.forEach((prof: Profesor) => {
        worksheet.addRow([
          prof.name || '—',
          prof.apellidos || '—',
          prof.dni || '—',
          prof.phone || '—',
          prof.address || '—',
          this.getDepartamentoNombre(prof.departamentoId)
        ]);
      });

      // Ajustar ancho de columnas
      worksheet.columns = [
        { width: 25 }, // Nombre
        { width: 25 }, // Apellidos
        { width: 15 }, // DNI
        { width: 15 }, // Teléfono
        { width: 30 }, // Dirección
        { width: 25 }  // Departamento
      ];

      // Congelar fila de encabezados
      worksheet.views = [
        {
          state: 'frozen',
          ySplit: 4
        }
      ];

      // Generar archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const filterSuffix = this.exportFilterDepartamentoId !== null 
        ? `_${this.departamentos.find(d => d.id === this.exportFilterDepartamentoId)?.nombre.toLowerCase().replace(/\s+/g, '-') || 'especialidad'}`
        : '';
      link.setAttribute('download', `profesores${filterSuffix}_${new Date().toISOString().split('T')[0]}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.successMessage = `Excel exportado: ${filteredData.length} profesores`;
      setTimeout(() => this.successMessage = '', 3000);
    } catch (error: any) {
      console.error('Error al exportar a Excel:', error);
      this.errorMessage = 'Error al exportar el archivo Excel: ' + (error.message || 'Error desconocido');
      setTimeout(() => this.errorMessage = '', 3000);
    }
  }

  // Exportar a PDF
  async exportToPDF(): Promise<void> {
    const filteredData = this.getFilteredProfesoresForExport();
    
    if (!filteredData.length) {
      this.errorMessage = 'No hay profesores que coincidan con el filtro seleccionado';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      
      // Título
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORTE DE PROFESORES', 148, 15, { align: 'center' });

      // Información
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const deptName = this.exportFilterDepartamentoId !== null 
        ? this.departamentos.find(d => d.id === this.exportFilterDepartamentoId)?.nombre || 'Todos'
        : 'Todos';
      const infoText = `Generado el ${new Date().toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })} | Total: ${filteredData.length} profesores | Especialidad: ${deptName}`;
      doc.text(infoText, 148, 22, { align: 'center' });

      // Preparar datos para la tabla
      const tableData = filteredData.map((prof: Profesor) => [
        prof.name || '—',
        prof.apellidos || '—',
        prof.dni || '—',
        prof.phone || '—',
        prof.address || '—',
        this.getDepartamentoNombre(prof.departamentoId)
      ]);

      // Crear tabla
      (doc as any).autoTable({
        head: [['Nombre', 'Apellidos', 'DNI', 'Teléfono', 'Dirección', 'Especialidad']],
        body: tableData,
        startY: 28,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        headStyles: {
          fillColor: [102, 126, 234],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        columnStyles: {
          0: { cellWidth: 40 }, // Nombre
          1: { cellWidth: 40 }, // Apellidos
          2: { cellWidth: 25 }, // DNI
          3: { cellWidth: 30 }, // Teléfono
          4: { cellWidth: 50 }, // Dirección
          5: { cellWidth: 40 }  // Especialidad
        },
        margin: { top: 28, right: 10, bottom: 10, left: 10 }
      });

      // Guardar PDF
      const filterSuffix = this.exportFilterDepartamentoId !== null 
        ? `_${this.departamentos.find(d => d.id === this.exportFilterDepartamentoId)?.nombre.toLowerCase().replace(/\s+/g, '-') || 'especialidad'}`
        : '';
      doc.save(`profesores${filterSuffix}_${new Date().toISOString().split('T')[0]}.pdf`);

      this.successMessage = `PDF exportado: ${filteredData.length} profesores`;
      setTimeout(() => this.successMessage = '', 3000);
    } catch (error: any) {
      console.error('Error al exportar a PDF:', error);
      this.errorMessage = 'Error al exportar el archivo PDF: ' + (error.message || 'Error desconocido');
      setTimeout(() => this.errorMessage = '', 3000);
    }
  }
}
