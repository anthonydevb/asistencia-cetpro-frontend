import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface Justificacion {
  id: number;
  profesorId: number;
  profesor?: {
    id: number;
    name: string;
    email: string;
    specialty?: string;
  };
  fecha: string;
  tipo: 'enfermedad' | 'emergencia' | 'permiso' | 'festivo' | 'otro';
  descripcion: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  motivoRechazo?: string;
  adminId?: number;
  admin?: {
    id: number;
    name: string;
    email: string;
  };
  fechaCreacion: Date;
  fechaActualizacion: Date;
  fechaAprobacion?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class JustificacionesService {
  private apiUrl = `${environment.apiUrl}/justificaciones`;

  constructor(private http: HttpClient) {}

  // Obtener justificaciones pendientes
  getJustificacionesPendientes(): Observable<Justificacion[]> {
    return this.http.get<Justificacion[]>(`${this.apiUrl}/pendientes/todas`);
  }

  // Obtener todas las justificaciones
  getAllJustificaciones(): Observable<Justificacion[]> {
    return this.http.get<Justificacion[]>(`${this.apiUrl}/todas/todas`);
  }

  // Obtener justificación por ID
  getJustificacionById(id: number): Observable<Justificacion> {
    return this.http.get<Justificacion>(`${this.apiUrl}/${id}`);
  }

  // Aprobar justificación
  aprobarJustificacion(id: number, adminId: number): Observable<Justificacion> {
    return this.http.put<Justificacion>(`${this.apiUrl}/${id}/aprobar`, { adminId });
  }

  // Rechazar justificación
  rechazarJustificacion(id: number, adminId: number, motivoRechazo: string): Observable<Justificacion> {
    return this.http.put<Justificacion>(`${this.apiUrl}/${id}/rechazar`, { adminId, motivoRechazo });
  }
}

