import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface Horario {
  id?: number;
  hora_entrada: string; // Formato HH:mm
  hora_salida: string; // Formato HH:mm
  tolerancia_entrada?: number; // Tolerancia en minutos para considerar tardanza (por defecto 30)
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class HorariosService {
  private apiUrl = 'http://localhost:3002/horarios';

  constructor(private http: HttpClient) {}

  // Obtener todos los horarios
  getHorarios(): Observable<Horario[]> {
    return this.http.get<Horario[]>(this.apiUrl);
  }

  // Obtener un horario por ID
  getHorarioById(id: number): Observable<Horario> {
    return this.http.get<Horario>(`${this.apiUrl}/${id}`);
  }

  // Crear un nuevo horario
  crearHorario(horario: Horario): Observable<Horario> {
    return this.http.post<Horario>(`${this.apiUrl}/create`, horario);
  }

  // Actualizar un horario
  actualizarHorario(id: number, horario: Partial<Horario>): Observable<Horario> {
    return this.http.put<Horario>(`${this.apiUrl}/update/${id}`, horario);
  }

  // Eliminar un horario
  eliminarHorario(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/delete/${id}`);
  }
}

