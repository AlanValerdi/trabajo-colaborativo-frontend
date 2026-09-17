import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private timer: ReturnType<typeof setTimeout> | null = null;

  readonly message = signal<string | null>(null);

  show(text: string, durationMs = 3500): void {
    this.message.set(text);
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.message.set(null);
      this.timer = null;
    }, durationMs);
  }
}
