import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = environment.apiUrl;

  readonly currentUser = signal<any>(null);

  constructor() {
    if (this.isAuthenticated()) {
      this.getProfile().subscribe();
    }
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, data);
  }

  login(data: any): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/auth/login`, data).pipe(
      tap((response: TokenResponse) => {
        this.setTokens(response);
        this.getProfile().subscribe();
      })
    );
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/me`).pipe(
      tap((profile) => this.currentUser.set(profile))
    );
  }

  logout(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      // Opcional: Llamar al endpoint de logout en el backend
      this.http.post(`${this.apiUrl}/auth/logout`, { refresh_token: refreshToken }).subscribe({
        next: () => this.finishLogout(),
        error: () => this.finishLogout()
      });
    } else {
      this.finishLogout();
    }
  }

  private finishLogout(): void {
    this.clearTokens();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  setTokens(tokens: TokenResponse): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', tokens.access_token);
      localStorage.setItem('refresh_token', tokens.refresh_token);
    }
  }

  getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh_token');
    }
    return null;
  }

  clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}
