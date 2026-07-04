import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class QrService {
  private apiUrl = `${environment.apiUrl}/qr`;

  constructor(private http: HttpClient) {}

  // Obtener todos los QR
  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all`);
  }

  // Crear nuevo QR (solo si no hay activo)
  create(name?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, { name });
  }

  // Desactivar QR
  deactivateQr(id: number): Observable<any> {
  return this.http.patch(`${this.apiUrl}/deactivate/${id}`, {});
}

}
