import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  readonly reportTitle = signal<string | null>(null);
}
