import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class AttendancesService {
  private apiUrl = `${environment.apiUrl}/attendances`; // URL base

  constructor(private http: HttpClient) {}

  // Traer todas las asistencias
  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl); // sin /all
  }

  // Marcar asistencia manualmente
  markManual(data: {
    professorId: number;
    type: 'entry' | 'exit';
    dateTime: string;
    justification: string;
    markedBy: string;
    dni?: string;
    activity?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/manual`, data);
  }

  // Crear hojas de asistencia masivas para un mes
  createMonthlySheets(year: number, month: number, professorIds?: number[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create-monthly-sheets`, {
      year,
      month,
      professorIds: professorIds || undefined,
    });
  }

  // Eliminar asistencias duplicadas
  removeDuplicates(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/remove-duplicates`, {});
  }

  // Eliminar todas las asistencias
  deleteAllAttendances(): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/delete-all`);
  }

  // Justificar ausencia o retraso (para administradores)
  justifyAttendance(data: {
    professorId: number;
    date: string; // Formato YYYY-MM-DD
    type: 'absence' | 'delay' | 'early_exit';
    justification: string;
    markedBy?: string; // Opcional: nombre de quien justifica (admin)
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/justify`, data);
  }

  // Obtener asistencias por mes y año
  getByMonthYear(year: number, month: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/report/month/${year}/${month}`);
  }

  // Obtener asistencias por rango de fechas
  getByDateRange(startDate: string, endDate: string, professorId?: number): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/report/range`, {
      startDate,
      endDate,
      professorId
    });
  }

  // Obtener estadísticas mensuales
  getMonthlyStats(year: number, month: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/report/stats/${year}/${month}`);
  }

  // Verificar si un profesor tiene asistencia real para una fecha
  checkRealAttendance(professorId: number, date: string): Observable<{ hasRealAttendance: boolean }> {
    return this.http.get<{ hasRealAttendance: boolean }>(`${this.apiUrl}/check-real/${professorId}/${date}`);
  }
}
