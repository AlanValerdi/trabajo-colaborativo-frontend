import { Component, input } from '@angular/core';

/**
 * Spinner de carga reutilizable.
 *
 * Uso:
 *   <app-spinner />                          → spinner centrado con texto "Cargando…"
 *   <app-spinner label="Cargando reportes…" />
 *   <app-spinner size="sm" [inline]="true" /> → variante compacta para secciones
 */
@Component({
  selector: 'app-spinner',
  template: `
    <div
      class="spinner-wrap"
      [class.inline]="inline()"
      role="status"
      aria-live="polite"
    >
      <span
        class="spinner"
        [class.sm]="size() === 'sm'"
        aria-hidden="true"
      ></span>

      @if (label()) {
        <span class="spinner-label">{{ label() }}</span>
      }
    </div>
  `,
  styles: `
    .spinner-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 2rem 1rem;
      color: var(--text-muted, #64748b);
    }

    .spinner-wrap.inline {
      flex-direction: row;
      padding: 0.75rem 0;
      gap: 0.6rem;
    }

    .spinner {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 3px solid var(--border-subtle, #e2e8f0);
      border-top-color: var(--color-primary, #003b5c);
      animation: app-spinner-rotate 0.8s linear infinite;
    }

    .spinner.sm {
      width: 20px;
      height: 20px;
      border-width: 2px;
    }

    .spinner-label {
      font-size: 0.9rem;
    }

    @keyframes app-spinner-rotate {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class Spinner {
  readonly label = input<string>('Cargando…');
  readonly size = input<'md' | 'sm'>('md');
  readonly inline = input(false);
}
