import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface Admin {
  id?: number;
  name: string;
  email: string;
  password?: string;
  role: 'admin';
}

@Injectable({
  providedIn: 'root'
})
export class AdministradorService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  createAdmin(admin: Admin): Observable<Admin> {
    return this.http.post<Admin>(`${this.apiUrl}/create`, admin);
  }

  getAdmins(): Observable<Admin[]> {
    return this.http.get<Admin[]>(`${this.apiUrl}/admins`);
  }

  updateAdmin(id: number, data: Partial<Admin>): Observable<Admin> {
    return this.http.put<Admin>(`${this.apiUrl}/update/${id}`, data);
  }

  deleteAdmin(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${id}`);
  }
}
