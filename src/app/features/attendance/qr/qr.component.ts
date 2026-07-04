import { Component, OnInit } from '@angular/core';
import { QrService } from '../qr.service';
import { QrCode, LucideAngularModule, Clock, FileText, CheckCircle, AlertCircle, XCircle, X, Calendar } from 'lucide-angular';
import { QRCodeComponent } from "angularx-qrcode";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-qr',

  templateUrl: './qr.component.html',
  styleUrls: ['./qr.component.scss'],
  imports: [LucideAngularModule, QRCodeComponent,CommonModule,FormsModule]
})
export class QrComponent implements OnInit {
  readonly QrCode = QrCode;
  readonly Clock = Clock;
  readonly FileText = FileText;
  readonly CheckCircle = CheckCircle;
  readonly AlertCircle = AlertCircle;
  readonly XCircle = XCircle;
  readonly X = X;
  readonly Calendar = Calendar;

  qrValue: string | null = null;
  qrSize: number = 220;
  inputValue: string = '';
  activeQr: any = null;
  history: any[] = [];
  message: string = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private qrService: QrService) {}

  ngOnInit(): void {
    this.loadQrs();
  }

  loadQrs() {
    this.qrService.getAll().subscribe({
      next: (data) => {
        // Filtrar MANUAL_MARK del historial (no debe aparecer)
        this.history = data.filter((q: any) => q.token !== 'MANUAL_MARK');
        this.activeQr = data.find((q: any) => q.activo && q.token !== 'MANUAL_MARK');
        this.qrValue = this.activeQr ? this.activeQr.token : null;
      },
      error: () => this.showMessage('Error al cargar QR', 'error')
    });
  }

  generarQr() {
    if (this.activeQr) {
      const confirmar = confirm('Ya existe un QR activo. ¿Deseas desactivarlo y generar uno nuevo?');
      if (!confirmar) return;

      // Desactivar QR anterior antes de crear uno nuevo
      this.qrService.deactivateQr(this.activeQr.id).subscribe({
        next: () => this.createNewQr(),
        error: () => this.showMessage('Error al desactivar QR anterior', 'error')
      });
    } else {
      this.createNewQr();
    }
  }

  createNewQr() {
    this.qrService.create(this.inputValue.trim()).subscribe({
      next: (res) => {
        this.showMessage('Nuevo QR generado correctamente', 'success');
        this.loadQrs();
      },
      error: () => this.showMessage('Error al generar nuevo QR', 'error')
    });
  }

  desactivarQr(qrId: number) {
    this.qrService.deactivateQr(qrId).subscribe({
      next: () => {
        this.showMessage('QR desactivado correctamente', 'success');
        this.loadQrs();
      },
      error: () => this.showMessage('Error al desactivar QR', 'error')
    });
  }

  showMessage(msg: string, type: 'success' | 'error') {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => this.message = '', 3000);
  }

  get inactiveQrsCount(): number {
    return this.history.filter(h => !h.activo).length;
  }
}
