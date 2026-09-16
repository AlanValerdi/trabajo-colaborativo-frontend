import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { CommonModule } from '@angular/common';
import { LucideClipboardList } from '@lucide/angular';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, CommonModule, LucideClipboardList],
  templateUrl: './login.html',
  styleUrl: '../auth/auth-page.css',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  public errorMessage = '';

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.valid) {
      this.authService.login(this.form.value).subscribe({
        next: () => {
          void this.router.navigateByUrl('/inicio');
        },
        error: (err) => {
          this.errorMessage = err.error?.detail || 'Error al iniciar sesión';
          console.error('Login error', err);
        }
      });
    }
  }
}

