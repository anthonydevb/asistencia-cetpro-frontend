import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  LucideAngularModule, 
  BarChart3, 
  Calendar, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  Download,
  Filter
} from 'lucide-angular';
// Importar interfaces y servicios de reportes
import { ReportsService, AttendanceReport, ReportStats } from '../reports.service';
import { DepartamentosService } from '../../departamentos/departamentos.service';
import { forkJoin } from 'rxjs';
import { Workbook, Worksheet } from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss']
})
export class ReportesComponent implements OnInit {
  readonly BarChart3 = BarChart3;
  readonly Calendar = Calendar;
  readonly Users = Users;
  readonly CheckCircle = CheckCircle;
  readonly XCircle = XCircle;
  readonly Clock = Clock;
  readonly FileText = FileText;
  readonly Download = Download;
  readonly Filter = Filter;

  // Tipo de reporte: 'daily' | 'weekly' | 'monthly'
  reportType: 'daily' | 'weekly' | 'monthly' = 'monthly';
  
  // Para reportes mensuales
  selectedYear: number = new Date().getFullYear();
  selectedMonth: number = new Date().getMonth() + 1;
  
  // Para reportes diarios
  selectedDate: string = new Date().toISOString().split('T')[0];
  
  // Para reportes semanales
  selectedWeekStart: string = this.getWeekStartDate();
  selectedWeekEnd: string = this.getWeekEndDate();
  
  loading = false;
  syncing = false;
  errorMessage = '';
  successMessage = '';
  
  asistencias: AttendanceReport[] = [];
  asistenciasFiltradas: AttendanceReport[] = [];
  stats: ReportStats | null = null;
  departamentos: any[] = [];

  // Filtros de exportación
  exportFilters = {
    soloJustificaciones: false,
    soloTardanzas: false,
    departamentoId: null as number | null,
    estado: '' as '' | 'Completa' | 'Justificada' | 'Pendiente Salida' | 'Sin Entrada' | 'Ausente',
    soloManuales: false
  };

  meses = [
    { value: 1, nombre: 'Enero' },
    { value: 2, nombre: 'Febrero' },
    { value: 3, nombre: 'Marzo' },
    { value: 4, nombre: 'Abril' },
    { value: 5, nombre: 'Mayo' },
    { value: 6, nombre: 'Junio' },
    { value: 7, nombre: 'Julio' },
    { value: 8, nombre: 'Agosto' },
    { value: 9, nombre: 'Septiembre' },
    { value: 10, nombre: 'Octubre' },
    { value: 11, nombre: 'Noviembre' },
    { value: 12, nombre: 'Diciembre' }
  ];

  years: number[] = [];

  constructor(
    private reportsService: ReportsService,
    private departamentosService: DepartamentosService
  ) {
    // Generar años desde 2020 hasta el año actual + 1
    const currentYear = new Date().getFullYear();
    for (let i = 2020; i <= currentYear + 1; i++) {
      this.years.push(i);
    }
  }

  ngOnInit(): void {
    this.loadDepartamentos();
    this.loadReport();
  }

  // Obtener el inicio de la semana (lunes)
  getWeekStartDate(): string {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para que lunes sea 1
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split('T')[0];
  }

