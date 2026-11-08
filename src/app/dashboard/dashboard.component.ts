import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: '../workload/workload.css'
})
export class DashboardComponent implements OnInit {
  // Inicializado en ceros reales
  kpis: any = {
    total_activas: 0,
    en_progreso: 0,
    bloqueadas: 0,
    vencidas: 0,
    resueltas: 0
  };
  areas: any[] = [];
  alertasVencidas: any[] = [];
  cargando: boolean = false;
  errorCarga: string | null = null;

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.errorCarga = null;
    this.cdr.markForCheck();

    this.dashboardService.obtenerDatos().subscribe({
      next: (data) => {
        console.log('Datos reales recibidos del backend:', data);
        if (data) {
          // Asignar los datos directos del backend
          this.kpis = data.kpis || {
            total_activas: data.total_activas ?? 0,
            en_progreso: data.en_progreso ?? 0,
            bloqueadas: data.bloqueadas ?? 0,
            vencidas: data.vencidas ?? 0,
            resueltas: data.resueltas ?? 0
          };
          this.areas = data.areas || data.resumen_areas || [];
          this.alertasVencidas = data.alertas_vencidas || data.alertas || [];
        }
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al consultar endpoint /api/dashboard/operativo:', err);
        this.errorCarga = 'No se pudieron sincronizar las métricas reales con el servidor.';
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }
}
