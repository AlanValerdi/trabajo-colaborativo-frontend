import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { passwordsMatchValidator } from './passwords-match.validator';
import { AuthService } from '../auth/auth.service';
import { CommonModule } from '@angular/common';
import { LucideClipboardList } from '@lucide/angular';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink, CommonModule, LucideClipboardList],
  templateUrl: './signup.html',
  styleUrl: '../auth/auth-page.css',
})
export class Signup {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  public errorMessage = '';

  protected readonly form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator },
  );

  protected onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.valid) {
      const { name, email, password } = this.form.value;
      this.authService.register({ name, email, password }).subscribe({
        next: () => {
          void this.router.navigateByUrl('/login');
        },
        error: (err) => {
          this.errorMessage = err.error?.detail || 'Error al registrar usuario';
          console.error('Signup error', err);
        }
      });
    }
  }
}

