import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

export interface Materia {
  id?: number;
  nombre_materia: string;
  codigo_materia?: string;
  creditos?: number;
}

export interface Horario {
  id?: number;
  dia_semana: string;
  hora_inicio?: string;
  hora_fin?: string;
  materia?: Materia;
  aula?: {
    id?: number;
    nombre_aula: string;
    ubicacion?: string;
    capacidad?: number;
  };
}

export interface Profesor {
  id?: number;
  name: string;
  apellidos?: string;
  dni?: string;
  phone?: string;
  address?: string;
  departamentoId?: number | null;
  horarioId?: number | null;
  email: string;
  password?: string;
  role?: string;
  lastLogin?: string;
  materias?: Materia[];
  horarios?: Horario[];
}

@Injectable({
  providedIn: 'root'
})
export class ProfesoresService {
  actualizarUsuario(editingProfesorId: number, profesorData: Profesor) {
    throw new Error('Method not implemented.');
  }

  private apiUrl = `${environment.apiUrl}/professors`;

  constructor(private http: HttpClient) {}

  // Listar todos los profesores
  getProfesores(): Observable<Profesor[]> {
    return this.http.get<Profesor[]>(this.apiUrl);
  }

  // Crear un profesor
  crearProfesor(profesor: Profesor): Observable<Profesor> {
    return this.http.post<Profesor>(`${this.apiUrl}/create`, profesor);
  }

  // Actualizar un profesor
  actualizarProfesor(id: number, profesor: Partial<Profesor>): Observable<Profesor> {
    return this.http.put<Profesor>(`${this.apiUrl}/update/${id}`, profesor);
  }

  // Eliminar un profesor
  eliminarProfesor(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/delete/${id}`);
  }

  // Obtener profesor por ID (con contraseña)
  getProfesorById(id: number): Observable<Profesor> {
    return this.http.get<Profesor>(`${this.apiUrl}/${id}`);
  }

  // Consultar datos por DNI desde la API externa
  consultarPorDni(dni: string): Observable<{ name: string; apellidos?: string }> {
    return this.http.get<{ name: string; apellidos?: string }>(`${this.apiUrl}/consult-dni/${dni}`);
  }
}
