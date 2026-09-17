import { Component, input, output } from '@angular/core';
import { LucideX } from '@lucide/angular';

@Component({
  selector: 'app-dialog',
  imports: [LucideX],
  templateUrl: './dialog.html',
  styleUrl: './dialog.css',
})
export class Dialog {
  readonly open = input(false);
  readonly title = input('');
  readonly showClose = input(true);
  readonly layer = input<'default' | 'confirm'>('default');
  readonly titleId = input('app-dialog-title');

  readonly closed = output<void>();

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closed.emit();
    }
  }

  protected close(): void {
    this.closed.emit();
  }
}