  // Obtener el fin de la semana (domingo)
  getWeekEndDate(): string {
    const start = new Date(this.selectedWeekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end.toISOString().split('T')[0];
  }

  onReportTypeChange(): void {
    // Actualizar fechas cuando cambia el tipo
    if (this.reportType === 'weekly') {
      this.selectedWeekStart = this.getWeekStartDate();
      this.selectedWeekEnd = this.getWeekEndDate();
    } else if (this.reportType === 'daily') {
      this.selectedDate = new Date().toISOString().split('T')[0];
    }
    this.loadReport();
  }

  onWeekStartChange(): void {
    // Actualizar fin de semana cuando cambia el inicio
    this.selectedWeekEnd = this.getWeekEndDate();
    this.loadReport();
  }

  loadDepartamentos(): void {
    this.departamentosService.getDepartamentos().subscribe({
      next: (data) => {
        this.departamentos = data;
      },
      error: (err) => {
        console.error('Error cargando departamentos:', err);
      }
    });
  }

  loadReport(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.reportType === 'daily') {
      // Reporte diario - usar la fecha directamente en formato YYYY-MM-DD
      // El backend normalizará las horas
      const dateStr = this.selectedDate; // Ya está en formato YYYY-MM-DD
      
      console.log('📅 Cargando reporte diario para fecha:', dateStr);
      
      this.reportsService.getByDateRange(
        dateStr,
        dateStr
      ).subscribe({
        next: (asistencias: AttendanceReport[]) => {
          console.log('✅ Reportes recibidos:', asistencias?.length || 0);
          this.asistencias = asistencias || [];
          this.applyFilters();
          this.calculateStats();
          this.loading = false;
          
          if (this.asistencias.length === 0) {
            this.errorMessage = `No hay registros de asistencia para la fecha ${this.formatDate(dateStr)}. Asegúrate de que los datos estén sincronizados.`;
          }
        },
        error: (err: any) => {
          this.loading = false;
          this.errorMessage = err.error?.message || 'Error al cargar el reporte diario';
          console.error('❌ Error al cargar reporte diario:', err);
        }
      });
    } else if (this.reportType === 'weekly') {
      // Reporte semanal
      this.reportsService.getByDateRange(
        this.selectedWeekStart,
        this.selectedWeekEnd
      ).subscribe({
        next: (asistencias: AttendanceReport[]) => {
          this.asistencias = asistencias || [];
          this.applyFilters();
          this.calculateStats();
          this.loading = false;
        },
        error: (err: any) => {
          this.loading = false;
          this.errorMessage = err.error?.message || 'Error al cargar el reporte';
          console.error('Error:', err);
        }
      });
    } else {
      // Reporte mensual (existente)
      forkJoin({
        asistencias: this.reportsService.getByYearMonth(this.selectedYear, this.selectedMonth),
        stats: this.reportsService.getStatsByYearMonth(this.selectedYear, this.selectedMonth)
      }).subscribe({
        next: (data) => {
          this.asistencias = data.asistencias || [];
          this.applyFilters();
          this.stats = data.stats || null;
          this.loading = false;
        },
        error: (err: any) => {
          this.loading = false;
          this.errorMessage = err.error?.message || 'Error al cargar el reporte';
          console.error('Error:', err);
        }
      });
    }
  }

  // Calcular estadísticas manualmente para reportes diarios y semanales
  calculateStats(): void {
    if (!this.asistencias.length) {
      this.stats = {
        year: this.selectedYear,
        month: this.selectedMonth,
        totalReports: 0,
        withEntry: 0,
        withExit: 0,
        justified: 0,
        absences: 0,
        manual: 0,
        tardanzas: 0,
        reports: []
      };
      return;
    }

    const stats: ReportStats = {
      year: this.selectedYear,
      month: this.selectedMonth,
      totalReports: this.asistencias.length,
      withEntry: this.asistencias.filter(a => a.entryTime).length,
      withExit: this.asistencias.filter(a => a.exitTime).length,
      justified: this.asistencias.filter(a => a.justification && a.justification.trim().length > 0).length,
      absences: this.asistencias.filter(a => !a.entryTime && !a.exitTime && !a.justification).length,
      manual: this.asistencias.filter(a => a.isManual).length,
      tardanzas: this.asistencias.filter(a => a.isLate === true).length,
      reports: this.asistencias
    };

    this.stats = stats;
  }

  syncAllAttendances(): void {
    if (!confirm('¿Está seguro de que desea sincronizar todas las asistencias históricas a la tabla de reportes? Esto puede tardar varios minutos.')) {
      return;
    }

    this.syncing = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.reportsService.syncAllAttendances().subscribe({
      next: (result) => {
        this.syncing = false;
        this.successMessage = `Sincronización completada: ${result.synced} asistencias sincronizadas, ${result.errors} errores, ${result.skipped || 0} omitidas`;
        // Recargar el reporte actual después de sincronizar
        setTimeout(() => {
          this.loadReport();
        }, 1000);
      },
      error: (err) => {
        this.syncing = false;
        this.errorMessage = err.error?.message || 'Error al sincronizar asistencias';
        console.error('Error:', err);
      }
    });
  }

  onFilterChange(): void {
    this.loadReport();
  }

  onExportFilterChange(): void {
    this.applyFilters();
  }

  formatDate(date: string | Date | null): string {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }

