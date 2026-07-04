import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface Departamento {
  id?: number;
  nombre: string;
  descripcion?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class DepartamentosService {
  private apiUrl = `${environment.apiUrl}/departamentos`;

  constructor(private http: HttpClient) {}

  // Obtener todos los departamentos
  getDepartamentos(): Observable<Departamento[]> {
    return this.http.get<Departamento[]>(this.apiUrl);
  }

  // Obtener un departamento por ID
  getDepartamentoById(id: number): Observable<Departamento> {
    return this.http.get<Departamento>(`${this.apiUrl}/${id}`);
  }

  // Crear un nuevo departamento
  crearDepartamento(departamento: Departamento): Observable<Departamento> {
    return this.http.post<Departamento>(`${this.apiUrl}/create`, departamento);
  }

  // Actualizar un departamento
  actualizarDepartamento(id: number, departamento: Partial<Departamento>): Observable<Departamento> {
    return this.http.put<Departamento>(`${this.apiUrl}/update/${id}`, departamento);
  }

  // Eliminar un departamento
  eliminarDepartamento(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/delete/${id}`);
  }
}

