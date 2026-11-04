import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ApiReport } from './reports-api.service';

export interface Counts {
  total: number; pending: number; resolved: number; closed: number;
  byStatus: Record<string, number>; byPriority: Record<string, number>;
}
export interface LoadGroup extends Counts {
  specialtyId: number | null; specialtyName: string | null;
  assigneeId: number | null; assigneeName: string | null;
}
export interface LoadSummary {
  summary: Counts; byArea: LoadGroup[]; byTechnician: LoadGroup[];
  byAreaAndTechnician: LoadGroup[];
}
export interface LoadPage { total: number; limit: number; offset: number; items: ApiReport[]; }
export type LoadFilters = Record<string, string | number | boolean>;
@Injectable({ providedIn: 'root' })
export class WorkloadApiService {
  private readonly http = inject(HttpClient);
  summary(filters: LoadFilters = {}) {
    return this.http.get<LoadSummary>(`${environment.apiUrl}/workload`, { params: this.params(filters) });
  }
  reports(filters: LoadFilters) {
    return this.http.get<LoadPage>(`${environment.apiUrl}/workload/reports`, { params: this.params(filters) });
  }
  private params(filters: LoadFilters) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== '') params = params.set(key, value);
    }
    return params;
  }
}