  formatTime(date: string | Date | null): string {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  getEstadoAsistencia(attendance: AttendanceReport): string {
    if (attendance.justification && attendance.justification.trim().length > 0) {
      return 'Justificada';
    }
    if (!attendance.entryTime && !attendance.exitTime) {
      return 'Ausente';
    }
    if (!attendance.entryTime) return 'Sin Entrada';
    if (!attendance.exitTime) return 'Pendiente Salida';
    return 'Completa';
  }

  getEstadoColor(attendance: AttendanceReport): string {
    const estado = this.getEstadoAsistencia(attendance);
    if (estado === 'Completa') return 'success';
    if (estado === 'Justificada') return 'info';
    if (estado === 'Pendiente Salida' || estado === 'Sin Entrada') return 'warning';
    return 'danger';
  }

  getProfessorName(attendance: AttendanceReport): string {
    return attendance.professor?.name || 'N/A';
  }

  getProfessorSpecialty(attendance: AttendanceReport): string {
    if (!attendance.professor?.departamentoId) return '—';
    const dept = this.departamentos.find(d => d.id === attendance.professor?.departamentoId);
    return dept?.nombre || '—';
  }

  getMesNombre(): string {
    return this.meses.find(m => m.value === this.selectedMonth)?.nombre || '';
  }

  getReportTitle(): string {
    if (this.reportType === 'daily') {
      return `Reporte Diario - ${this.formatDate(this.selectedDate)}`;
    } else if (this.reportType === 'weekly') {
      return `Reporte Semanal - ${this.formatDate(this.selectedWeekStart)} al ${this.formatDate(this.selectedWeekEnd)}`;
    } else {
      return `Reporte Mensual - ${this.getMesNombre()} ${this.selectedYear}`;
    }
  }

  getReportFileName(): string {
    if (this.reportType === 'daily') {
      return `Reporte_Diario_${this.selectedDate}`;
    } else if (this.reportType === 'weekly') {
      return `Reporte_Semanal_${this.selectedWeekStart}_${this.selectedWeekEnd}`;
    } else {
      return `Reporte_${this.getMesNombre()}_${this.selectedYear}`;
    }
  }

  // Aplicar filtros en tiempo real
  applyFilters(): void {
    let filtered = [...this.asistencias];

    // Filtro por justificaciones
    if (this.exportFilters.soloJustificaciones) {
      filtered = filtered.filter(att => att.justification && att.justification.trim().length > 0);
    }

    // Filtro por tardanzas
    if (this.exportFilters.soloTardanzas) {
      filtered = filtered.filter(att => att.isLate === true);
    }

    // Filtro por departamento
    if (this.exportFilters.departamentoId !== null) {
      filtered = filtered.filter(att => att.professor?.departamentoId === this.exportFilters.departamentoId);
    }

    // Filtro por estado
    if (this.exportFilters.estado) {
      filtered = filtered.filter(att => this.getEstadoAsistencia(att) === this.exportFilters.estado);
    }

    // Filtro por marcados manuales
    if (this.exportFilters.soloManuales) {
      filtered = filtered.filter(att => att.isManual === true);
    }

    this.asistenciasFiltradas = filtered;
  }

  // Obtener datos filtrados para exportación (usa los mismos filtros)
  getFilteredData(): AttendanceReport[] {
    return this.asistenciasFiltradas;
  }

  // Verificar si hay filtros activos
  hasActiveFilters(): boolean {
    return this.exportFilters.soloJustificaciones ||
           this.exportFilters.soloTardanzas ||
           this.exportFilters.soloManuales ||
           this.exportFilters.departamentoId !== null ||
           this.exportFilters.estado !== '';
  }

  // Limpiar todos los filtros
  clearFilters(): void {
    this.exportFilters = {
      soloJustificaciones: false,
      soloTardanzas: false,
      departamentoId: null,
      estado: '',
      soloManuales: false
    };
    this.applyFilters();
  }

  // Métodos para obtener contadores dinámicos
  getJustificacionesCount(): number {
    return this.asistencias.filter((a: AttendanceReport) => a.justification && a.justification.trim().length > 0).length;
  }

  getTardanzasCount(): number {
    return this.asistencias.filter((a: AttendanceReport) => a.isLate === true).length;
  }

  getManualesCount(): number {
    return this.asistencias.filter((a: AttendanceReport) => a.isManual === true).length;
  }

  getDepartamentoCount(deptId: number): number {
    return this.asistencias.filter((a: AttendanceReport) => a.professor?.departamentoId === deptId).length;
  }

  getEstadoCount(estado: string): number {
    return this.asistencias.filter((a: AttendanceReport) => this.getEstadoAsistencia(a) === estado).length;
  }

  // Obtener sufijo para el nombre del archivo basado en filtros
  getFilterSuffix(): string {
    const parts: string[] = [];
    if (this.exportFilters.soloJustificaciones) parts.push('justificaciones');
    if (this.exportFilters.soloTardanzas) parts.push('tardanzas');
    if (this.exportFilters.soloManuales) parts.push('manuales');
    if (this.exportFilters.departamentoId !== null) {
      const dept = this.departamentos.find(d => d.id === this.exportFilters.departamentoId);
      if (dept) parts.push(dept.nombre.toLowerCase().replace(/\s+/g, '-'));
    }
    if (this.exportFilters.estado) parts.push(this.exportFilters.estado.toLowerCase().replace(/\s+/g, '-'));
    return parts.length > 0 ? `_${parts.join('-')}` : '';
  }

  // Obtener información de filtros aplicados
  getFilterInfo(): string {
    const parts: string[] = [];
    if (this.exportFilters.soloJustificaciones) parts.push('Solo Justificaciones');
    if (this.exportFilters.soloTardanzas) parts.push('Solo Tardanzas');
    if (this.exportFilters.soloManuales) parts.push('Solo Manuales');
    if (this.exportFilters.departamentoId !== null) {
      const dept = this.departamentos.find(d => d.id === this.exportFilters.departamentoId);
      if (dept) parts.push(`Dept: ${dept.nombre}`);
    }
    if (this.exportFilters.estado) parts.push(`Estado: ${this.exportFilters.estado}`);
    return parts.join(', ');
  }

  exportToCSV(): void {
    const filteredData = this.getFilteredData();
    
    if (!filteredData.length) {
      this.errorMessage = 'No hay datos que coincidan con los filtros seleccionados';
      return;
    }

    const headers = ['Fecha', 'Profesor', 'Especialidad', 'Hora Entrada', 'Hora Salida', 'Actividad', 'Registrado Por', 'Tardanza', 'Estado', 'Justificación'];
    const rows = filteredData.map((att: AttendanceReport) => [
      this.formatDate(att.fecha),
      this.getProfessorName(att),
      this.getProfessorSpecialty(att),
      this.formatTime(att.entryTime),
      this.formatTime(att.exitTime),
      att.activity || '—',
      att.markedBy || '—',
      att.isLate ? 'Sí' : 'No',
      this.getEstadoAsistencia(att),
      att.justification || '—'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const filterSuffix = this.getFilterSuffix();
    link.setAttribute('download', `${this.getReportFileName()}${filterSuffix}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.successMessage = `CSV exportado: ${filteredData.length} registros`;
    setTimeout(() => this.successMessage = '', 3000);
  }

  async exportToExcel(): Promise<void> {
    const filteredData = this.getFilteredData();
    
    if (!filteredData.length) {
      this.errorMessage = 'No hay datos que coincidan con los filtros seleccionados';
      return;
    }

    try {
      // Crear un nuevo workbook
      const workbook = new Workbook();
      workbook.creator = 'Sistema de Asistencia CETPRE';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Crear la hoja de trabajo
      const worksheet = workbook.addWorksheet(this.getReportTitle().substring(0, 31)); // Excel limita nombres a 31 caracteres

      // Definir estilos
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
          fgColor: { argb: 'FF667EEA' } // Color morado/azul
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

      // Añadir título
      worksheet.mergeCells('A1:J2');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = `REPORTE DE ASISTENCIA - ${this.getReportTitle().toUpperCase()}`;
      titleCell.style = titleStyle;

      // Añadir información adicional
      worksheet.mergeCells('A3:J3');
      const infoCell = worksheet.getCell('A3');
      const filterInfo = this.getFilterInfo();
      infoCell.value = `Generado el ${new Date().toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })} | Total de registros: ${filteredData.length}${filterInfo ? ` | Filtros: ${filterInfo}` : ''}`;
      infoCell.style = infoStyle;

      // Añadir estadísticas si están disponibles
      if (this.stats) {
        worksheet.mergeCells('A4:J4');
        const statsCell = worksheet.getCell('A4');
        const tardanzasCount = filteredData.filter((a: AttendanceReport) => a.isLate === true).length;
        const justificadasCount = filteredData.filter((a: AttendanceReport) => a.justification && a.justification.trim().length > 0).length;
        statsCell.value = `Estadísticas del filtro: ${filteredData.filter((a: AttendanceReport) => a.entryTime).length} con entrada | ${filteredData.filter((a: AttendanceReport) => a.exitTime).length} con salida | ${justificadasCount} justificadas | ${tardanzasCount} tardanzas`;
        statsCell.style = infoStyle;
      }

      // Definir encabezados
      const headers = [
        'Fecha',
        'Profesor',
        'Especialidad',
        'Hora Entrada',
        'Hora Salida',
        'Actividad',
        'Registrado Por',
        'Tardanza',
        'Estado',
        'Justificación'
      ];

      // Añadir encabezados
      const headerRow = worksheet.addRow(headers);
      headerRow.height = 30;
      headerRow.eachCell((cell, colNumber) => {
        cell.style = headerStyle;
      });

      // Añadir datos
      filteredData.forEach((att, index) => {
        const row = worksheet.addRow([
          this.formatDate(att.fecha),
          this.getProfessorName(att),
          this.getProfessorSpecialty(att),
          this.formatTime(att.entryTime),
          this.formatTime(att.exitTime),
          att.activity || '—',
          att.markedBy || '—',
          att.isLate ? 'Sí' : 'No',
          this.getEstadoAsistencia(att),
          att.justification || '—'
        ]);

        // Estilos para las filas según el estado
        const estadoColor = this.getEstadoColor(att);
        let rowFillColor = 'FFFFFFFF'; // Blanco por defecto

        switch (estadoColor) {
          case 'success':
            rowFillColor = 'FFD1FAE5'; // Verde claro
            break;
          case 'info':
            rowFillColor = 'FFDBEAFE'; // Azul claro
            break;
          case 'warning':
            rowFillColor = 'FFFEF3C7'; // Amarillo claro
            break;
          case 'danger':
            rowFillColor = 'FFFEE2E2'; // Rojo claro
            break;
        }

        row.height = 20;
        row.eachCell((cell, colNumber) => {
          cell.style = {
            font: { 
              size: 10, 
              name: 'Arial',
              color: { argb: 'FF1F2937' }
            },
            fill: {
              type: 'pattern' as const,
              pattern: 'solid' as const,
              fgColor: { argb: rowFillColor }
            },
            alignment: { 
              vertical: 'middle' as const,
              wrapText: true
            },
            border: {
              top: { style: 'thin' as const, color: { argb: 'FFE5E7EB' } },
              left: { style: 'thin' as const, color: { argb: 'FFE5E7EB' } },
              bottom: { style: 'thin' as const, color: { argb: 'FFE5E7EB' } },
              right: { style: 'thin' as const, color: { argb: 'FFE5E7EB' } }
            }
          };

          // Estilo especial para la columna de estado
          if (colNumber === 7) {
            const estado = this.getEstadoAsistencia(att);
            let estadoColor = 'FF1F2937';
            if (estado === 'Completa') estadoColor = 'FF10B981';
            else if (estado === 'Justificada') estadoColor = 'FF3B82F6';
            else if (estado === 'Pendiente Salida' || estado === 'Sin Entrada') estadoColor = 'FFF59E0B';
            else if (estado === 'Ausente') estadoColor = 'FFEF4444';

            cell.font = { 
              ...cell.font,
              bold: true,
              color: { argb: estadoColor }
            };
          }
        });
      });

      // Ajustar ancho de columnas
      worksheet.columns = [
        { width: 12 }, // Fecha
        { width: 25 }, // Profesor
        { width: 20 }, // Especialidad
        { width: 12 }, // Hora Entrada
        { width: 12 }, // Hora Salida
        { width: 30 }, // Actividad
        { width: 15 }, // Registrado Por
        { width: 12 }, // Tardanza
        { width: 15 }, // Estado
        { width: 30 }  // Justificación
      ];

      // Congelar la fila de encabezados
      worksheet.views = [
        {
          state: 'frozen',
          ySplit: 4 // Congelar hasta la fila 4 (después del título e info)
        }
      ];

      // Generar el archivo Excel
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      const filterSuffix = this.getFilterSuffix();
      link.setAttribute('download', `${this.getReportFileName()}${filterSuffix}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.successMessage = `Excel exportado: ${filteredData.length} registros`;
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    } catch (error: any) {
      console.error('Error al exportar a Excel:', error);
      this.errorMessage = 'Error al exportar el archivo Excel: ' + (error.message || 'Error desconocido');
    }
  }

  async exportToPDF(): Promise<void> {
    const filteredData = this.getFilteredData();
    
    if (!filteredData.length) {
      this.errorMessage = 'No hay datos que coincidan con los filtros seleccionados';
      return;
    }

    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      
      // Título del reporte
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(this.getReportTitle(), 14, 15);
      
      // Información adicional
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generado el ${new Date().toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, 14, 22);
      doc.text(`Total de registros: ${filteredData.length}`, 14, 27);
      
      const filterInfo = this.getFilterInfo();
      if (filterInfo) {
        doc.setFontSize(8);
        doc.text(`Filtros aplicados: ${filterInfo}`, 14, 32);
      }
      
      // Estadísticas si están disponibles
      if (this.stats) {
        doc.setFontSize(9);
        const yPos = filterInfo ? 37 : 32;
        const tardanzasCount = filteredData.filter((a: AttendanceReport) => a.isLate === true).length;
        const justificadasCount = filteredData.filter((a: AttendanceReport) => a.justification && a.justification.trim().length > 0).length;
        doc.text(
          `Estadísticas: ${filteredData.filter((a: AttendanceReport) => a.entryTime).length} con entrada | ${filteredData.filter((a: AttendanceReport) => a.exitTime).length} con salida | ${justificadasCount} justificadas | ${tardanzasCount} tardanzas`,
          14,
          yPos
        );
      }

      // Preparar datos para la tabla
      const tableData = filteredData.map((att: AttendanceReport) => [
        this.formatDate(att.fecha),
        this.getProfessorName(att),
        this.getProfessorSpecialty(att),
        this.formatTime(att.entryTime),
        this.formatTime(att.exitTime),
        att.activity || '—',
        att.markedBy || '—',
        att.isLate ? 'Sí' : 'No',
        this.getEstadoAsistencia(att),
        (att.justification || '—').substring(0, 30) // Limitar longitud
      ]);

      // Crear tabla
      autoTable(doc, {
        head: [['Fecha', 'Profesor', 'Especialidad', 'H. Entrada', 'H. Salida', 'Actividad', 'Registrado Por', 'Tardanza', 'Estado', 'Justificación']],
        body: tableData,
        startY: 38,
        styles: {
          fontSize: 7,
          cellPadding: 2,
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        headStyles: {
          fillColor: [102, 126, 234], // Color morado/azul
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251]
        },
        columnStyles: {
          0: { cellWidth: 18 }, // Fecha
          1: { cellWidth: 30 }, // Profesor
          2: { cellWidth: 25 }, // Especialidad
          3: { cellWidth: 18 }, // H. Entrada
          4: { cellWidth: 18 }, // H. Salida
          5: { cellWidth: 35 }, // Actividad
          6: { cellWidth: 20 }, // Registrado Por
          7: { cellWidth: 15 }, // Tardanza
          8: { cellWidth: 22 }, // Estado
          9: { cellWidth: 35 }  // Justificación
        },
        margin: { top: 38, left: 14, right: 14 },
        didParseCell: (data: any) => {
          // Colorear filas según estado
          if (data.row.index >= 0 && data.section === 'body') {
            const attendance = filteredData[data.row.index];
            const estadoColor = this.getEstadoColor(attendance);
            
            if (estadoColor === 'success') {
              data.cell.styles.fillColor = [209, 250, 229]; // Verde claro
            } else if (estadoColor === 'info') {
              data.cell.styles.fillColor = [219, 234, 254]; // Azul claro
            } else if (estadoColor === 'warning') {
              data.cell.styles.fillColor = [254, 243, 199]; // Amarillo claro
            } else if (estadoColor === 'danger') {
              data.cell.styles.fillColor = [254, 226, 226]; // Rojo claro
            }
          }
        }
      });

      // Guardar el PDF
      doc.save(`${this.getReportFileName()}.pdf`);

      this.successMessage = 'Reporte exportado a PDF exitosamente';
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    } catch (error: any) {
      console.error('Error al exportar a PDF:', error);
      this.errorMessage = 'Error al exportar el archivo PDF: ' + (error.message || 'Error desconocido');
    }
  }
}
