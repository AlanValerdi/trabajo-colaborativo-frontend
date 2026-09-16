import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Signup } from './signup/signup';
import { Shell } from './shell/shell';
import { Home } from './home/home';
import { ReportDetail } from './report-detail/report-detail';
import { Community } from './community/community';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', component: Login },
  { path: 'login', component: Login },
  { path: 'registro', component: Signup },
  {
    path: 'inicio',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', component: Home },
      { path: 'comunidad', component: Community },
      { path: 'reportes/:id', component: ReportDetail },
    ],
  },
];
