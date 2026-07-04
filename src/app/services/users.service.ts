import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

export interface Professor {
  id: number;
  name: string;
  specialty?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'professor';
  professor?: Professor | null;
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  // Obtener todos los usuarios
  getAll(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  // Obtener solo profesores
  getProfessors(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/professors`);
  }

  // Obtener solo administradores
  getAdmins(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/admins`);
  }
}

