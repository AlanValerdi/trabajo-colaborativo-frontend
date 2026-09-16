import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  catchError,
  finalize,
  map,
  of,
  shareReplay,
  tap,
  throwError,
} from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AccessTokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active?: boolean;
  created_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiUrl = environment.apiUrl;

  private refreshRequest: Observable<string> | null = null;

  readonly currentUser = signal<UserProfile | null>(null);
  readonly sessionReady = signal(false);
  readonly sessionLoading = signal(false);

  register(data: unknown): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/auth/register`, data);
  }

  login(data: unknown): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/auth/login`, data).pipe(
      tap((response: TokenResponse) => {
        this.setTokens(response);
        this.loadProfile().subscribe();
      }),
    );
  }

  bootstrapSession(): Observable<UserProfile | null> {
    if (!isPlatformBrowser(this.platformId)) {
      this.sessionReady.set(true);
      return of(null);
    }

    if (!this.isAuthenticated()) {
      this.currentUser.set(null);
      this.sessionReady.set(true);
      return of(null);
    }

    this.sessionLoading.set(true);
    return this.loadProfile().pipe(
      catchError(() => {
        this.clearTokens();
        this.currentUser.set(null);
        return of(null);
      }),
      finalize(() => {
        this.sessionLoading.set(false);
        this.sessionReady.set(true);
      }),
    );
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/auth/me`);
  }

  refreshAccessToken(): Observable<string> {
    if (this.refreshRequest) {
      return this.refreshRequest;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token'));
    }

    this.refreshRequest = this.http
      .post<AccessTokenResponse>(`${this.apiUrl}/auth/refresh`, {
        refresh_token: refreshToken,
      })
      .pipe(
        tap((response) => this.setAccessToken(response.access_token)),
        map((response) => response.access_token),
        catchError((error) => {
          this.clearTokens();
          this.currentUser.set(null);
          return throwError(() => error);
        }),
        finalize(() => {
          this.refreshRequest = null;
        }),
        shareReplay(1),
      );

    return this.refreshRequest;
  }

  logout(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.http.post(`${this.apiUrl}/auth/logout`, { refresh_token: refreshToken }).subscribe({
        next: () => this.finishLogout(),
        error: () => this.finishLogout(),
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

  private loadProfile(): Observable<UserProfile> {
    return this.getProfile().pipe(tap((profile) => this.currentUser.set(profile)));
  }

  setTokens(tokens: TokenResponse): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('access_token', tokens.access_token);
      localStorage.setItem('refresh_token', tokens.refresh_token);
    }
  }

  setAccessToken(accessToken: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('access_token', accessToken);
    }
  }

  getAccessToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  getRefreshToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('refresh_token');
    }
    return null;
  }

  clearTokens(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}
