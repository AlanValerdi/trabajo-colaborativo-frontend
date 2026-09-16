import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'inicio',
    renderMode: RenderMode.Client,
  },
  {
    path: 'inicio/comunidad',
    renderMode: RenderMode.Client,
  },
  {
    path: 'inicio/reportes/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
