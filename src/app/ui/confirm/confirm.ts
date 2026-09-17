import { Component, inject } from '@angular/core';
import { Dialog } from '../dialog/dialog';
import { ConfirmService } from './confirm.service';

@Component({
  selector: 'app-confirm',
  imports: [Dialog],
  templateUrl: './confirm.html',
  styleUrl: './confirm.css',
})
export class Confirm {
  protected readonly confirm = inject(ConfirmService);

  protected onConfirm(): void {
    this.confirm.confirm();
  }

  protected onCancel(): void {
    this.confirm.cancel();
  }
}
