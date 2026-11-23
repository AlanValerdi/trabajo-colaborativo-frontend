import { Workload } from './workload/workload';
import { workloadGuard } from './auth/workload.guard';
import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Signup } from './signup/signup';
import { Shell } from './shell/shell';
import { Home } from './home/home';
import { ReportDetail } from './report-detail/report-detail';
import { Community } from './community/community';
import { LocationHistory } from './location-history/location-history';
import { authGuard } from './auth/auth.guard';
import { roleGuard } from './auth/role.guard';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ReportsComponent } from './reports/reports.component';

export const routes: Routes = [
  { path: '', component: Login },
  { path: 'login', component: Login },
  { path: 'registro', component: Signup },
  // Ruta directa para pruebas inmediatas sin depender del login
  { path: 'dashboard', component: DashboardComponent },
  {
    path: 'reportes',
    component: Shell,
    canActivate: [roleGuard],
    data: { roles: ['coordinador', 'responsable_area', 'administrador'] },
    children: [{ path: '', component: ReportsComponent }],
  },
  {
    path: 'inicio',
    component: Shell,
    // canActivate: [authGuard],
    children: [
      { path: '', component: Home },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'cargas', component: Workload, canActivate: [workloadGuard] },
      {
        path: 'reportes-atencion',
        loadComponent: () => import('./analytics/analytics').then(m => m.Analytics),
        canActivate: [roleGuard],
        data: { roles: ['administrador', 'coordinador', 'responsable_area'] },
      },
      { path: 'comunidad', component: Community },
      { path: 'reportes/:id', component: ReportDetail },
      {
        path: 'espacios/:locationId/historial',
        component: LocationHistory,
        canActivate: [roleGuard],
        data: { roles: ['coordinador', 'responsable_area', 'administrador'] },
      },
      {
        path: 'espacios',
        component: Home,
        canActivate: [roleGuard],
        data: {
          adminContext: 'espacios',
          roles: ['coordinador', 'responsable_area', 'administrador'],
        },
      },
    ],
  },
];
