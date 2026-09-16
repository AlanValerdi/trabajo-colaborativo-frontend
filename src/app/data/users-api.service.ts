import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  roles: string[];
  is_active: boolean;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  list(): Observable<ApiUser[]> {
    return this.http.get<ApiUser[]>(`${this.apiUrl}/users/`);
  }

  updateRoles(userId: number, roles: string[]): Observable<ApiUser> {
    return this.http.patch<ApiUser>(`${this.apiUrl}/users/${userId}/role`, { roles });
  }
}
