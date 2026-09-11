import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Signup } from './signup/signup';
import { Shell } from './shell/shell';
import { Home } from './home/home';
import { ReportDetail } from './report-detail/report-detail';

export const routes: Routes = [
  { path: '', component: Login },
  { path: 'login', component: Login },
  { path: 'registro', component: Signup },
  {
    path: 'inicio',
    component: Shell,
    children: [
      { path: '', component: Home },
      { path: 'reportes/:id', component: ReportDetail },
    ],
  },
];
