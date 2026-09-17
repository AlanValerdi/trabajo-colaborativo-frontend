import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm?: () => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly open = signal(false);
  readonly title = signal('Confirmar acción');
  readonly message = signal('');
  readonly confirmLabel = signal('Confirmar');
  readonly cancelLabel = signal('Cancelar');
  readonly danger = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  private onConfirmCallback: (() => void) | null = null;

  ask(options: ConfirmOptions): void {
    queueMicrotask(() => {
      this.title.set(options.title ?? 'Confirmar acción');
      this.message.set(options.message);
      this.confirmLabel.set(options.confirmLabel ?? 'Confirmar');
      this.cancelLabel.set(options.cancelLabel ?? 'Cancelar');
      this.danger.set(options.danger ?? false);
      this.busy.set(false);
      this.error.set(null);
      this.onConfirmCallback = options.onConfirm ?? null;
      this.open.set(true);
    });
  }

  setBusy(value: boolean): void {
    this.busy.set(value);
  }

  setError(message: string | null): void {
    this.error.set(message);
  }

  confirm(): void {
    if (this.busy()) {
      return;
    }
    this.onConfirmCallback?.();
  }

  cancel(): void {
    this.close();
  }

  close(): void {
    this.open.set(false);
    this.busy.set(false);
    this.error.set(null);
    this.onConfirmCallback = null;
  }
}
