import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface AttendanceReport {
  id: number;
  professor: {
    id: number;
    name: string;
    departamentoId?: number | null;
    horarioId?: number | null;
  };
  fecha: string;
  year: number;
  month: number;
  entryTime: string | null;
  exitTime: string | null;
  activity: string | null;
  isManual: boolean;
  markedBy: string | null;
  justification: string | null;
  isLate: boolean;
  attendanceId: number | null;
  createdAt: string;
}

export interface ReportStats {
  year: number;
  month: number;
  totalReports: number;
  withEntry: number;
  withExit: number;
  justified: number;
  absences: number;
  manual: number;
  tardanzas?: number;
  reports: AttendanceReport[];
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  // Obtener reportes por año y mes
  getByYearMonth(year: number, month: number, professorId?: number): Observable<AttendanceReport[]> {
    let url = `${this.apiUrl}/year/${year}/month/${month}`;
    if (professorId) {
      url += `?professorId=${professorId}`;
    }
    return this.http.get<AttendanceReport[]>(url);
  }

  // Obtener reportes por año
  getByYear(year: number, professorId?: number): Observable<AttendanceReport[]> {
    let url = `${this.apiUrl}/year/${year}`;
    if (professorId) {
      url += `?professorId=${professorId}`;
    }
    return this.http.get<AttendanceReport[]>(url);
  }

  // Obtener reportes por rango de fechas
  getByDateRange(startDate: string, endDate: string, professorId?: number): Observable<AttendanceReport[]> {
    return this.http.post<AttendanceReport[]>(`${this.apiUrl}/date-range`, {
      startDate,
      endDate,
      professorId: professorId || undefined,
    });
  }

  // Obtener reportes de un profesor específico
  getByProfessor(professorId: number, year?: number, month?: number): Observable<AttendanceReport[]> {
    let url = `${this.apiUrl}/professor/${professorId}`;
    const params: string[] = [];
    if (year) params.push(`year=${year}`);
    if (month) params.push(`month=${month}`);
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    return this.http.get<AttendanceReport[]>(url);
  }

  // Obtener estadísticas por año y mes
  getStatsByYearMonth(year: number, month: number): Observable<ReportStats> {
    return this.http.get<ReportStats>(`${this.apiUrl}/stats/year/${year}/month/${month}`);
  }

  // Sincronizar todas las asistencias existentes a reportes
  syncAllAttendances(): Observable<{ synced: number; errors: number; skipped: number }> {
    return this.http.post<{ synced: number; errors: number; skipped: number }>(`${this.apiUrl}/sync-all`, {});
  }

  // Obtener estado de sincronización
  getSyncStatus(): Observable<{ totalAttendances: number; totalReports: number; pending: number; percentage: string }> {
    return this.http.get<{ totalAttendances: number; totalReports: number; pending: number; percentage: string }>(`${this.apiUrl}/sync-status`);
  }
}

